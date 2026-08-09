import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth";

const COOKIE = "ns_customer_session";

export type CustomerSession = {
  sub: string;
  email: string;
  name: string;
};

function secret() {
  const s =
    process.env.CUSTOMER_JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    process.env.MONGODB_URI ||
    "dev-customer-secret";
  return new TextEncoder().encode(s.slice(0, 64));
}

export async function createCustomerToken(payload: {
  sub: string;
  email: string;
  name: string;
}) {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifyCustomerToken(
  token: string,
): Promise<CustomerSession> {
  const { payload } = await jwtVerify(token, secret());
  return {
    sub: String(payload.sub || ""),
    email: String(payload.email || ""),
    name: String(payload.name || ""),
  };
}

export async function setCustomerSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCustomerSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyCustomerToken(token);
  } catch {
    return null;
  }
}

export async function requireCustomer(
  req?: NextRequest,
): Promise<CustomerSession | null> {
  const token =
    req?.cookies.get(COOKIE)?.value ||
    (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyCustomerToken(token);
  } catch {
    return null;
  }
}

export function googleOAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function googleRedirectUri(origin: string) {
  return (
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${origin.replace(/\/$/, "")}/api/auth/google/callback`
  );
}

export { COOKIE as CUSTOMER_COOKIE, hashPassword, verifyPassword };
