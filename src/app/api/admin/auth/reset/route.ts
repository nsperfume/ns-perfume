import { createHash } from "node:crypto";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { limitByIp } from "@/lib/rate-limit";
import { adminPasswordProblem, hashPassword } from "@/lib/auth";
import { notifyAdminPasswordChanged } from "@/lib/email";
import { AdminUserModel } from "@/models/AdminUser";

const EXPIRED = "This reset link has expired or was already used. Ask for a new one from the sign-in page.";

/** Set a new admin password from an emailed link. Signs out every session for the account. */
export async function POST(req: Request) {
  try {
    const limited = limitByIp(req, "admin-reset", 10, 30 * 60_000);
    if (limited) return limited;

    const body = (await req.json().catch(() => ({}))) as { token?: unknown; password?: unknown };
    const token = String(body.token || "");
    const password = String(body.password || "");
    if (!token) return jsonError(EXPIRED, 400);

    await connectDB();
    const user = await AdminUserModel.findOne({
      resetTokenHash: createHash("sha256").update(token).digest("hex"),
      resetTokenExpires: { $gt: new Date() },
      active: { $ne: false },
    });
    if (!user) return jsonError(EXPIRED, 400);

    const problem = adminPasswordProblem(password, user.email, user.name || "");
    if (problem) return jsonError(problem, 400, { fieldErrors: { password: problem } });

    user.passwordHash = await hashPassword(password);
    user.passwordChangedAt = new Date();
    user.mustChangePassword = false;
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    notifyAdminPasswordChanged({ email: user.email, name: user.name || "there" });
    return jsonOk({ message: "Password updated. Sign in with your new password." });
  } catch (e) {
    console.error(e);
    return jsonError("Could not update the password. Please try again.", 500);
  }
}
