/** Shared admin order display helpers. */

import { canTransitionOrderStatus } from "@/lib/order-status";

export type AdminOrderLine = {
  productHandle?: string;
  name?: string;
  sizeMl?: number;
  quantity?: number;
  unitPricePkr?: number;
  sku?: string;
  isGift?: boolean;
  giftMessage?: string;
  giftWrap?: boolean;
  image?: string;
};

export type AdminOrderAddress = {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
};

export type AdminOrder = {
  _id: string;
  orderNumber: string;
  email: string;
  customerName?: string;
  phone?: string;
  customerId?: string;
  status: string;
  totalPkr: number;
  subtotalPkr?: number;
  shippingPkr?: number;
  discountPkr?: number;
  discountCode?: string;
  taxPkr?: number;
  codFeePkr?: number;
  taxIncludedPkr?: number;
  taxLabel?: string;
  currency?: string;
  paymentMethod?: string;
  cardLast4?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  createdAt?: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  estimatedDeliveryFrom?: string;
  estimatedDeliveryTo?: string;
  lines?: AdminOrderLine[];
  notes?: string;
  marketingOptIn?: boolean;
  billingSameAsShipping?: boolean;
  shippingMethod?: {
    id?: string;
    title?: string;
    description?: string;
  };
  shippingAddress?: AdminOrderAddress;
  billingAddress?: AdminOrderAddress;
};

export const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const STATUS_STEP: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
};

/**
 * Moves the admin UI offers: the current status, any later step, or cancel.
 * Never backwards (a confirmed order cannot go back to pending). Unknown
 * legacy statuses can be moved anywhere so they can be repaired.
 */
export function canMoveOrderStatus(from: string, to: string) {
  if (from === to) return true;
  const target = ORDER_STATUSES.find((s) => s.value === to)?.value;
  if (!target || !canTransitionOrderStatus(from, target)) return false;
  if (to === "cancelled") return true;
  const a = STATUS_STEP[from];
  const b = STATUS_STEP[to];
  if (a === undefined) return true;
  return b !== undefined && b > a;
}

/** Status select options with backward and impossible moves disabled. */
export function orderStatusOptions(current: string) {
  return ORDER_STATUSES.map((o) => ({
    value: o.value,
    label: o.label,
    disabled: !canMoveOrderStatus(current, o.value),
  }));
}

export function orderStatusLabel(value: string) {
  return ORDER_STATUSES.find((s) => s.value === value)?.label ?? value;
}

/** Couriers offered when an order is marked shipped. "Other" asks for a name. */
export const COURIERS = [
  "TCS",
  "Leopards",
  "M&P",
  "PostEx",
  "Trax",
  "Call Courier",
] as const;

export const OTHER_COURIER = "Other";

/**
 * Tracking links are often pasted without the scheme ("tcs.com.pk/track").
 * Add https:// so the saved link opens and passes the API check.
 */
export function normalizeTrackingUrl(raw: string) {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("//")) return `https:${v}`;
  return `https://${v.replace(/^\/+/, "")}`;
}

/** True when a (normalized) tracking link looks like a real web address. */
export function isValidTrackingUrl(url: string) {
  if (!url) return true;
  if (/\s/.test(url)) return false;
  try {
    const u = new URL(url);
    return (
      (u.protocol === "https:" || u.protocol === "http:") &&
      /^[^.]+(\.[^.]+)+$/.test(u.hostname)
    );
  } catch {
    return false;
  }
}

/** Two-letter country codes ("PK") as names ("Pakistan"). Names pass through. */
export function countryName(value?: string) {
  const v = (value || "").trim();
  if (!/^[A-Za-z]{2}$/.test(v)) return v;
  const code = v.toUpperCase();
  if (code === "PK") return "Pakistan";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

export function paymentLabel(method?: string) {
  switch (method) {
    case "cod":
      return "Cash on delivery";
    case "bank":
      return "Bank transfer";
    case "card":
      return "Card";
    default:
      return method || "";
  }
}

export function paymentShort(method?: string) {
  switch (method) {
    case "cod":
      return "COD";
    case "bank":
      return "Bank";
    case "card":
      return "Card";
    default:
      return method?.toUpperCase() || "";
  }
}

export function formatOrderDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatOrderDateTime(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatOrderAddress(a?: AdminOrderAddress) {
  if (!a) return "";
  return (
    [
      [a.firstName, a.lastName].filter(Boolean).join(" "),
      a.company,
      a.address1,
      a.address2,
      [a.city, a.province].filter(Boolean).join(", "),
      a.postalCode,
      countryName(a.country),
      a.phone,
    ]
      .filter(Boolean)
      .join("\n") || ""
  );
}

/** Normalize lean Mongo order docs for the admin UI. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapAdminOrder(doc: any): AdminOrder {
  return {
    _id: String(doc._id),
    orderNumber: doc.orderNumber,
    email: doc.email,
    customerName: doc.customerName,
    phone: doc.phone,
    customerId: doc.customerId || "",
    status: doc.status,
    totalPkr: doc.totalPkr,
    subtotalPkr: doc.subtotalPkr,
    shippingPkr: doc.shippingPkr,
    discountPkr: doc.discountPkr,
    discountCode: doc.discountCode,
    taxPkr: doc.taxPkr,
    codFeePkr: Number(doc.codFeePkr) || 0,
    taxIncludedPkr: Number(doc.taxIncludedPkr) || 0,
    taxLabel: String(doc.taxLabel || ""),
    currency: doc.currency,
    paymentMethod: doc.paymentMethod,
    cardLast4: doc.cardLast4,
    trackingNumber: doc.trackingNumber,
    trackingUrl: doc.trackingUrl,
    carrier: doc.carrier,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : undefined,
    confirmedAt: doc.confirmedAt
      ? new Date(doc.confirmedAt).toISOString()
      : undefined,
    shippedAt: doc.shippedAt
      ? new Date(doc.shippedAt).toISOString()
      : undefined,
    deliveredAt: doc.deliveredAt
      ? new Date(doc.deliveredAt).toISOString()
      : undefined,
    cancelledAt: doc.cancelledAt
      ? new Date(doc.cancelledAt).toISOString()
      : undefined,
    estimatedDeliveryFrom: doc.estimatedDeliveryFrom
      ? new Date(doc.estimatedDeliveryFrom).toISOString()
      : undefined,
    estimatedDeliveryTo: doc.estimatedDeliveryTo
      ? new Date(doc.estimatedDeliveryTo).toISOString()
      : undefined,
    lines: doc.lines || [],
    notes: doc.notes,
    marketingOptIn: doc.marketingOptIn,
    billingSameAsShipping: doc.billingSameAsShipping !== false,
    shippingMethod: doc.shippingMethod,
    shippingAddress: doc.shippingAddress,
    billingAddress: doc.billingAddress,
  };
}
