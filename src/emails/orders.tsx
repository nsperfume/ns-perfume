import { siteConfig } from "@/data/site";
import { absoluteUrl } from "@/lib/site-url";
import {
  AddressBlock,
  Cta,
  Divider,
  EmailLayout,
  Eyebrow,
  LineItems,
  P,
  Panel,
  ReferenceBadge,
  Strong,
  Subtitle,
  Title,
  Totals,
  TwoColumns,
  formatDate,
  formatPkr,
} from "@/emails/components";
import {
  addressLines,
  firstName,
  invoiceUrl,
  trackUrl,
  type OrderEmailData,
} from "@/emails/order-data";
import type { EmailDefinition } from "@/emails/types";

function deliveryWindow(o: OrderEmailData) {
  if (!o.estimatedDeliveryFrom || !o.estimatedDeliveryTo) return "";
  return `${formatDate(o.estimatedDeliveryFrom)} to ${formatDate(o.estimatedDeliveryTo)}`;
}

function OrderTotals({ o }: { o: OrderEmailData }) {
  const rows: Array<[string, string]> = [["Subtotal", formatPkr(o.subtotalPkr)]];
  if (o.discountPkr > 0) {
    rows.push([o.discountCode ? `Discount (${o.discountCode})` : "Discount", `- ${formatPkr(o.discountPkr)}`]);
  }
  rows.push([
    `Shipping${o.shippingMethod?.title ? ` (${o.shippingMethod.title})` : ""}`,
    o.shippingPkr > 0 ? formatPkr(o.shippingPkr) : "Free",
  ]);
  if (o.codFeePkr) rows.push(["Cash on delivery fee", formatPkr(o.codFeePkr)]);
  if (o.taxPkr) rows.push([o.taxLabel || "Tax", formatPkr(o.taxPkr)]);
  return (
    <>
      <Totals rows={rows} total={["Total", formatPkr(o.totalPkr)]} />
      {o.taxIncludedPkr ? (
        <P muted>
          Includes {o.taxLabel || "tax"} of {formatPkr(o.taxIncludedPkr)}.
        </P>
      ) : null}
    </>
  );
}

function OrderDetails({ o }: { o: OrderEmailData }) {
  const delivery = deliveryWindow(o);
  return (
    <>
      <Subtitle>Order summary</Subtitle>
      <LineItems lines={o.lines} />
      <OrderTotals o={o} />
      <TwoColumns
        left={<AddressBlock title="Delivering to" lines={addressLines(o)} />}
        right={
          <AddressBlock
            title="Shipping"
            lines={[
              o.shippingMethod?.title || "Standard",
              o.shippingMethod?.description || "",
              delivery ? `Expected ${delivery}` : "",
            ]}
          />
        }
      />
    </>
  );
}

function PaymentPanel({ o }: { o: OrderEmailData }) {
  if (o.paymentMethod === "bank") {
    const b = siteConfig.bankTransfer;
    return (
      <Panel
        title="Complete your payment"
        accent
        rows={[
          ["Amount", formatPkr(o.totalPkr)],
          ["Reference", o.orderNumber],
          ["Bank", b.bankName],
          ["Account title", b.accountTitle],
          ["Account no.", b.accountNumber],
          ["IBAN", b.iban],
          ["JazzCash", siteConfig.wallets.jazzcash],
          ["Easypaisa", siteConfig.wallets.easypaisa],
        ]}
        note={`Use ${o.orderNumber} as the payment reference, then send the receipt on WhatsApp to ${siteConfig.phoneDisplay}. We dispatch as soon as the payment is confirmed.`}
      />
    );
  }
  return (
    <Panel
      title="Payment on delivery"
      accent
      rows={[
        ["Payment", "Cash on delivery"],
        ["Amount due", formatPkr(o.totalPkr)],
      ]}
      note={`Please pay ${formatPkr(o.totalPkr)} in cash to the courier when your parcel arrives. Our team may call ${o.phone || "you"} to confirm the order before dispatch.`}
    />
  );
}

/* ---------- customer: order placed ---------- */

export function OrderConfirmationEmail({ order: o }: { order: OrderEmailData }) {
  const isBank = o.paymentMethod === "bank";
  return (
    <EmailLayout
      preview={`Order ${o.orderNumber}: ${formatPkr(o.totalPkr)}. ${isBank ? "Payment details inside." : "Pay cash on delivery."}`}
      reason={`You are receiving this email because you placed order ${o.orderNumber} at ${siteConfig.name}.`}
    >
      <Eyebrow>Order received</Eyebrow>
      <Title>Thank you, {firstName(o)}</Title>
      <P>
        {isBank
          ? "We have your order and are holding it for you. Complete the bank or wallet transfer below and we will confirm and prepare it as soon as the payment arrives."
          : "We have your order. Our team will call or WhatsApp you to confirm it before dispatch, and you will hear from us again when it ships."}
      </P>
      <ReferenceBadge label="Order number" value={o.orderNumber} />
      <PaymentPanel o={o} />
      <OrderDetails o={o} />
      <Cta href={trackUrl(o)}>Track your order</Cta>
      <P muted>
        Need a copy for your records? <a href={invoiceUrl(o)} style={{ color: "#3A3A3A" }}>Download the invoice (PDF)</a>.
        You will need the order number and your email address to track the parcel.
      </P>
    </EmailLayout>
  );
}

