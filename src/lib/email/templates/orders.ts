import { siteConfig } from "@/data/site";
import { absoluteUrl } from "@/lib/site-url";
import {
  addressLines,
  button,
  columns,
  divider,
  eyebrow,
  formatDate,
  formatPkr,
  heading,
  itemsTable,
  p,
  panel,
  referenceBadge,
  renderLayout,
  renderText,
  small,
  subheading,
  totalsTable,
  type EmailLine,
  type SafeHtml,
} from "@/lib/email/layout";
import type { EmailContent } from "@/lib/email/types";

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

const firstName = (o: OrderEmailData) =>
  (o.shippingAddress.firstName || o.customerName.split(" ")[0] || "there").trim();

const trackUrl = (o: OrderEmailData) =>
  absoluteUrl(`/track-order?orderNumber=${encodeURIComponent(o.orderNumber)}`);

function addressText(o: OrderEmailData) {
  const a = o.shippingAddress;
  return [
    [a.firstName, a.lastName].filter(Boolean).join(" "),
    a.address1,
    a.address2,
    [a.city, a.province, a.postalCode].filter(Boolean).join(", "),
    a.phone || o.phone,
  ].filter((x): x is string => Boolean(x));
}

function deliveryWindow(o: OrderEmailData) {
  if (!o.estimatedDeliveryFrom || !o.estimatedDeliveryTo) return "";
  return `${formatDate(o.estimatedDeliveryFrom)} to ${formatDate(o.estimatedDeliveryTo)}`;
}

function totals(o: OrderEmailData) {
  const rows: Array<[string, string]> = [["Subtotal", formatPkr(o.subtotalPkr)]];
  if (o.discountPkr > 0) {
    rows.push([o.discountCode ? `Discount (${o.discountCode})` : "Discount", `- ${formatPkr(o.discountPkr)}`]);
  }
  rows.push([
    `Shipping${o.shippingMethod?.title ? ` (${o.shippingMethod.title})` : ""}`,
    o.shippingPkr > 0 ? formatPkr(o.shippingPkr) : "Free",
  ]);
  return totalsTable(rows, ["Total", formatPkr(o.totalPkr)]);
}

function totalsText(o: OrderEmailData) {
  return [
    `Subtotal: ${formatPkr(o.subtotalPkr)}`,
    o.discountPkr > 0 && `Discount${o.discountCode ? ` (${o.discountCode})` : ""}: - ${formatPkr(o.discountPkr)}`,
    `Shipping: ${o.shippingPkr > 0 ? formatPkr(o.shippingPkr) : "Free"}`,
    `Total: ${formatPkr(o.totalPkr)}`,
  ];
}

function linesText(o: OrderEmailData) {
  return o.lines.map(
    (l) => `- ${l.name}${l.sizeMl ? ` ${l.sizeMl} ml` : ""} x ${l.quantity}: ${formatPkr(l.unitPricePkr * l.quantity)}`,
  );
}

function paymentBlock(o: OrderEmailData): { html: SafeHtml; text: string[] } {
  if (o.paymentMethod === "bank") {
    const b = siteConfig.bankTransfer;
    const rows: Array<[string, string]> = [
      ["Amount", formatPkr(o.totalPkr)],
      ["Reference", o.orderNumber],
      ["Bank", b.bankName],
      ["Account title", b.accountTitle],
      ["Account no.", b.accountNumber],
      ["IBAN", b.iban],
      ["JazzCash", siteConfig.wallets.jazzcash],
      ["Easypaisa", siteConfig.wallets.easypaisa],
    ];
    const note = `Use ${o.orderNumber} as the payment reference, then send the receipt on WhatsApp to ${siteConfig.phone}. We dispatch as soon as the payment is confirmed.`;
    return {
      html: panel(rows, { title: "Complete your payment", accent: true, note }),
      text: ["COMPLETE YOUR PAYMENT", ...rows.map(([k, v]) => `${k}: ${v}`), note],
    };
  }
  const note = `Please pay ${formatPkr(o.totalPkr)} in cash to the courier when your parcel arrives. Our team may call ${o.phone || "you"} to confirm the order before dispatch.`;
  return {
    html: panel([["Payment", "Cash on delivery"], ["Amount due", formatPkr(o.totalPkr)]], {
      title: "Payment on delivery",
      accent: true,
      note,
    }),
    text: ["PAYMENT ON DELIVERY", `Amount due: ${formatPkr(o.totalPkr)}`, note],
  };
}

