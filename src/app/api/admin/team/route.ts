import { z } from "zod";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import {
  ROLE_LABELS,
  adminPasswordProblem,
  forbiddenMessage,
  hashPassword,
  requireAdmin,
  requireSuperAdmin,
  type AdminRole,
} from "@/lib/auth";
import { emailConfigured, notifyAdminInvite } from "@/lib/email";
import { ROLE_ACCESS, ROLE_FROM_INPUT, toMember, type MemberDoc } from "@/lib/admin-team";
import { AdminUserModel } from "@/models/AdminUser";

/** Team list for the owner. */
export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) return jsonError(forbiddenMessage(await requireAdmin()), 403);
  await connectDB();
  const users = await AdminUserModel.find()
    .select("email name role active mustChangePassword lastLoginAt createdAt createdBy")
    .lean<MemberDoc[]>();
  const order: Record<AdminRole, number> = { super_admin: 0, admin: 1, viewer: 2 };
  const members = users
    .map((u) => toMember(u, admin.sub))
    .sort((a, b) => Number(b.active) - Number(a.active) || order[a.role] - order[b.role] || a.name.localeCompare(b.name));
  return jsonOk({ members, emailConfigured: emailConfigured(), roleAccess: ROLE_ACCESS });
}

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter their name").max(80, "Keep it under 80 characters"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  role: z.enum(["owner", "editor", "viewer"], { error: "Choose what they can do" }),
  password: z.string().min(1, "Set a temporary password"),
  sendEmail: z.boolean().optional().default(false),
});

/** Add a team member with a temporary password they must change on first sign-in. */
export async function POST(req: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) return jsonError(forbiddenMessage(await requireAdmin()), 403);
  try {
    const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
      return jsonError(Object.values(fieldErrors)[0] || "Check the highlighted fields", 400, { fieldErrors });
    }
    const { name, email, password, sendEmail } = parsed.data;
    const role = ROLE_FROM_INPUT[parsed.data.role]!;

    const problem = adminPasswordProblem(password, email, name);
    if (problem) return jsonError(problem, 400, { fieldErrors: { password: problem } });

    await connectDB();
    if (await AdminUserModel.exists({ email })) {
      const msg = "Someone on the team already uses this email.";
      return jsonError(msg, 409, { fieldErrors: { email: msg } });
    }

    const user = await AdminUserModel.create({
      email,
      name,
      passwordHash: await hashPassword(password),
      role,
      active: true,
      mustChangePassword: true,
      passwordChangedAt: new Date(),
      createdBy: admin.email,
    });

    if (sendEmail && emailConfigured()) {
      notifyAdminInvite(
        { email, name },
        { invitedBy: admin.name, roleLabel: ROLE_LABELS[role], access: ROLE_ACCESS[role] },
      );
    }
    return jsonOk({ member: toMember(user.toObject(), admin.sub) }, { status: 201 });
  } catch (e) {
    console.error(e);
    return jsonError("Could not add this team member. Please try again.", 500);
  }
}
