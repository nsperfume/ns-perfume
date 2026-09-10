"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminPageHeader,
  AdminStatusBadge,
  formatPkr,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatOrderNumber } from "@/lib/order-number";
import { formatSize } from "@/lib/format";
import { siteConfig } from "@/data/site";
import {
  ORDER_STATUSES,
  formatOrderAddress,
  formatOrderDate,
  formatOrderDateTime,
  mapAdminOrder,
  paymentLabel,
  type AdminOrder,
} from "@/lib/admin-order-ui";

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-admin-line bg-admin-paper p-5 shadow-admin ${className}`}
    >
      <h2 className="mb-4 border-b border-admin-line pb-3 font-display text-[12px] font-semibold uppercase tracking-[0.14em] text-admin-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber || "");
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!orderNumber) return;
    setLoading(true);
    setError("");
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setOrder(mapAdminOrder(j.data));
        else setError(j.error || "Order not found");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) router.replace("/admin/login");
        else setUser(j.data);
      });
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(status: string) {
    if (!order) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.orderNumber)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "Update failed");
      } else {
        setMsg(`Status updated to ${status}`);
        load();
      }
    } catch {
      setMsg("Network error");
    } finally {
      setSaving(false);
    }
  }

  const ref = order ? formatOrderNumber(order.orderNumber) : orderNumber;

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title={order ? `Order ${ref}` : "Order"}
        description={
          order
            ? `Placed ${formatOrderDateTime(order.createdAt)}`
            : "Order fulfillment detail"
        }
        backHref="/admin/orders"
        backLabel="Orders"
        action={
          order ? (
            <div className="flex flex-wrap gap-2">
              <Button
                href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.email)}`}
                variant="secondary"
                className="w-auto!"
              >
                Track page
              </Button>
              <Button
                href={`/admin/customers/${encodeURIComponent(order.email)}`}
                variant="secondary"
                className="w-auto!"
              >
                Customer
              </Button>
            </div>
          ) : null
        }
      />

      {msg ? (
        <p className="mb-5 rounded-md border border-admin-line bg-admin-paper px-4 py-3 text-[15px] text-admin-ink">
          {msg}
        </p>
      ) : null}

      {loading ? (
        <p className="text-base text-admin-muted">Loading order…</p>
      ) : error ? (
        <p className="rounded-lg border border-admin-line bg-admin-paper px-4 py-3 text-base text-admin-ink">
          {error}
        </p>
      ) : order ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          {/* Fulfillment first on mobile (order-1), sticky rail on desktop */}
          <aside className="order-1 space-y-6 xl:order-2 xl:sticky xl:top-4">
            <Section title="Fulfillment">
              <div className="mb-4 flex items-center justify-between gap-3">
                <AdminStatusBadge status={order.status} />
                <p className="text-xl font-semibold tabular-nums text-admin-ink">
                  {formatPkr(order.totalPkr)}
                </p>
              </div>
              <Select
                label="Update status"
                value={order.status}
                onValueChange={updateStatus}
                options={[...ORDER_STATUSES]}
                disabled={saving}
                triggerClassName="border-admin-input-border! bg-admin-soft-2! text-admin-ink!"
              />
            </Section>

            <Section title="Payment">
              <p className="text-base font-semibold text-admin-ink">
                {paymentLabel(order.paymentMethod)}
              </p>
              <p className="mt-1 text-[14px] text-admin-muted">
                {order.currency || "PKR"}
              </p>

              {order.paymentMethod === "bank" ? (
                <div className="mt-4 space-y-2 rounded-md border border-brass/35 bg-brass/5 p-3 text-[14px]">
                  <p className="font-medium text-admin-ink">
                    Transfer to {siteConfig.bankTransfer.bankName}
                  </p>
                  <p className="text-admin-muted">
                    {siteConfig.bankTransfer.accountTitle}
                  </p>
                  <p className="font-mono tabular-nums text-admin-ink">
                    {siteConfig.bankTransfer.accountNumber}
                  </p>
                  <p className="font-mono text-[13px] tabular-nums text-admin-muted">
                    {siteConfig.bankTransfer.iban}
                  </p>
                  <p className="pt-1 text-admin-muted">Reference: {ref}</p>
                  {order.status === "pending" ? (
                    <p className="font-medium text-brass">
                      Await transfer, then mark confirmed.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {order.paymentMethod === "cod" ? (
                <p className="mt-3 text-[15px] text-admin-muted">
                  Collect {formatPkr(order.totalPkr)} at delivery.
                </p>
              ) : null}

              {order.paymentMethod === "card" ? (
                <p className="mt-3 text-[15px] text-admin-muted">
                  Card
                  {order.cardLast4 ? ` ···· ${order.cardLast4}` : ""}. Confirm
                  settlement if still pending.
                </p>
              ) : null}
            </Section>

            <Section title="Tracking">
              <p className="font-mono text-[15px] text-admin-ink">
                {order.trackingNumber || "Not assigned yet"}
              </p>
              {order.carrier ? (
                <p className="mt-1 text-[15px] text-admin-muted">
                  {order.carrier}
                </p>
              ) : null}
              {order.trackingUrl ? (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-[15px] font-medium text-brass hover:underline"
                >
                  Carrier tracking link
                </a>
              ) : null}
              {(order.estimatedDeliveryFrom || order.estimatedDeliveryTo) && (
                <p className="mt-3 text-[15px] text-admin-muted">
                  ETA {formatOrderDate(order.estimatedDeliveryFrom)}
                  {order.estimatedDeliveryTo
                    ? ` to ${formatOrderDate(order.estimatedDeliveryTo)}`
                    : ""}
                </p>
              )}
            </Section>

            <Section title="Timeline">
              <ul className="space-y-3 text-[15px]">
                <li className="flex justify-between gap-3">
                  <span className="text-admin-muted">Placed</span>
                  <span className="text-right text-admin-ink">
                    {formatOrderDateTime(order.createdAt)}
                  </span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-admin-muted">Confirmed</span>
                  <span className="text-right text-admin-ink">
                    {formatOrderDateTime(order.confirmedAt)}
                  </span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-admin-muted">Shipped</span>
                  <span className="text-right text-admin-ink">
                    {formatOrderDateTime(order.shippedAt)}
                  </span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-admin-muted">Delivered</span>
                  <span className="text-right text-admin-ink">
                    {formatOrderDateTime(order.deliveredAt)}
                  </span>
                </li>
                <li className="flex justify-between gap-3">
                  <span className="text-admin-muted">Cancelled</span>
                  <span className="text-right text-admin-ink">
                    {formatOrderDateTime(order.cancelledAt)}
                  </span>
                </li>
              </ul>
            </Section>
          </aside>

          <div className="order-2 min-w-0 space-y-6 xl:order-1">
            <Section title="Items ordered">
              <ul className="divide-y divide-admin-line">
                {(order.lines || []).map((l, i) => (
                  <li
                    key={`${l.sku || l.productHandle}-${i}`}
                    className="flex gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-admin-line bg-admin-soft-2 sm:h-28 sm:w-28">
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={l.image}
                          alt={l.name || "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-2 text-center text-[12px] text-admin-faint">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-semibold text-admin-ink">
                        {l.name}
                        {l.isGift ? " (Gift)" : ""}
                      </p>
                      <p className="mt-2 text-[15px] text-admin-muted">
                        Qty {l.quantity}
                        {l.sizeMl ? ` · ${formatSize(l.sizeMl)}` : ""}
                        {l.giftWrap ? " · Gift wrap" : ""}
                      </p>
                      {l.sku ? (
                        <p className="mt-1.5 font-mono text-[15px] tabular-nums text-admin-muted">
                          {l.sku}
                        </p>
                      ) : null}
                      {l.productHandle ? (
                        <Link
                          href={`/admin/products/${encodeURIComponent(l.productHandle)}`}
                          className="mt-2 inline-block text-[15px] font-medium text-brass hover:underline"
                        >
                          Edit product
                        </Link>
                      ) : null}
                      {l.giftMessage ? (
                        <p className="mt-3 rounded-md border border-admin-line bg-admin-soft-2 px-3 py-2.5 text-[15px] leading-snug text-admin-ink">
                          Gift note: {l.giftMessage}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold tabular-nums text-admin-ink">
                        {formatPkr((l.unitPricePkr || 0) * (l.quantity || 1))}
                      </p>
                      <p className="mt-1 text-[15px] tabular-nums text-admin-muted">
                        {formatPkr(l.unitPricePkr || 0)} each
                      </p>
                    </div>
                  </li>
                ))}
                {!order.lines?.length ? (
                  <li className="py-6 text-[15px] text-admin-muted">
                    No line items on this order.
                  </li>
                ) : null}
              </ul>

              <div className="mt-5 space-y-2.5 border-t border-admin-line pt-4 text-[15px]">
                <div className="flex justify-between gap-3">
                  <span className="text-admin-muted">Subtotal</span>
                  <span className="tabular-nums text-admin-ink">
                    {formatPkr(order.subtotalPkr ?? 0)}
                  </span>
                </div>
                {(order.discountPkr || 0) > 0 ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-admin-muted">
                      Discount
                      {order.discountCode ? ` (${order.discountCode})` : ""}
                    </span>
                    <span className="tabular-nums text-rosewood">
                      −{formatPkr(order.discountPkr || 0)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <span className="text-admin-muted">Shipping</span>
                  <span className="tabular-nums text-admin-ink">
                    {formatPkr(order.shippingPkr ?? 0)}
                  </span>
                </div>
                {(order.taxPkr || 0) > 0 ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-admin-muted">Tax</span>
                    <span className="tabular-nums text-admin-ink">
                      {formatPkr(order.taxPkr || 0)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3 border-t border-admin-line pt-3 text-lg font-semibold text-admin-ink">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatPkr(order.totalPkr)}
                  </span>
                </div>
              </div>
            </Section>

            <div className="grid gap-6 md:grid-cols-2">
              <Section title="Customer">
                <p className="text-lg font-semibold text-admin-ink">
                  {order.customerName || "Unknown"}
                </p>
                <p className="mt-2 text-[15px] text-admin-ink">
                  {order.email}
                </p>
                {order.phone ? (
                  <p className="mt-1 text-[15px] tabular-nums text-admin-ink">
                    {order.phone}
                  </p>
                ) : null}
                <p className="mt-3 text-[15px] text-admin-muted">
                  {order.customerId
                    ? "Registered account"
                    : "Guest checkout"}
                  {order.marketingOptIn ? " · Marketing opt-in" : ""}
                </p>
                <Link
                  href={`/admin/customers/${encodeURIComponent(order.email)}`}
                  className="mt-4 inline-block text-[15px] font-medium text-brass hover:underline"
                >
                  Open customer profile
                </Link>
              </Section>

              <Section title="Delivery">
                <p className="text-lg font-semibold text-admin-ink">
                  {order.shippingMethod?.title ||
                    order.shippingMethod?.id ||
                    "Standard"}
                </p>
                {order.shippingMethod?.description ? (
                  <p className="mt-1 text-[15px] text-admin-muted">
                    {order.shippingMethod.description}
                  </p>
                ) : null}
                <pre className="mt-4 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-admin-ink">
                  {formatOrderAddress(order.shippingAddress)}
                </pre>
                {!order.billingSameAsShipping && order.billingAddress ? (
                  <>
                    <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-admin-muted">
                      Billing
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-admin-ink">
                      {formatOrderAddress(order.billingAddress)}
                    </pre>
                  </>
                ) : (
                  <p className="mt-4 text-[14px] text-admin-muted">
                    Billing same as shipping
                  </p>
                )}
              </Section>
            </div>

            {order.notes ? (
              <Section title="Customer notes">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-admin-ink">
                  {order.notes}
                </p>
              </Section>
            ) : null}
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
