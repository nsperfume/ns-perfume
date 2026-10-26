import { createHmac, timingSafeEqual } from "node:crypto";
import { adminSecretKey } from "@/lib/admin-token";

/**
 * Signed, non-expiring invoice link token for an order number. Lets customers open
 * their invoice from an email without signing in, without putting PII in the URL.
 */
function key() {
  return createHmac("sha256", adminSecretKey()).update("ns-perfume:invoice-link").digest();
}

export function invoiceToken(orderNumber: string) {
  return createHmac("sha256", key()).update(orderNumber).digest("base64url").slice(0, 32);
}

export function verifyInvoiceToken(orderNumber: string, token: string) {
  const expected = Buffer.from(invoiceToken(orderNumber));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
