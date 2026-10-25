import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { resolveDiscountDetailed } from "@/lib/coupons";
import { limitByIp } from "@/lib/rate-limit";

/**
 * Public endpoint: validate coupon for checkout UI.
 * GET /api/coupons/validate?code=WELCOME10&subtotal=15000
 */
export async function GET(req: NextRequest) {
  try {
    const limited = limitByIp(req, "coupon-validate", 20, 10 * 60_000);
    if (limited) return limited;
    const code = req.nextUrl.searchParams.get("code") || "";
    const subtotal = Number(req.nextUrl.searchParams.get("subtotal") || 0);
    if (!code.trim()) return jsonError("Enter a discount code", 400);
    const resolved = await resolveDiscountDetailed(code, subtotal);
    if (!resolved.ok) {
      return jsonError(resolved.message, 400, { reason: resolved.reason });
    }
    return jsonOk(resolved.discount);
  } catch (e) {
    console.error(e);
    return jsonError("Could not validate code", 500);
  }
}
