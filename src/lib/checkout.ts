/** Shopify-style checkout pricing helpers (amounts in PKR base). */

/** Shipping prices, thresholds, fees and tax live in Admin > Settings (lib/checkout-config). */
export type { ShippingMethodId } from "@/lib/checkout-config";


export type PaymentMethodId = "cod" | "card" | "bank";

/**
 * Active payment options. Card wallets / Visa-style online card are not offered yet.
 */
export const PAYMENT_METHODS: {
  id: PaymentMethodId;
  title: string;
  description: string;
  badge?: string;
}[] = [
  {
    id: "cod",
    title: "Cash on delivery (COD)",
    description: "Pay the courier in cash when your order arrives.",
    badge: "Popular",
  },
  {
    id: "bank",
    title: "Bank transfer or mobile wallet",
    description:
      "Pay by Meezan Bank, JazzCash, or Easypaisa. We confirm, then ship.",
  },
  // Online card (Visa / Mastercard / local debit) — enable when a gateway is live.
  // {
  //   id: "card",
  //   title: "Credit / debit card",
  //   description: "Visa, Mastercard, and local debit cards.",
  // },
];

/** Pakistan provinces for delivery select (Shopify-style region list). */
export const PK_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu and Kashmir",
] as const;


export type CheckoutAddress = {
  country: string;
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
};

export const emptyAddress = (): CheckoutAddress => ({
  country: "PK",
  firstName: "",
  lastName: "",
  company: "",
  address1: "",
  address2: "",
  city: "",
  province: "",
  postalCode: "",
  phone: "",
});

export const CHECKOUT_ORDER_STORAGE_KEY = "ns-checkout-completed-order";

/**
 * Pakistani mobile numbers: 03XXXXXXXXX, +923XXXXXXXXX or 923XXXXXXXXX, with any
 * spaces, dashes, dots or brackets. Returns the local form 03XXXXXXXXX, or null.
 * Shared by the checkout form and POST /api/orders so both accept the same input.
 */
export function normalizePkMobile(raw: string | null | undefined): string | null {
  const compact = String(raw ?? "").trim().replace(/[\s().-]/g, "");
  const match = /^(?:\+92|92|0)(3\d{9})$/.exec(compact);
  return match ? `0${match[1]}` : null;
}

/** 03001234567 -> "0300 1234567" for display. Leaves anything else as typed. */
export function formatPkMobile(raw: string | null | undefined): string {
  const n = normalizePkMobile(raw);
  return n ? `${n.slice(0, 4)} ${n.slice(4)}` : String(raw ?? "").trim();
}

export const PK_MOBILE_ERROR = "Enter a Pakistani mobile number, for example 0300 1234567";

/**
 * Gift lines were saved as "Amber Noir (Gift Wrap)" or "Amber Noir (Gift)".
 * Show the product name once and put the gift details on their own line.
 */
export function lineDisplayName(name: string | null | undefined): string {
  return String(name ?? "").replace(/\s*\((?:gift wrap|gift)\)\s*$/i, "");
}

/** The gift sub-line for a cart or order line, or null for a normal bottle. */
export function giftLineLabel(line: { isGift?: boolean; giftWrap?: boolean }): string | null {
  if (line.giftWrap) return "Gift, wrapped";
  if (line.isGift) return "Gift";
  return null;
}

export type CompletedOrderSnapshot = {
  orderNumber: string;
  /** Signed PDF invoice URL returned by POST /api/orders. */
  invoiceUrl?: string;
  /** True when the server queued a confirmation email. */
  confirmationEmail?: boolean;
  email: string;
  phone?: string;
  customerName: string;
  totalPkr: number;
  subtotalPkr: number;
  shippingPkr: number;
  discountPkr: number;
  codFeePkr?: number;
  taxPkr?: number;
  taxIncludedPkr?: number;
  taxLabel?: string;
  discountCode?: string;
  currency: string;
  paymentMethod: PaymentMethodId;
  shippingMethodTitle: string;
  shippingAddress: CheckoutAddress;
  lines: {
    productHandle: string;
    name: string;
    sizeMl: number;
    sku: string;
    quantity: number;
    unitPricePkr: number;
    image: string;
    isGift?: boolean;
    giftMessage?: string;
    giftWrap?: boolean;
  }[];
  createdAt: string;
};