export function orderConfirmation(order: OrderEmailData): EmailDefinition {
  return {
    subject: `Order ${order.orderNumber} received | ${siteConfig.name}`,
    element: <OrderConfirmationEmail order={order} />,
  };
}

/* ---------- customer: status changes ---------- */

const STATUS_COPY: Record<string, { eyebrow: string; title: (n: string) => string; body: string; subject: (n: string) => string }> = {
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

export function OrderStatusEmail({ order: o, status }: { order: OrderEmailData; status: string }) {
  const copy = STATUS_COPY[status]!;
  const first = o.lines[0];
  const reviewUrl = first?.productHandle
    ? absoluteUrl(`/products/${encodeURIComponent(first.productHandle)}#reviews`)
    : absoluteUrl("/products");
  const shipment: Array<[string, string]> = [];
  if (o.carrier) shipment.push(["Courier", o.carrier]);
  if (o.trackingNumber) shipment.push(["Tracking number", o.trackingNumber]);
  if (deliveryWindow(o)) shipment.push(["Expected", deliveryWindow(o)]);

  return (
    <EmailLayout
      preview={`${copy.subject(o.orderNumber)}. ${copy.body.split(". ")[0]}.`}
      reason={`You are receiving this email about order ${o.orderNumber} placed at ${siteConfig.name}.`}
    >
      <Eyebrow>{copy.eyebrow}</Eyebrow>
      <Title>{copy.title(firstName(o))}</Title>
      <P>{copy.body}</P>
      <ReferenceBadge label="Order number" value={o.orderNumber} />

      {status === "shipped" ? (
        <>
          {shipment.length ? <Panel title="Shipment" accent rows={shipment} /> : null}
          {o.paymentMethod === "cod" ? (
            <P>
              Please keep <Strong>{formatPkr(o.totalPkr)}</Strong> ready in cash for the courier.
            </P>
          ) : null}
          <Cta href={o.trackingUrl || trackUrl(o)}>{o.trackingUrl ? "Track with the courier" : "Track your order"}</Cta>
        </>
      ) : null}

      {status === "delivered" ? (
        <>
          <P>
            When you have worn it for a day or two, a short review helps other customers choose with confidence. It
            takes less than a minute.
          </P>
          <Cta href={reviewUrl}>Write a review</Cta>
        </>
      ) : null}

      {status === "confirmed" ? <Cta href={trackUrl(o)}>Track your order</Cta> : null}
      {status === "cancelled" ? <Cta href={absoluteUrl("/products")}>Continue shopping</Cta> : null}

      {status !== "cancelled" ? (
        <>
          <Divider />
          <Subtitle>Your order</Subtitle>
          <LineItems lines={o.lines} />
          <OrderTotals o={o} />
          <P muted>
            <a href={invoiceUrl(o)} style={{ color: "#3A3A3A" }}>Download the invoice (PDF)</a>
          </P>
        </>
      ) : null}
    </EmailLayout>
  );
}

export function orderStatus(order: OrderEmailData, status: string): EmailDefinition | null {
  const copy = STATUS_COPY[status];
  if (!copy) return null;
  return {
    subject: `${copy.subject(order.orderNumber)} | ${siteConfig.name}`,
    element: <OrderStatusEmail order={order} status={status} />,
  };
}

/* ---------- store team: new order ---------- */

export function AdminNewOrderEmail({ order: o }: { order: OrderEmailData }) {
  const payment = o.paymentMethod === "bank" ? "Bank transfer / wallet (verify receipt)" : "Cash on delivery";
  return (
    <EmailLayout
      internal
      preview={`${o.customerName || o.email} ordered ${o.lines.length} item(s), ${formatPkr(o.totalPkr)}, ${payment}.`}
      reason="Internal notification for the NS Perfume store team."
    >
      <Eyebrow>New order</Eyebrow>
      <Title>
        {o.orderNumber} · {formatPkr(o.totalPkr)}
      </Title>
      <Panel
        accent
        rows={[
          ["Customer", o.customerName || "Guest"],
          ["Email", o.email],
          ["Phone", o.phone || o.shippingAddress.phone || "Not given"],
          ["City", [o.shippingAddress.city, o.shippingAddress.province].filter(Boolean).join(", ")],
          ["Payment", payment],
          ["Shipping", o.shippingMethod?.title || "Standard"],
          ["Placed", formatDate(o.createdAt)],
        ]}
        note={o.notes ? `Customer note: ${o.notes}` : undefined}
      />
      <LineItems lines={o.lines} />
      <OrderTotals o={o} />
      <Cta href={absoluteUrl(`/admin/orders/${encodeURIComponent(o.orderNumber)}`)}>Open in admin</Cta>
    </EmailLayout>
  );
}

export function adminNewOrder(order: OrderEmailData): EmailDefinition {
  return {
    subject: `New order ${order.orderNumber} · ${formatPkr(order.totalPkr)}`,
    element: <AdminNewOrderEmail order={order} />,
  };
}
