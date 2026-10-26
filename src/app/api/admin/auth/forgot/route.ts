import { createHash, randomBytes } from "node:crypto";
import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { limitByIp, rateLimit } from "@/lib/rate-limit";
import { emailConfigured, notifyAdminPasswordReset } from "@/lib/email";
import { AdminUserModel } from "@/models/AdminUser";

const SENT =
  "If that email belongs to an admin account, a reset link is on its way. It works once and expires in 1 hour.";

/**
 * Admin "forgot password". Always answers the same way so it never reveals which
 * emails have accounts. Only a hash of the token is stored.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: unknown };
    const email = String(body.email || "").toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Enter a valid email address.", 400);

    const limited =
      limitByIp(req, "admin-forgot", 5, 30 * 60_000) || rateLimit(`admin-forgot:${email}`, 3, 30 * 60_000);
    if (limited) return limited;

    if (!emailConfigured()) {
      return jsonError(
        "Password reset emails are not set up yet. Ask the store owner to reset your password from Settings > Team.",
        503,
      );
    }

    await connectDB();
    const user = await AdminUserModel.findOne({ email, active: { $ne: false } });
    if (user) {
      const token = randomBytes(32).toString("base64url");
      user.resetTokenHash = createHash("sha256").update(token).digest("hex");
      user.resetTokenExpires = new Date(Date.now() + 60 * 60_000);
      await user.save();
      notifyAdminPasswordReset({ email: user.email, name: user.name || "there" }, token);
    }
    return jsonOk({ message: SENT });
  } catch (e) {
    console.error(e);
    return jsonError("Could not send the reset email. Please try again.", 500);
  }
}
