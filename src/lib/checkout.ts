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
