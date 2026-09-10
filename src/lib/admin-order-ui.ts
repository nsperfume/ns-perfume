/** Shared admin order display helpers. */

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

export function paymentLabel(method?: string) {
  switch (method) {
    case "cod":
      return "Cash on delivery";
    case "bank":
      return "Bank transfer";
    case "card":
      return "Card";
    default:
      return method || "—";
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
      return method?.toUpperCase() || "—";
  }
}

export function formatOrderDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatOrderDateTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatOrderAddress(a?: AdminOrderAddress) {
  if (!a) return "—";
  return (
    [
      [a.firstName, a.lastName].filter(Boolean).join(" "),
      a.company,
      a.address1,
      a.address2,
      [a.city, a.province].filter(Boolean).join(", "),
      a.postalCode,
      a.country,
      a.phone,
    ]
      .filter(Boolean)
      .join("\n") || "—"
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
