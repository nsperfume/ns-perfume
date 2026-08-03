import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const COOKIE = "ns_admin_session";

export type AdminRole = "super_admin" | "admin";

export type AdminSession = {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
};

function secret() {
  const s =
    process.env.ADMIN_JWT_SECRET || process.env.MONGODB_URI || "dev-secret";
  return new TextEncoder().encode(s.slice(0, 64));
}

/** Map legacy DB roles + JWT claims into super_admin | admin. */
export function normalizeRole(raw: unknown): AdminRole {
  const r = String(raw || "").toLowerCase();
  if (r === "super_admin" || r === "owner") return "super_admin";
  return "admin";
}

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

export async function createAdminToken(payload: {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
}) {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

function mapPayload(payload: Record<string, unknown>): AdminSession {
  return {
    sub: String(payload.sub || ""),
    email: String(payload.email || ""),
    name: String(payload.name || "Admin"),
    role: normalizeRole(payload.role),
  };
}

export async function verifyAdminToken(token: string): Promise<AdminSession> {
  const { payload } = await jwtVerify(token, secret());
  return mapPayload(payload as Record<string, unknown>);
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

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function requireAdmin(req?: NextRequest): Promise<AdminSession | null> {
  const token =
    req?.cookies.get(COOKIE)?.value ||
    (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function requireSuperAdmin(
  req?: NextRequest,
): Promise<AdminSession | null> {
  const session = await requireAdmin(req);
  if (!session || !isSuperAdmin(session)) return null;
  return session;
}

export { COOKIE as ADMIN_COOKIE };
