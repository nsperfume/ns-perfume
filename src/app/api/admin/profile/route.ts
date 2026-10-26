import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { ROLE_LABELS, issueAdminSession, requireAdmin } from "@/lib/auth";
import { AdminUserModel } from "@/models/AdminUser";

const iso = (d?: Date | null) => (d ? new Date(d).toISOString() : null);

/** The signed-in admin's own account. */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return jsonError("Unauthorized", 401);
  await connectDB();
  const user = await AdminUserModel.findById(session.sub)
    .select("email name role lastLoginAt passwordChangedAt createdAt mustChangePassword")
    .lean<{
      email: string;
      name?: string;
      lastLoginAt?: Date | null;
      passwordChangedAt?: Date | null;
      createdAt?: Date;
      mustChangePassword?: boolean;
    }>();
  if (!user) return jsonError("Unauthorized", 401);
  return jsonOk({
    email: user.email,
    name: user.name || "",
    role: session.role,
    roleLabel: ROLE_LABELS[session.role],
    lastLoginAt: iso(user.lastLoginAt),
    passwordChangedAt: iso(user.passwordChangedAt),
    createdAt: iso(user.createdAt),
    mustChangePassword: Boolean(user.mustChangePassword),
  });
}

const nameSchema = z.object({ name: z.string().trim().min(2, "Enter your name").max(80, "Keep it under 80 characters") });

/** Change your display name. Any role may do this. */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return jsonError("Unauthorized", 401);
  const parsed = nameSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Enter your name";
    return jsonError(msg, 400, { fieldErrors: { name: msg } });
  }
  await connectDB();
  const user = await AdminUserModel.findById(session.sub);
  if (!user) return jsonError("Unauthorized", 401);
  user.name = parsed.data.name;
  await user.save();
  // Refresh the cookie so the name in the session matches.
  await issueAdminSession(user);
  return jsonOk({ name: user.name });
}
