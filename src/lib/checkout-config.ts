/**
 * Store charges the owner edits in Admin > Settings: shipping methods and prices,
 * free-shipping threshold, gift wrap, cash-on-delivery fee and tax.
 * Pure functions only, so the browser (display) and the order API (charging)
 * compute totals the same way. The server always recalculates from stored settings.
 */

export type ShippingMethodId = "standard" | "express";
export type TaxMode = "none" | "inclusive" | "exclusive";

export type ShippingOption = {
  enabled: boolean;
  title: string;
  description: string;
  pricePkr: number;
};

export type CheckoutConfig = {
  shipping: Record<ShippingMethodId, ShippingOption>;
  /** Standard shipping is free at or above this order value (after discount). 0 turns it off. */
  freeShippingThresholdPkr: number;
  giftWrap: { enabled: boolean; feePkr: number };
  /** Extra charge when paying cash on delivery. 0 = none. */
  codFeePkr: number;
  tax: { mode: TaxMode; ratePercent: number; label: string };
};

export const SHIPPING_METHOD_IDS: ShippingMethodId[] = ["standard", "express"];

export const DEFAULT_CHECKOUT_CONFIG: CheckoutConfig = {
  shipping: {
    standard: { enabled: true, title: "Standard", description: "3 to 5 business days", pricePkr: 350 },
    express: { enabled: true, title: "Express", description: "1 to 2 business days", pricePkr: 750 },
  },
  freeShippingThresholdPkr: 8000,
  giftWrap: { enabled: true, feePkr: 800 },
  codFeePkr: 0,
  tax: { mode: "none", ratePercent: 0, label: "GST" },
};

/** Merge a stored (possibly partial or legacy) value over the defaults. */
export function normalizeCheckoutConfig(raw: unknown): CheckoutConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<CheckoutConfig>;
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : d);
  const str = (v: unknown, d: string) => (typeof v === "string" && v.trim() ? v.trim() : d);
  const ship = (id: ShippingMethodId): ShippingOption => {
    const d = DEFAULT_CHECKOUT_CONFIG.shipping[id];
    const s = (r.shipping?.[id] ?? {}) as Partial<ShippingOption>;
    return {
      enabled: typeof s.enabled === "boolean" ? s.enabled : d.enabled,
      title: str(s.title, d.title),
      description: str(s.description, d.description),
      pricePkr: num(s.pricePkr, d.pricePkr),
    };
  };
  const shipping = { standard: ship("standard"), express: ship("express") };
  // Never leave checkout without a way to ship.
  if (!shipping.standard.enabled && !shipping.express.enabled) shipping.standard.enabled = true;
  const mode = r.tax?.mode;
  return {
    shipping,
    freeShippingThresholdPkr: num(r.freeShippingThresholdPkr, DEFAULT_CHECKOUT_CONFIG.freeShippingThresholdPkr),
    giftWrap: {
      enabled: typeof r.giftWrap?.enabled === "boolean" ? r.giftWrap.enabled : true,
      feePkr: num(r.giftWrap?.feePkr, DEFAULT_CHECKOUT_CONFIG.giftWrap.feePkr),
    },
    codFeePkr: num(r.codFeePkr, 0),
    tax: {
      mode: mode === "inclusive" || mode === "exclusive" ? mode : "none",
      ratePercent: Math.min(100, Math.max(0, Number(r.tax?.ratePercent) || 0)),
      label: str(r.tax?.label, "GST"),
    },
  };
}

export function enabledShippingMethods(config: CheckoutConfig) {
  return SHIPPING_METHOD_IDS.filter((id) => config.shipping[id].enabled).map((id) => ({ id, ...config.shipping[id] }));
}

/** Shipping for a method after the free-shipping rule and any free-shipping coupon (standard only). */
export function shippingFor(
  config: CheckoutConfig,
  methodId: ShippingMethodId,
  afterDiscountPkr: number,
  freeShippingCoupon = false,
) {
  const method = config.shipping[methodId];
  if (!method) return 0;
  if (methodId === "standard") {
    if (freeShippingCoupon) return 0;
    if (config.freeShippingThresholdPkr > 0 && afterDiscountPkr >= config.freeShippingThresholdPkr) return 0;
  }
  return method.pricePkr;
}

