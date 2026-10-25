import { absoluteUrl } from "@/lib/site-url";
import { invoiceToken } from "@/lib/invoice/token";
import type { EmailLine } from "@/emails/components";

export type OrderEmailData = {
  orderNumber: string;
  email: string;
  customerName: string;
  phone?: string;
  createdAt: Date | string;
  status: string;
  lines: EmailLine[];
  subtotalPkr: number;
  discountPkr: number;
  discountCode?: string;
  shippingPkr: number;
  totalPkr: number;
  paymentMethod: string;
  shippingMethod?: { title?: string; description?: string };
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    phone?: string;
  };
  notes?: string;
  estimatedDeliveryFrom?: Date | string | null;
  estimatedDeliveryTo?: Date | string | null;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
};

/** Map a stored order (lean object or document.toObject()) to email data. */
export function toOrderEmailData(order: Record<string, unknown>): OrderEmailData {
  const o = order as unknown as OrderEmailData;
  return {
    orderNumber: String(o.orderNumber),
    email: String(o.email),
    customerName: String(o.customerName || ""),
    phone: o.phone || "",
    createdAt: o.createdAt || new Date(),
    status: String(o.status || "pending"),
    lines: (o.lines || []).map((l) => ({
      productHandle: l.productHandle,
      name: l.name,
      sizeMl: l.sizeMl,
      quantity: Number(l.quantity) || 1,
      unitPricePkr: Number(l.unitPricePkr) || 0,
      image: l.image,
    })),
    subtotalPkr: Number(o.subtotalPkr) || 0,
    discountPkr: Number(o.discountPkr) || 0,
    discountCode: o.discountCode || "",
    shippingPkr: Number(o.shippingPkr) || 0,
    totalPkr: Number(o.totalPkr) || 0,
    paymentMethod: String(o.paymentMethod || "cod"),
    shippingMethod: o.shippingMethod,
    shippingAddress: o.shippingAddress || {},
    notes: o.notes || "",
    estimatedDeliveryFrom: o.estimatedDeliveryFrom || null,
    estimatedDeliveryTo: o.estimatedDeliveryTo || null,
    carrier: o.carrier || "",
    trackingNumber: o.trackingNumber || "",
    trackingUrl: o.trackingUrl || "",
  };
}

export const firstName = (o: OrderEmailData) =>
  (o.shippingAddress.firstName || o.customerName.split(" ")[0] || "there").trim();

export const trackUrl = (o: OrderEmailData) =>
  absoluteUrl(`/track-order?orderNumber=${encodeURIComponent(o.orderNumber)}`);

export const invoiceUrl = (o: OrderEmailData) =>
  absoluteUrl(
    `/api/orders/${encodeURIComponent(o.orderNumber)}/invoice?t=${invoiceToken(o.orderNumber)}`,
  );

export function addressLines(o: OrderEmailData) {
  const a = o.shippingAddress;
  return [
    [a.firstName, a.lastName].filter(Boolean).join(" "),
    a.address1 || "",
    a.address2 || "",
    [a.city, a.province, a.postalCode].filter(Boolean).join(", "),
    a.phone || o.phone || "",
  ].filter(Boolean);
}
