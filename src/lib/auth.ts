import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  ADMIN_COOKIE as COOKIE,
  normalizeRole,
  signAdminToken,
  verifyAdminToken,
  type AdminRole,
} from "@/lib/admin-token";
import { AdminUserModel } from "@/models/AdminUser";

export type { AdminRole };

export type AdminSession = {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
};

export { normalizeRole, verifyAdminToken };

export function isSuperAdmin(session: { role?: unknown } | null | undefined) {
  return normalizeRole(session?.role) === "super_admin";
}

export function canDelete(session: { role?: unknown } | null | undefined) {
  return isSuperAdmin(session);
}

export function canViewRevenue(session: { role?: unknown } | null | undefined) {
  return isSuperAdmin(session);
}

export function canManageTeam(session: { role?: unknown } | null | undefined) {
  return isSuperAdmin(session);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createAdminToken(payload: AdminSession) {
  return signAdminToken(payload);
}

export async function setAdminSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/**
 * Verify the cookie token, then re-read the admin from the DB so removed
 * team members lose access at once and role changes apply on the next request.
 */
async function sessionFromToken(
  token: string | undefined,
): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const claims = await verifyAdminToken(token);
    await connectDB();
    const user = await AdminUserModel.findById(claims.sub)
      .select("email name role")
      .lean<{ _id: unknown; email: string; name?: string; role?: string }>();
    if (!user) return null;
    return {
      sub: String(user._id),
      email: user.email,
      name: user.name || "Admin",
      role: normalizeRole(user.role),
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  return sessionFromToken(jar.get(COOKIE)?.value);
}

export async function requireAdmin(req?: NextRequest): Promise<AdminSession | null> {
  const token =
    req?.cookies.get(COOKIE)?.value ||
    (await cookies()).get(COOKIE)?.value;
  return sessionFromToken(token);
}

export async function requireSuperAdmin(
  req?: NextRequest,
): Promise<AdminSession | null> {
  const session = await requireAdmin(req);
  if (!session || !isSuperAdmin(session)) return null;
  return session;
}

export { COOKIE as ADMIN_COOKIE };
