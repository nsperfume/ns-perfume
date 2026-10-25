import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import {
  createAdminToken,
  hashPassword,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  verifyPassword,
  getAdminSession,
  normalizeRole,
} from "@/lib/auth";
import { AdminUserModel } from "@/models/AdminUser";
import { limitByIp, rateLimit } from "@/lib/rate-limit";
import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time string compare (hash first so lengths always match). */
function sameSecret(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

const SUPER_NAME = "Asim Ali";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  return jsonOk({
    email: session.email,
    name: session.name,
    sub: session.sub,
    role: session.role,
    isSuperAdmin: session.role === "super_admin",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    const limited =
      limitByIp(req, "admin-login", 10, 15 * 60_000) ||
      rateLimit(`admin-login:${email}`, 8, 15 * 60_000);
    if (limited) return limited;

    await connectDB();

    const bootstrapEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
    const bootstrapPass = process.env.ADMIN_PASSWORD || "";

    /**
     * Env bootstrap creates / re-syncs the super admin (Asim Ali).
     * Only when both ADMIN_EMAIL and ADMIN_PASSWORD are configured.
     */
    if (
      bootstrapEmail &&
      bootstrapPass &&
      email === bootstrapEmail &&
      sameSecret(password, bootstrapPass)
    ) {
      let user = await AdminUserModel.findOne({ email: bootstrapEmail });
      if (!user) {
        user = await AdminUserModel.create({
          email: bootstrapEmail,
          name: SUPER_NAME,
          passwordHash: await hashPassword(bootstrapPass),
          role: "super_admin",
        });
      } else {
        user.passwordHash = await hashPassword(bootstrapPass);
        user.role = "super_admin";
        if (!user.name || user.name === "Store Owner" || user.name === "Admin") {
          user.name = SUPER_NAME;
        }
        await user.save();
      }
      const role = normalizeRole(user.role);
      const token = await createAdminToken({
        sub: String(user._id),
        email: user.email,
        name: user.name,
        role,
      });
      await setAdminSessionCookie(token);
      return jsonOk({
        email: user.email,
        name: user.name,
        role,
        isSuperAdmin: role === "super_admin",
        bootstrapped: true,
      });
    }

    const user = await AdminUserModel.findOne({ email });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return jsonError("Invalid email or password", 401);
    }
    const role = normalizeRole(user.role);
    // Soft-upgrade legacy owner
    if (user.role === "owner") {
      user.role = "super_admin";
      await user.save();
    }
    const token = await createAdminToken({
      sub: String(user._id),
      email: user.email,
      name: user.name,
      role,
    });
    await setAdminSessionCookie(token);
    return jsonOk({
      email: user.email,
      name: user.name,
      role,
      isSuperAdmin: role === "super_admin",
    });
  } catch (e) {
    console.error(e);
    return jsonError("Login failed", 500);
  }
}

export async function DELETE() {
  await clearAdminSessionCookie();
  return jsonOk({ loggedOut: true });
}
