import { connectDB } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import {
  createAdminToken,
  hashPassword,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  verifyPassword,
  getAdminSession,
} from "@/lib/auth";
import { AdminUserModel } from "@/models/AdminUser";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError("Unauthorized", 401);
  return jsonOk({
    email: session.email,
    name: session.name,
    sub: session.sub,
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
     * Env bootstrap: if login matches ADMIN_EMAIL + ADMIN_PASSWORD,
     * create the owner (when missing) or re-sync the password hash.
     * Fixes stuck logins after an earlier seed with a different password.
     */
    if (email === bootstrapEmail && password === bootstrapPass) {
      let user = await AdminUserModel.findOne({ email: bootstrapEmail });
      if (!user) {
        user = await AdminUserModel.create({
          email: bootstrapEmail,
          name: "Store Owner",
          passwordHash: await hashPassword(bootstrapPass),
          role: "owner",
        });
      } else {
        user.passwordHash = await hashPassword(bootstrapPass);
        await user.save();
      }
      const token = await createAdminToken({
        sub: String(user._id),
        email: user.email,
        name: user.name,
      });
      await setAdminSessionCookie(token);
      return jsonOk({
        email: user.email,
        name: user.name,
        bootstrapped: true,
      });
    }

    const user = await AdminUserModel.findOne({ email });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return jsonError("Invalid email or password", 401);
    }
    const token = await createAdminToken({
      sub: String(user._id),
      email: user.email,
      name: user.name,
    });
    await setAdminSessionCookie(token);
    return jsonOk({ email: user.email, name: user.name });
  } catch (e) {
    console.error(e);
    return jsonError("Login failed", 500);
  }
}

export async function DELETE() {
  await clearAdminSessionCookie();
  return jsonOk({ loggedOut: true });
}
