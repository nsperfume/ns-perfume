import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import {
  ROLE_LABELS,
  burnPasswordCheck,
  canWrite,
  clearAdminSessionCookie,
  getAdminSession,
  isSuperAdmin,
  issueAdminSession,
  normalizeRole,
  verifyPassword,
} from "@/lib/auth";
import { AdminUserModel } from "@/models/AdminUser";
import { limitByIp, rateLimit } from "@/lib/rate-limit";

const MAX_FAILED = 8;
const LOCK_MINUTES = 15;
const WRONG = "Email or password is incorrect.";

/** Who is signed in, and what they may do. The console reads this on every page. */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  return jsonOk({
    email: session.email,
    name: session.name,
    sub: session.sub,
    role: session.role,
    roleLabel: ROLE_LABELS[session.role],
    isSuperAdmin: isSuperAdmin(session),
    canWrite: canWrite(session) && !session.mustChangePassword,
    mustChangePassword: session.mustChangePassword,
  });
}

/** Sign in with email and password from the database. There is no environment master login. */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    if (!email || !password) return jsonError("Enter your email and password.", 400);

    const limited =
      limitByIp(req, "admin-login", 20, 15 * 60_000) ||
      rateLimit(`admin-login:${email}`, 10, 15 * 60_000);
    if (limited) return limited;

    await connectDB();
    const user = await AdminUserModel.findOne({ email });

    if (!user) {
      await burnPasswordCheck(password);
      return jsonError(WRONG, 401);
    }

    const now = Date.now();
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > now) {
      const minutes = Math.ceil((new Date(user.lockedUntil).getTime() - now) / 60_000);
      return jsonError(
        `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}, or reset your password.`,
        429,
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      const failed = (user.failedLoginCount || 0) + 1;
      if (failed >= MAX_FAILED) {
        user.failedLoginCount = 0;
        user.lockedUntil = new Date(now + LOCK_MINUTES * 60_000);
      } else {
        user.failedLoginCount = failed;
      }
      await user.save();
      return jsonError(WRONG, 401);
    }

    // Correct password, but the owner switched this account off.
    if (user.active === false) {
      return jsonError("This account is turned off. Ask the store owner to turn it back on.", 403);
    }

    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date(now);
    if (user.role === "owner") user.role = "super_admin";
    if (user.role === "staff") user.role = "admin";
    await user.save();

    await issueAdminSession(user);
    const role = normalizeRole(user.role);
    return jsonOk({
      email: user.email,
      name: user.name,
      role,
      roleLabel: ROLE_LABELS[role],
      isSuperAdmin: role === "super_admin",
      mustChangePassword: Boolean(user.mustChangePassword),
    });
  } catch (e) {
    console.error(e);
    return jsonError("Sign in failed. Please try again.", 500);
  }
}

export async function DELETE() {
  await clearAdminSessionCookie();
  return jsonOk({ loggedOut: true });
}