/** How much more to spend for free standard shipping (null when the offer is off). */
export function freeShippingGap(config: CheckoutConfig, afterDiscountPkr: number) {
  if (config.freeShippingThresholdPkr <= 0 || !config.shipping.standard.enabled) return null;
  return Math.max(0, config.freeShippingThresholdPkr - afterDiscountPkr);
}

export type Totals = {
  subtotalPkr: number;
  discountPkr: number;
  shippingPkr: number;
  codFeePkr: number;
  /** Added on top (exclusive tax). */
  taxPkr: number;
  /** Already inside prices (inclusive tax), shown for information. */
  taxIncludedPkr: number;
  totalPkr: number;
};

export function computeTotals(
  config: CheckoutConfig,
  input: {
    subtotalPkr: number;
    discountPkr: number;
    shippingMethodId: ShippingMethodId;
    paymentMethod: "cod" | "bank" | "card";
    freeShippingCoupon?: boolean;
  },
): Totals {
  const afterDiscount = Math.max(0, input.subtotalPkr - input.discountPkr);
  const shippingPkr = shippingFor(config, input.shippingMethodId, afterDiscount, input.freeShippingCoupon);
  const codFeePkr = input.paymentMethod === "cod" ? config.codFeePkr : 0;
  const rate = config.tax.ratePercent / 100;
  const taxPkr = config.tax.mode === "exclusive" ? Math.round(afterDiscount * rate) : 0;
  const taxIncludedPkr =
    config.tax.mode === "inclusive" && rate > 0 ? Math.round(afterDiscount - afterDiscount / (1 + rate)) : 0;
  return {
    subtotalPkr: input.subtotalPkr,
    discountPkr: Math.min(input.discountPkr, input.subtotalPkr),
    shippingPkr,
    codFeePkr,
    taxPkr,
    taxIncludedPkr,
    totalPkr: afterDiscount + shippingPkr + codFeePkr + taxPkr,
  };
}

/** Human label for the tax line, e.g. "GST (18%)". */
export function taxLineLabel(config: CheckoutConfig) {
  return `${config.tax.label} (${config.tax.ratePercent}%)`;
}

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-US")}`;

/** Plain-language shipping summary for policies, FAQ and llms.txt, built from settings. */
export function describeShipping(config: CheckoutConfig) {
  const methods = enabledShippingMethods(config).map(
    (m) => `${m.title} delivery takes ${m.description.charAt(0).toLowerCase()}${m.description.slice(1)} (${m.pricePkr > 0 ? rs(m.pricePkr) : "free"})`,
  );
  const parts = [`We deliver within Pakistan. ${methods.join(" and ")}.`];
  if (config.freeShippingThresholdPkr > 0 && config.shipping.standard.enabled) {
    parts.push(`Standard delivery is free on orders over ${rs(config.freeShippingThresholdPkr)}.`);
  }
  if (config.codFeePkr > 0) parts.push(`Cash on delivery orders include a ${rs(config.codFeePkr)} fee.`);
  return parts.join(" ");
}

/** Announcement bar text when the owner has not written one: built from the live charges. */
export function defaultAnnouncement(config: CheckoutConfig) {
  const parts: string[] = [];
  if (config.freeShippingThresholdPkr > 0 && config.shipping.standard.enabled) {
    parts.push(`Free delivery over ${rs(config.freeShippingThresholdPkr)}`);
  }
  parts.push("Cash on delivery across Pakistan");
  return parts.join(" · ");
}

/** Replace {{shipping}} in stored copy with the live shipping summary. */
export function fillCheckoutCopy(text: string, config: CheckoutConfig) {
  return text.replace(/\{\{shipping\}\}/g, describeShipping(config));
}
