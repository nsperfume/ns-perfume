import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { limitByIp } from "@/lib/rate-limit";
import { adminPasswordProblem, hashPassword, issueAdminSession, requireAdmin, verifyPassword } from "@/lib/auth";
import { notifyAdminPasswordChanged } from "@/lib/email";
import { AdminUserModel } from "@/models/AdminUser";

/**
 * Change your own password. Needs the current one, signs out every other session
 * (tokenVersion bump) and keeps this one signed in with a fresh cookie.
 */
export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (!session) return jsonError("Unauthorized", 401);
  const limited = limitByIp(req, "admin-password", 10, 15 * 60_000);
  if (limited) return limited;

  const body = (await req.json().catch(() => ({}))) as { currentPassword?: unknown; newPassword?: unknown };
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  await connectDB();
  const user = await AdminUserModel.findById(session.sub);
  if (!user) return jsonError("Unauthorized", 401);

  if (!currentPassword || !(await verifyPassword(currentPassword, user.passwordHash))) {
    const msg = "Your current password is not right.";
    return jsonError(msg, 400, { fieldErrors: { currentPassword: msg } });
  }
  const problem = adminPasswordProblem(newPassword, user.email, user.name || "");
  if (problem) return jsonError(problem, 400, { fieldErrors: { newPassword: problem } });
  if (await verifyPassword(newPassword, user.passwordHash)) {
    const msg = "Choose a password you have not used for this account.";
    return jsonError(msg, 400, { fieldErrors: { newPassword: msg } });
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  user.mustChangePassword = false;
  user.resetTokenHash = null;
  user.resetTokenExpires = null;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  await issueAdminSession(user);
  notifyAdminPasswordChanged({ email: user.email, name: user.name || "there" });
  return jsonOk({ message: "Password updated. Other devices were signed out." });
}
