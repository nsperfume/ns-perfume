import { SignJWT, jwtVerify } from "jose";

/**
 * Admin JWT signing/verification only (jose, no DB) so `proxy.ts` can share it.
 * The audience claim keeps customer tokens from ever verifying as admin tokens.
 */
export const ADMIN_COOKIE = "ns_admin_session";
export const ADMIN_AUDIENCE = "ns-perfume:admin";

export type AdminRole = "super_admin" | "admin";

export type AdminTokenClaims = {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
};

const DEV_ONLY_SECRET = "ns-perfume-local-dev-admin-secret-change-me";

/** Raw admin secret bytes. Production refuses to run without a real secret. */
export function adminSecretKey(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET?.trim();
  if (s && s.length >= 32) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_JWT_SECRET must be set to at least 32 characters");
  }
  return new TextEncoder().encode(s || DEV_ONLY_SECRET);
}

/** Map legacy DB roles + JWT claims into super_admin | admin. */
export function normalizeRole(raw: unknown): AdminRole {
  const r = String(raw || "").toLowerCase();
  if (r === "super_admin" || r === "owner") return "super_admin";
  return "admin";
}

export async function signAdminToken(claims: AdminTokenClaims) {
  return new SignJWT({
    email: claims.email,
    name: claims.name,
    role: claims.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setAudience(ADMIN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(adminSecretKey());
}

export async function verifyAdminToken(token: string): Promise<AdminTokenClaims> {
  const { payload } = await jwtVerify(token, adminSecretKey(), {
    audience: ADMIN_AUDIENCE,
    algorithms: ["HS256"],
  });
  if (!payload.sub || typeof payload.role !== "string") {
    throw new Error("Malformed admin token");
  }
  return {
    sub: payload.sub,
    email: String(payload.email || ""),
    name: String(payload.name || "Admin"),
    role: normalizeRole(payload.role),
  };
}