function orderDetails(o: OrderEmailData): SafeHtml[] {
  const delivery = deliveryWindow(o);
  return [
    subheading("Order summary"),
    itemsTable(o.lines),
    totals(o),
    columns(
      addressLines("Delivering to", addressText(o)),
      addressLines(
        "Shipping",
        [o.shippingMethod?.title || "Standard", o.shippingMethod?.description || "", delivery && `Expected ${delivery}`].filter(
          Boolean,
        ) as string[],
      ),
    ),
  ];
}

/** Map a stored order (lean or document) to template data. */
export function toOrderEmailData(order: Record<string, unknown>): OrderEmailData {
  const o = order as unknown as OrderEmailData & { lines?: EmailLine[] };
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
      giftWrap: l.giftWrap,
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

/* ---------- customer: order placed ---------- */

export function orderConfirmationEmail(o: OrderEmailData): EmailContent {
  const pay = paymentBlock(o);
  const isBank = o.paymentMethod === "bank";
  const subject = `Order ${o.orderNumber} received | ${siteConfig.name}`;
  const html = renderLayout(
    [
      eyebrow("Order received"),
      heading(`Thank you, ${firstName(o)}`),
      p(
        isBank
          ? "We have your order and are holding it for you. Complete the bank or wallet transfer below and we will prepare it for dispatch."
          : "We have your order and are preparing it now. You will hear from us again when it ships.",
      ),
      referenceBadge("Order number", o.orderNumber),
      pay.html,
      ...orderDetails(o),
      button("Track your order", trackUrl(o)),
      small("Keep this email for your records. You will need the order number and your email address to track the parcel."),
    ],
    {
      preheader: `Order ${o.orderNumber}: ${formatPkr(o.totalPkr)}. ${isBank ? "Payment details inside." : "Pay cash on delivery."}`,
      reason: `You are receiving this email because you placed order ${o.orderNumber} at ${siteConfig.name}.`,
    },
  );
  const text = renderText([
    `Thank you, ${firstName(o)}.`,
    "",
    `We have received order ${o.orderNumber} placed on ${formatDate(o.createdAt)}.`,
    "",
    ...pay.text,
    "",
    "ORDER SUMMARY",
    ...linesText(o),
    "",
    ...totalsText(o),
    "",
    "DELIVERING TO",
    ...addressText(o),
    deliveryWindow(o) && `Expected delivery: ${deliveryWindow(o)}`,
    "",
    `Track your order: ${trackUrl(o)}`,
  ]);
  return { subject, html, text };
}

/* ---------- customer: status changes ---------- */

const STATUS_COPY: Record<
  string,
  { eyebrow: string; title: (name: string) => string; body: string; subject: (n: string) => string }
> = {
  confirmed: {
    eyebrow: "Order confirmed",
    title: (n) => `Your order is confirmed, ${n}`,
    body: "Everything checks out. We are packing your order now and will send the tracking details as soon as it leaves our studio.",
    subject: (n) => `Order ${n} confirmed`,
  },
  shipped: {
    eyebrow: "On its way",
    title: (n) => `Your order has shipped, ${n}`,
    body: "Your parcel is with the courier. Delivery usually takes a few business days depending on your city.",
    subject: (n) => `Order ${n} has shipped`,
  },
  delivered: {
    eyebrow: "Delivered",
    title: (n) => `Your order has arrived, ${n}`,
    body: "Your parcel has been delivered. Give each fragrance a few minutes on skin before you decide. The heart notes open after the first ten minutes and the base settles within the hour.",
    subject: (n) => `Order ${n} delivered`,
  },
  cancelled: {
    eyebrow: "Order cancelled",
    title: (n) => `Your order has been cancelled, ${n}`,
    body: "This order has been cancelled and will not be dispatched. If you already paid by bank transfer or wallet, we will refund the full amount to the same account. Reply to this email if anything looks wrong.",
    subject: (n) => `Order ${n} cancelled`,
  },
};

export const STATUS_EMAILS = Object.keys(STATUS_COPY);

export function orderStatusEmail(o: OrderEmailData, status: string): EmailContent | null {
  const copy = STATUS_COPY[status];
  if (!copy) return null;
  const name = firstName(o);
  const blocks: SafeHtml[] = [eyebrow(copy.eyebrow), heading(copy.title(name)), p(copy.body), referenceBadge("Order number", o.orderNumber)];
  const text: Array<string | false> = [copy.title(name) + ".", "", copy.body, "", `Order number: ${o.orderNumber}`];

  if (status === "shipped") {
    const rows: Array<[string, string]> = [];
    if (o.carrier) rows.push(["Courier", o.carrier]);
    if (o.trackingNumber) rows.push(["Tracking number", o.trackingNumber]);
    const window = deliveryWindow(o);
    if (window) rows.push(["Expected", window]);
    if (rows.length) {
      blocks.push(panel(rows, { title: "Shipment", accent: true }));
      text.push("", ...rows.map(([k, v]) => `${k}: ${v}`));
    }
    if (o.paymentMethod === "cod") {
      blocks.push(p("Please keep ", { strong: formatPkr(o.totalPkr) }, " ready in cash for the courier."));
      text.push(`Please keep ${formatPkr(o.totalPkr)} ready in cash for the courier.`);
    }
    if (o.trackingUrl) {
      blocks.push(button("Track with the courier", o.trackingUrl));
      text.push(`Courier tracking: ${o.trackingUrl}`);
    } else {
      blocks.push(button("Track your order", trackUrl(o)));
      text.push(`Track your order: ${trackUrl(o)}`);
    }
  } else if (status === "delivered") {
    const first = o.lines[0];
    const reviewTarget = first?.productHandle
      ? absoluteUrl(`/products/${encodeURIComponent(first.productHandle)}#reviews`)
      : absoluteUrl("/products");
    blocks.push(
      p("When you have worn it for a day or two, a short review helps other customers choose with confidence. It takes less than a minute."),
      button("Write a review", reviewTarget),
    );
    text.push("", `Write a review: ${reviewTarget}`);
  } else if (status === "confirmed") {
    blocks.push(button("Track your order", trackUrl(o)));
    text.push(`Track your order: ${trackUrl(o)}`);
  } else if (status === "cancelled") {
    blocks.push(button("Continue shopping", absoluteUrl("/products")));
    text.push(`Continue shopping: ${absoluteUrl("/products")}`);
  }

  if (status !== "cancelled") {
    blocks.push(divider(), subheading("Your order"), itemsTable(o.lines), totals(o));
    text.push("", "YOUR ORDER", ...linesText(o), "", ...totalsText(o));
  }

  const html = renderLayout(blocks, {
    preheader: `${copy.subject(o.orderNumber)}. ${copy.body.split(". ")[0]}.`,
    reason: `You are receiving this email about order ${o.orderNumber} placed at ${siteConfig.name}.`,
  });
  return { subject: `${copy.subject(o.orderNumber)} | ${siteConfig.name}`, html, text: renderText(text) };
}

/* ---------- store team: new order ---------- */

export function adminNewOrderEmail(o: OrderEmailData): EmailContent {
  const payment = o.paymentMethod === "bank" ? "Bank transfer / wallet (verify receipt)" : "Cash on delivery";
  const adminUrl = absoluteUrl(`/admin/orders/${encodeURIComponent(o.orderNumber)}`);
  const html = renderLayout(
    [
      eyebrow("New order"),
      heading(`${o.orderNumber} · ${formatPkr(o.totalPkr)}`),
      panel(
        [
          ["Customer", o.customerName || "Guest"],
          ["Email", o.email],
          ["Phone", o.phone || o.shippingAddress.phone || "Not given"],
          ["City", [o.shippingAddress.city, o.shippingAddress.province].filter(Boolean).join(", ")],
          ["Payment", payment],
          ["Shipping", o.shippingMethod?.title || "Standard"],
          ["Placed", formatDate(o.createdAt)],
        ],
        { accent: true, note: o.notes ? `Customer note: ${o.notes}` : undefined },
      ),
      itemsTable(o.lines),
      totals(o),
      button("Open in admin", adminUrl),
    ],
    {
      preheader: `${o.customerName || o.email} ordered ${o.lines.length} item(s), ${formatPkr(o.totalPkr)}, ${payment}.`,
      reason: "Internal notification for the NS Perfume store team.",
      internal: true,
    },
  );
  const text = renderText([
    `New order ${o.orderNumber}: ${formatPkr(o.totalPkr)}`,
    `Customer: ${o.customerName} <${o.email}> ${o.phone || ""}`,
    `Payment: ${payment}`,
    o.notes && `Note: ${o.notes}`,
    "",
    ...linesText(o),
    "",
    ...totalsText(o),
    "",
    `Admin: ${adminUrl}`,
  ]);
  return { subject: `New order ${o.orderNumber} · ${formatPkr(o.totalPkr)}`, html, text };
}
