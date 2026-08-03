import { connectDB } from "@/lib/db";
import { CouponModel } from "@/models/Coupon";

export type DiscountResult = {
  code: string;
  amountPkr: number;
  label: string;
  freeShipping: boolean;
};

export type CouponRejectReason =
  | "empty"
  | "not_found"
  | "inactive"
  | "expired"
  | "exhausted"
  | "min_subtotal"
  | "zero_cart";

export type CouponResolveResult =
  | { ok: true; discount: DiscountResult }
  | { ok: false; reason: CouponRejectReason; message: string };

const FALLBACK: Record<
  string,
  {
    type: "percent" | "fixed" | "free_shipping";
    value: number;
    label: string;
  }
> = {
  WELCOME10: { type: "percent", value: 10, label: "WELCOME10" },
  NS500: { type: "fixed", value: 500, label: "NS500" },
  FREESHIP: { type: "free_shipping", value: 0, label: "Free shipping promo" },
};

const MESSAGES: Record<CouponRejectReason, string> = {
  empty: "Enter a discount code",
  not_found: "Enter a valid discount code",
  inactive: "This code is no longer available",
  expired: "This code has expired",
  exhausted: "This code has reached its usage limit",
  min_subtotal: "Your cart total is below the minimum for this code",
  zero_cart: "Add items to your cart before applying a code",
};

function computeFromRule(
  key: string,
  rule: {
    type: "percent" | "fixed" | "free_shipping";
    value: number;
    label: string;
    minSubtotalPkr?: number;
  },
  subtotalPkr: number,
): CouponResolveResult {
  if (subtotalPkr <= 0) {
    return { ok: false, reason: "zero_cart", message: MESSAGES.zero_cart };
  }
  const min = rule.minSubtotalPkr ?? 0;
  if (min > 0 && subtotalPkr < min) {
    return {
      ok: false,
      reason: "min_subtotal",
      message: `Spend at least Rs ${min.toLocaleString("en-PK")} to use this code`,
    };
  }

  if (rule.type === "free_shipping") {
    return {
      ok: true,
      discount: {
        code: key,
        amountPkr: 0,
        label: rule.label || key,
        freeShipping: true,
      },
    };
  }
  let amount = 0;
  if (rule.type === "percent") {
    amount = Math.round(
      (subtotalPkr * Math.min(100, Math.max(0, rule.value))) / 100,
    );
  } else {
    amount = Math.min(Math.max(0, rule.value), subtotalPkr);
  }
  if (amount <= 0) {
    return { ok: false, reason: "not_found", message: MESSAGES.not_found };
  }
  return {
    ok: true,
    discount: {
      code: key,
      amountPkr: amount,
      label: rule.label || key,
      freeShipping: false,
    },
  };
}

function isExhausted(usageLimit: unknown, usedCount: unknown): boolean {
  if (typeof usageLimit !== "number" || usageLimit <= 0) return false;
  return (Number(usedCount) || 0) >= usageLimit;
}

/**
 * Full coupon resolve with specific failure reasons (checkout + validate API).
 */
export async function resolveDiscountDetailed(
  code: string,
  subtotalPkr: number,
): Promise<CouponResolveResult> {
  const key = code.trim().toUpperCase();
  if (!key) {
    return { ok: false, reason: "empty", message: MESSAGES.empty };
  }

  try {
    await connectDB();
    const doc = await CouponModel.findOne({ code: key }).lean();
    if (doc) {
      if (!doc.active) {
        return { ok: false, reason: "inactive", message: MESSAGES.inactive };
      }
      if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) {
        return { ok: false, reason: "expired", message: MESSAGES.expired };
      }
      if (isExhausted(doc.usageLimit, doc.usedCount)) {
        return { ok: false, reason: "exhausted", message: MESSAGES.exhausted };
      }
      return computeFromRule(
        key,
        {
          type: doc.type as "percent" | "fixed" | "free_shipping",
          value: Number(doc.value) || 0,
          label: (doc.label as string) || key,
          minSubtotalPkr: Number(doc.minSubtotalPkr) || 0,
        },
        subtotalPkr,
      );
    }
  } catch {
    /* fall through to built-ins */
  }

  const fb = FALLBACK[key];
  if (!fb) {
    return { ok: false, reason: "not_found", message: MESSAGES.not_found };
  }
  return computeFromRule(key, fb, subtotalPkr);
}

/**
 * Resolve coupon from MongoDB; falls back to built-in codes if DB empty/unreachable.
 */
export async function resolveDiscount(
  code: string,
  subtotalPkr: number,
): Promise<DiscountResult | null> {
  const result = await resolveDiscountDetailed(code, subtotalPkr);
  return result.ok ? result.discount : null;
}

/** Legacy sync path for tests / temporary fallbacks — prefer async resolveDiscount. */
export function resolveDiscountSync(
  code: string,
  subtotalPkr: number,
): DiscountResult | null {
  const key = code.trim().toUpperCase();
  const fb = FALLBACK[key];
  if (!fb) return null;
  const result = computeFromRule(key, fb, subtotalPkr);
  return result.ok ? result.discount : null;
}

/**
 * Atomically increment usedCount when an order redeems a coupon.
 * Honors usageLimit so concurrent checkouts cannot over-redeem.
 */
export async function redeemCoupon(code: string): Promise<boolean> {
  const key = code.trim().toUpperCase();
  if (!key) return false;
  try {
    await connectDB();
    const existing = await CouponModel.findOne({ code: key }).lean();
    if (!existing) {
      // Built-in fallthrough codes without a stored row still work at checkout
      return Boolean(FALLBACK[key]);
    }
    const result = await CouponModel.updateOne(
      {
        code: key,
        active: true,
        $and: [
          {
            $or: [
              { expiresAt: null },
              { expiresAt: { $exists: false } },
              { expiresAt: { $gt: new Date() } },
            ],
          },
          {
            $or: [
              { usageLimit: null },
              { usageLimit: { $exists: false } },
              { usageLimit: { $lte: 0 } },
              {
                $expr: {
                  $lt: [{ $ifNull: ["$usedCount", 0] }, "$usageLimit"],
                },
              },
            ],
          },
        ],
      },
      { $inc: { usedCount: 1 } },
    );
    return (result.modifiedCount || 0) > 0;
  } catch {
    return false;
  }
}

/** Revert a reserved use if order creation failed after redeem. */
export async function releaseCoupon(code: string): Promise<void> {
  const key = code.trim().toUpperCase();
  if (!key) return;
  try {
    await connectDB();
    await CouponModel.updateOne(
      {
        code: key,
        usedCount: { $gt: 0 },
      },
      { $inc: { usedCount: -1 } },
    );
  } catch {
    /* ignore */
  }
}

export async function ensureDefaultCoupons() {
  try {
    await connectDB();
    const count = await CouponModel.countDocuments();
    if (count > 0) return;
    await CouponModel.insertMany([
      {
        code: "WELCOME10",
        label: "Welcome 10%",
        type: "percent",
        value: 10,
        active: true,
        usageLimit: null,
        posterBgMode: "color",
        posterBgColor: "#1c1917",
      },
      {
        code: "NS500",
        label: "Rs 500 off",
        type: "fixed",
        value: 500,
        active: true,
        usageLimit: 100,
        posterBgMode: "color",
        posterBgColor: "#2c2419",
      },
      {
        code: "FREESHIP",
        label: "Free standard shipping",
        type: "free_shipping",
        value: 0,
        active: true,
        usageLimit: null,
        posterBgMode: "color",
        posterBgColor: "#1a2a24",
      },
    ]);
  } catch {
    /* ignore seed errors */
  }
}
