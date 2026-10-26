import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import {
  ADMIN_COOKIE as COOKIE,
  ROLE_LABELS,
  normalizeRole,
  signAdminToken,
  verifyAdminToken,
  type AdminRole,
} from "@/lib/admin-token";
import { AdminUserModel } from "@/models/AdminUser";
import { jsonError } from "@/lib/api";

export type { AdminRole };

export type AdminSession = {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
  /** Session version; must match the account or the session is revoked. */
  ver: number;
  /** True until a temporary password (set by the owner) is replaced. */
  mustChangePassword: boolean;
};

export { normalizeRole, verifyAdminToken, ROLE_LABELS };

type Who = { role?: unknown } | null | undefined;

/** Owner: everything, including the team and store charges. */
export function isSuperAdmin(session: Who) {
  return normalizeRole(session?.role) === "super_admin";
}

/** Owners and editors can change data; viewers only look. */
export function canWrite(session: Who) {
  return Boolean(session) && normalizeRole(session?.role) !== "viewer";
}

export function canDelete(session: Who) {
  return isSuperAdmin(session);
}

export function canViewRevenue(session: Who) {
  return Boolean(session);
}

export function canManageTeam(session: Who) {
  return isSuperAdmin(session);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Real bcrypt hash, made once, compared when no account matches so timing does not reveal which emails exist. */
let dummyHash: Promise<string> | null = null;
export async function burnPasswordCheck(password: string) {
  dummyHash ??= bcrypt.hash("ns-perfume-timing-guard", 12);
  await bcrypt.compare(password, await dummyHash).catch(() => false);
}

/**
 * Admin password policy, shared by change, reset and team forms.
 * Returns a plain-language problem, or null when the password is acceptable.
 */
export function adminPasswordProblem(password: string, email = "", name = "") {
  if (password.length < 10) return "Use at least 10 characters.";
  if (password.length > 128) return "Use 128 characters or fewer.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return "Use letters and at least one number.";
  const lower = password.toLowerCase();
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (local.length >= 4 && lower.includes(local)) return "Do not include your email name in the password.";
  const first = name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (first.length >= 4 && lower.includes(first)) return "Do not include your name in the password.";
  if (/password|nsperfume|qwerty|123456/.test(lower)) return "This password is too easy to guess.";
  return null;
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

type AccountForSession = {
  _id: unknown;
  email: string;
  name?: string;
  role?: string;
  tokenVersion?: number;
};

/** Sign a session for an account and set the cookie. */
export async function issueAdminSession(user: AccountForSession) {
  const token = await signAdminToken({
    sub: String(user._id),
    email: user.email,
    name: user.name || "Admin",
    role: normalizeRole(user.role),
    ver: user.tokenVersion ?? 0,
  });
  await setAdminSessionCookie(token);
}

/**
 * Verify the cookie token, then re-read the account so removed, deactivated or
 * signed-out accounts lose access at once and role changes apply on the next request.
 */
async function sessionFromToken(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;
  try {
    const claims = await verifyAdminToken(token);
    await connectDB();
    const user = await AdminUserModel.findById(claims.sub)
      .select("email name role active tokenVersion mustChangePassword")
      .lean<{
        _id: unknown;
        email: string;
        name?: string;
        role?: string;
        active?: boolean;
        tokenVersion?: number;
        mustChangePassword?: boolean;
      }>();
    if (!user || user.active === false) return null;
    if ((user.tokenVersion ?? 0) !== claims.ver) return null;
    return {
      sub: String(user._id),
      email: user.email,
      name: user.name || "Admin",
      role: normalizeRole(user.role),
      ver: user.tokenVersion ?? 0,
      mustChangePassword: Boolean(user.mustChangePassword),
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  return sessionFromToken(jar.get(COOKIE)?.value);
}

/** Any signed-in team member (read access). */
export async function requireAdmin(req?: NextRequest): Promise<AdminSession | null> {
  const token = req?.cookies.get(COOKIE)?.value || (await cookies()).get(COOKIE)?.value;
  return sessionFromToken(token);
}

/**
 * Owners and editors who have set their own password. Use for every request that
 * changes data, so view-only accounts are refused on the server, not just hidden in the UI.
 */
export async function requireAdminWrite(req?: NextRequest): Promise<AdminSession | null> {
  const session = await requireAdmin(req);
  if (!session || !canWrite(session) || session.mustChangePassword) return null;
  return session;
}

/** Owner only (team, store charges, deletes). */
export async function requireSuperAdmin(req?: NextRequest): Promise<AdminSession | null> {
  const session = await requireAdmin(req);
  if (!session || !isSuperAdmin(session) || session.mustChangePassword) return null;
  return session;
}

/** Standard refusal text so the console can show it in a toast. */
export function forbiddenMessage(session: AdminSession | null) {
  if (!session) return "Please sign in again.";
  if (session.mustChangePassword) return "Choose a new password in Profile before making changes.";
  if (session.role === "viewer") return "You have view-only access. Ask the owner if you need to make changes.";
  return "Only the owner can do this.";
}

/**
 * Response for a refused admin request: 401 when signed out (the console sends them
 * to sign in), 403 with a plain reason when signed in without permission.
 */
export async function adminDenied(req?: NextRequest) {
  const session = await requireAdmin(req);
  return session ? jsonError(forbiddenMessage(session), 403) : jsonError("Unauthorized", 401);
}

export { COOKIE as ADMIN_COOKIE };
