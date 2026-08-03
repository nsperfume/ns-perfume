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
    await connectDB();
    const body = await req.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    const bootstrapEmail = (
      process.env.ADMIN_EMAIL || "admin@nsperfume.com"
    ).toLowerCase();
    const bootstrapPass =
      process.env.ADMIN_PASSWORD || "ChangeMeNSAdmin123!";

    /**
     * Env bootstrap creates / re-syncs the super admin (Asim Ali).
     */
    if (email === bootstrapEmail && password === bootstrapPass) {
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
