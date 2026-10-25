import { createHash, randomBytes } from "node:crypto";

/** Single-use secret for email links. Only the SHA-256 hash is stored. */
export function createLinkToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashLinkToken(token) };
}

export function hashLinkToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
