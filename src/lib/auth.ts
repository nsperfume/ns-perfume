import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const COOKIE = "ns_admin_session";

function secret() {
  const s = process.env.ADMIN_JWT_SECRET || process.env.MONGODB_URI || "dev-secret";
  return new TextEncoder().encode(s.slice(0, 64));
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
}) {
  return new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload;
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

export async function getAdminSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function requireAdmin(req?: NextRequest) {
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

export { COOKIE as ADMIN_COOKIE };
