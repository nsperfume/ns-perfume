import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import {
  adminPasswordProblem,
  forbiddenMessage,
  hashPassword,
  normalizeRole,
  requireAdmin,
  requireSuperAdmin,
} from "@/lib/auth";
import { ROLE_FROM_INPUT, toMember } from "@/lib/admin-team";
import { AdminUserModel } from "@/models/AdminUser";

type Ctx = { params: Promise<{ id: string }> };

/** Other active owners besides this account; the store must always keep one. */
async function otherActiveOwners(excludeId: string) {
  return AdminUserModel.countDocuments({
    _id: { $ne: excludeId },
    role: { $in: ["super_admin", "owner"] },
    active: { $ne: false },
  });
}

const patchSchema = z
  .object({
    name: z.string().trim().min(2, "Enter their name").max(80, "Keep it under 80 characters").optional(),
    role: z.enum(["owner", "editor", "viewer"], { error: "Choose what they can do" }).optional(),
    active: z.boolean().optional(),
    /** New temporary password; they must change it at next sign-in. */
    password: z.string().min(1).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to change" });

/** Change a team member's name, role or access, or set a new temporary password. */
export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await requireSuperAdmin();
  if (!admin) return jsonError(forbiddenMessage(await requireAdmin()), 403);
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return jsonError("Team member not found", 404);

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message;
    return jsonError(Object.values(fieldErrors)[0] || "Check the highlighted fields", 400, { fieldErrors });
  }
  const change = parsed.data;

  try {
    await connectDB();
    const user = await AdminUserModel.findById(id);
    if (!user) return jsonError("Team member not found", 404);

    const isSelf = id === admin.sub;
    const currentRole = normalizeRole(user.role);
    const nextRole = change.role ? ROLE_FROM_INPUT[change.role]! : currentRole;

    if (isSelf && (change.role !== undefined || change.active !== undefined || change.password !== undefined)) {
      return jsonError("Change your own password in Profile. Another owner must change your role or access.", 400);
    }
    const losesOwner =
      currentRole === "super_admin" && user.active !== false && (nextRole !== "super_admin" || change.active === false);
    if (losesOwner && (await otherActiveOwners(id)) === 0) {
      return jsonError("The store needs at least one active owner. Make someone else an owner first.", 400);
    }

    if (change.name !== undefined) user.name = change.name;
    if (change.role !== undefined) user.role = nextRole;

    let signOut = false;
    if (change.active !== undefined && change.active !== (user.active !== false)) {
      user.active = change.active;
      if (!change.active) signOut = true;
      user.failedLoginCount = 0;
      user.lockedUntil = null;
    }
    if (change.password !== undefined) {
      const problem = adminPasswordProblem(change.password, user.email, user.name || "");
      if (problem) return jsonError(problem, 400, { fieldErrors: { password: problem } });
      user.passwordHash = await hashPassword(change.password);
      user.mustChangePassword = true;
      user.passwordChangedAt = new Date();
      user.resetTokenHash = null;
      user.resetTokenExpires = null;
      user.failedLoginCount = 0;
      user.lockedUntil = null;
      signOut = true;
    }
    if (signOut) user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();
    return jsonOk({ member: toMember(user.toObject(), admin.sub) });
  } catch (e) {
    console.error(e);
    return jsonError("Could not update this team member. Please try again.", 500);
  }
}

/** Remove a team member. Their sessions stop working on the next request. */
export async function DELETE(_req: Request, ctx: Ctx) {
  const admin = await requireSuperAdmin();
  if (!admin) return jsonError(forbiddenMessage(await requireAdmin()), 403);
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return jsonError("Team member not found", 404);
  if (id === admin.sub) return jsonError("You cannot remove your own account.", 400);
  try {
    await connectDB();
    const user = await AdminUserModel.findById(id);
    if (!user) return jsonError("Team member not found", 404);
    if (normalizeRole(user.role) === "super_admin" && user.active !== false && (await otherActiveOwners(id)) === 0) {
      return jsonError("The store needs at least one active owner.", 400);
    }
    await user.deleteOne();
    return jsonOk({ id });
  } catch (e) {
    console.error(e);
    return jsonError("Could not remove this team member. Please try again.", 500);
  }
}
