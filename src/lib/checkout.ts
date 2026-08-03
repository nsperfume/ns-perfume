/** Shopify-style checkout pricing helpers (amounts in PKR base). */

export const FREE_SHIPPING_THRESHOLD_PKR = 8000;

export type ShippingMethodId = "standard" | "express";

export type ShippingMethod = {
  id: ShippingMethodId;
  title: string;
  description: string;
  basePricePkr: number;
};

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    title: "Standard",
    description: "3 to 5 business days",
    basePricePkr: 350,
  },
  {
    id: "express",
    title: "Express",
    description: "1 to 2 business days",
    basePricePkr: 750,
  },
];

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
    title: "Bank deposit / transfer",
    description: "Transfer to our account, then we confirm and ship.",
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

export function shippingPricePkr(
  methodId: ShippingMethodId,
  subtotalAfterDiscount: number,
): number {
  const method = SHIPPING_METHODS.find((m) => m.id === methodId);
  if (!method) return 0;
  if (
    methodId === "standard" &&
    subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD_PKR
  ) {
    return 0;
  }
  if (methodId === "standard" && method.basePricePkr === 0) return 0;
  return method.basePricePkr;
}

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
  email: string;
  phone?: string;
  customerName: string;
  totalPkr: number;
  subtotalPkr: number;
  shippingPkr: number;
  discountPkr: number;
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
