"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DownloadIcon } from "@animateicons/react/lucide";
import { z } from "zod";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  AdminFieldLabel,
  adminFieldClass,
} from "@/components/admin/form-section";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminStatusBadge,
  formatPkr,
  readAdminJson,
} from "@/components/admin/ui";
import { Button } from "@/components/admin/button";
import { Select } from "@/components/admin/select";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { toast } from "@/components/admin/toast";
import {
  AdminFieldError,
  AdminFormError,
  useFormValidation,
} from "@/components/admin/form-validation";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";
import { formatOrderNumber } from "@/lib/order-number";
import { formatSize } from "@/lib/format";
import { siteConfig } from "@/data/site";
import {
  ORDER_STATUSES,
  formatOrderAddress,
  formatOrderDate,
  formatOrderDateTime,
  mapAdminOrder,
  orderStatusOptions,
  paymentLabel,
  type AdminOrder,
} from "@/lib/admin-order-ui";

type Fulfillment = {
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
};

/** Mirrors PATCH /api/orders/[orderNumber] fulfillment rules. */
const fulfillmentSchema = z.object({
  carrier: z.string().trim().max(80, "Keep the courier name under 80 characters"),
  trackingNumber: z
    .string()
    .trim()
    .max(120, "Keep the tracking number under 120 characters"),
  trackingUrl: z
    .string()
    .trim()
    .max(500, "This link is too long")
    .refine(
      (v) => !v || /^https?:\/\//i.test(v),
      "Start the link with https://",
    ),
});

function fulfillmentFrom(order: AdminOrder): Fulfillment {
  return {
    carrier: order.carrier || "",
    trackingNumber: order.trackingNumber || "",
    trackingUrl: order.trackingUrl || "",
  };
}

/** Library formatters return a dash for missing values; show nothing instead. */
function clean(s: string) {
  return s === "—" ? "" : s;
}

function statusLabel(value: string) {
  return ORDER_STATUSES.find((s) => s.value === value)?.label ?? value;
}

function Section({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-admin-line bg-admin-paper shadow-admin ${className}`}
    >
      <div className="flex min-h-13 items-center justify-between gap-3 border-b border-admin-line px-5 py-3 sm:px-6">
        <h2 className="text-base font-semibold text-admin-ink">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function Row({
  label,
  children,
  strong,
}: {
  label: string;
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${strong ? "border-t border-admin-line pt-3 text-base font-semibold text-admin-ink" : ""}`}
    >
      <span className={strong ? "" : "text-admin-muted"}>{label}</span>
      <span className="text-right font-mono tabular-nums">{children}</span>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber || "");
  const formRef = useRef<HTMLFormElement>(null);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(
    null,
  );
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [tracking, setTracking] = useState<Fulfillment>({
    carrier: "",
    trackingNumber: "",
    trackingUrl: "",
  });
  const [confirmCancel, setConfirmCancel] = useState(false);
  const v = useFormValidation(fulfillmentSchema);

  const load = useCallback(() => {
    if (!orderNumber) return;
    setLoading(true);
    setError("");
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          const next = mapAdminOrder(j.data);
          setOrder(next);
          setTracking(fulfillmentFrom(next));
        } else setError(j.error || "Order not found");
      })
      .catch(() => setError("Could not load this order. Check your connection."))
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

  const trackingDirty = order
    ? JSON.stringify({
        carrier: tracking.carrier.trim(),
        trackingNumber: tracking.trackingNumber.trim(),
        trackingUrl: tracking.trackingUrl.trim(),
      }) !== JSON.stringify(fulfillmentFrom(order))
    : false;

  const leaveGuard = useUnsavedChangesGuard(trackingDirty && !saving);

  /** Sends status plus the courier fields as typed (blank = none). */
  async function updateStatus(status: string): Promise<boolean> {
    if (!order) return false;
    if (!v.validate(tracking, formRef.current)) {
      toast.error("Check the courier tracking details");
      return false;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.orderNumber)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            carrier: tracking.carrier.trim(),
            trackingNumber: tracking.trackingNumber.trim(),
            trackingUrl: tracking.trackingUrl.trim(),
          }),
        },
      );
      const json = await readAdminJson(res);
      if (!json.ok) {
        const message = json.error || "Could not update the order";
        setFormError(message);
        toast.error(message);
        return false;
      }
      toast.success(
        status === order.status
          ? "Tracking details saved"
          : `Order marked ${statusLabel(status).toLowerCase()}`,
      );
      v.reset();
      load();
      return true;
    } catch {
      toast.error("Network error. The order was not updated.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function onStatusChange(next: string) {
    if (!order || next === order.status) return;
    if (next === "cancelled") {
      setConfirmCancel(true);
      return;
    }
    void updateStatus(next);
  }

  const ref = order ? formatOrderNumber(order.orderNumber) : orderNumber;
  const itemCount = useMemo(
    () => (order?.lines || []).reduce((n, l) => n + (l.quantity || 1), 0),
    [order],
  );

  const timeline = order
    ? (
        [
          ["Placed", order.createdAt],
          ["Confirmed", order.confirmedAt],
          ["Shipped", order.shippedAt],
          ["Delivered", order.deliveredAt],
          ["Cancelled", order.cancelledAt],
        ] as const
      ).filter(([, at]) => Boolean(at))
    : [];

  const shippingAddress = order ? clean(formatOrderAddress(order.shippingAddress)) : "";
  const billingAddress =
    order && !order.billingSameAsShipping && order.billingAddress
      ? clean(formatOrderAddress(order.billingAddress))
      : "";

  function fieldProps(name: keyof Fulfillment) {
    return {
      id: `order-${name}`,
      name,
      value: tracking[name],
      disabled: saving,
      "aria-invalid": v.errors[name] ? true : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = { ...tracking, [name]: e.target.value };
        setTracking(next);
        v.revalidate(next);
      },
      onBlur: () => v.revalidate(tracking),
    };
  }

  return (
    <AdminShell user={user}>
      <AdminPageHeader
        title={order ? `Order ${ref}` : "Order"}
        description={
          order ? `Placed ${clean(formatOrderDateTime(order.createdAt))}` : undefined
        }
        backHref="/admin/orders"
        backLabel="Orders"
        action={
          order ? (
            <a
              href={`/api/orders/${encodeURIComponent(order.orderNumber)}/invoice`}
              download
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-admin-ink bg-admin-ink px-5 text-sm font-semibold text-admin-paper transition-colors hover:border-brass hover:bg-brass hover:text-white sm:w-auto"
            >
              <DownloadIcon size={17} color="currentColor" isAnimated={false} />
              Download invoice
            </a>
          ) : null
        }
      />

      {loading && !order ? (
        <p className="text-base text-admin-muted">Loading order…</p>
      ) : error ? (
        <div className="rounded-lg border border-admin-line bg-admin-paper">
          <AdminEmptyState
            title="Order not available"
            description={error}
            action={
              <Button href="/admin/orders" variant="secondary">
                Back to orders
              </Button>
            }
          />
        </div>
      ) : order ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
          {/* Main: items, customer, delivery */}
          <div className="order-2 min-w-0 space-y-6 xl:order-1">
            <Section
              title="Items"
              action={
                <span className="text-sm text-admin-muted">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              }
            >
              <ul className="divide-y divide-admin-line">
                {(order.lines || []).map((l, i) => (
                  <li
                    key={`${l.sku || l.productHandle}-${i}`}
                    className="flex gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-admin-line bg-admin-soft-2 sm:h-24 sm:w-24">
                      {l.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={l.image}
                          alt={l.name || "Product"}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      {l.productHandle ? (
                        <Link
                          href={`/admin/products/${encodeURIComponent(l.productHandle)}`}
                          className="text-base font-semibold text-admin-ink hover:underline"
                        >
                          {l.name}
                        </Link>
                      ) : (
                        <p className="text-base font-semibold text-admin-ink">
                          {l.name}
                        </p>
                      )}
                      <p className="mt-1 text-[0.9375rem] text-admin-muted">
                        {[
                          l.sizeMl ? formatSize(l.sizeMl) : "",
                          l.isGift ? "Gift" : "",
                          l.giftWrap ? "Gift wrap" : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {l.sku ? (
                        <p className="mt-1 font-mono text-[0.8125rem] text-admin-muted">
                          {l.sku}
                        </p>
                      ) : null}
                      {l.giftMessage ? (
                        <p className="mt-3 rounded-md border border-admin-line bg-admin-soft-2 px-3 py-2.5 text-[0.9375rem] leading-snug text-admin-ink">
                          <span className="font-semibold">Gift note:</span>{" "}
                          {l.giftMessage}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[0.9375rem] font-medium tabular-nums text-admin-ink">
                        {formatPkr((l.unitPricePkr || 0) * (l.quantity || 1))}
                      </p>
                      <p className="mt-1 font-mono text-[0.8125rem] tabular-nums text-admin-muted">
                        {l.quantity || 1} × {formatPkr(l.unitPricePkr || 0)}
                      </p>
                    </div>
                  </li>
                ))}
                {!order.lines?.length ? (
                  <li className="py-6 text-[0.9375rem] text-admin-muted">
                    No items on this order.
                  </li>
                ) : null}
              </ul>

              <div className="mt-5 space-y-2.5 border-t border-admin-line pt-4 text-[0.9375rem]">
                <Row label="Subtotal">{formatPkr(order.subtotalPkr ?? 0)}</Row>
                {(order.discountPkr || 0) > 0 ? (
                  <Row
                    label={`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`}
                  >
                    <span className="text-admin-danger">
                      −{formatPkr(order.discountPkr || 0)}
                    </span>
                  </Row>
                ) : null}
                <Row label="Shipping">{formatPkr(order.shippingPkr ?? 0)}</Row>
                {(order.taxPkr || 0) > 0 ? (
                  <Row label="Tax">{formatPkr(order.taxPkr || 0)}</Row>
                ) : null}
                <Row label="Total" strong>
                  {formatPkr(order.totalPkr)}
                </Row>
              </div>
            </Section>

            <div className="grid gap-6 md:grid-cols-2">
              <Section
                title="Customer"
                action={
                  <Link
                    href={`/admin/customers/${encodeURIComponent(order.email)}`}
                    className="text-sm font-semibold text-admin-accent hover:underline"
                  >
                    View profile
                  </Link>
                }
              >
                <p className="text-base font-semibold text-admin-ink">
                  {order.customerName || order.email}
                </p>
                <p className="mt-1.5 break-all text-[0.9375rem] text-admin-ink">
                  {order.email}
                </p>
                {order.phone ? (
                  <p className="mt-1 font-mono text-[0.875rem] tabular-nums text-admin-ink">
                    {order.phone}
                  </p>
                ) : null}
                <p className="mt-3 text-sm text-admin-muted">
                  {order.customerId ? "Has an account" : "Guest checkout"}
                  {order.marketingOptIn ? " · Accepts marketing" : ""}
                </p>
              </Section>

              <Section title="Delivery">
                <p className="text-base font-semibold text-admin-ink">
                  {order.shippingMethod?.title || "Standard delivery"}
                </p>
                {shippingAddress ? (
                  <p className="mt-2 whitespace-pre-line text-[0.9375rem] leading-relaxed text-admin-ink">
                    {shippingAddress}
                  </p>
                ) : null}
                {billingAddress ? (
                  <>
                    <p className="mt-4 text-sm font-semibold text-admin-muted">
                      Billing address
                    </p>
                    <p className="mt-1 whitespace-pre-line text-[0.9375rem] leading-relaxed text-admin-ink">
                      {billingAddress}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-admin-muted">
                    Billing address is the same
                  </p>
                )}
              </Section>
            </div>

            {order.notes ? (
              <Section title="Note from customer">
                <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-admin-ink">
                  {order.notes}
                </p>
              </Section>
            ) : null}
          </div>

          {/* Sidebar: status, courier tracking, payment, timeline */}
          <aside className="order-1 space-y-6 xl:order-2 xl:sticky xl:top-4">
            <Section
              title="Status"
              action={<AdminStatusBadge status={order.status} />}
            >
              <Select
                label="Order status"
                value={order.status}
                onValueChange={onStatusChange}
                options={orderStatusOptions(order.status)}
                disabled={saving || order.status === "cancelled"}
              />
              {order.status === "cancelled" ? (
                <p className="mt-2 text-sm text-admin-muted">
                  Cancelled orders cannot be changed.
                </p>
              ) : null}

              {order.status !== "cancelled" ? (
                <form
                  ref={formRef}
                  noValidate
                  className="mt-5 space-y-4 border-t border-admin-line pt-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void updateStatus(order.status);
                  }}
                >
                  <p className="text-sm font-semibold text-admin-ink">
                    Courier tracking
                  </p>
                  <div>
                    <AdminFieldLabel htmlFor="order-carrier">Courier</AdminFieldLabel>
                    <input
                      {...fieldProps("carrier")}
                      className={adminFieldClass}
                      maxLength={80}
                      placeholder="TCS, Leopards, M&P"
                    />
                    <AdminFieldError message={v.errors.carrier} />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="order-trackingNumber">
                      Tracking number
                    </AdminFieldLabel>
                    <input
                      {...fieldProps("trackingNumber")}
                      className={`${adminFieldClass} font-mono`}
                      maxLength={120}
                    />
                    <AdminFieldError message={v.errors.trackingNumber} />
                  </div>
                  <div>
                    <AdminFieldLabel htmlFor="order-trackingUrl">
                      Tracking link
                    </AdminFieldLabel>
                    <input
                      {...fieldProps("trackingUrl")}
                      type="url"
                      inputMode="url"
                      className={adminFieldClass}
                      maxLength={500}
                      placeholder="https://"
                    />
                    <AdminFieldError message={v.errors.trackingUrl} />
                  </div>
                  {formError ? <AdminFormError>{formError}</AdminFormError> : null}
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={saving || !trackingDirty}
                    className="w-full sm:w-full"
                  >
                    {saving ? "Saving…" : "Save tracking"}
                  </Button>
                </form>
              ) : null}
            </Section>

            <Section title="Payment">
              <p className="text-base font-semibold text-admin-ink">
                {clean(paymentLabel(order.paymentMethod)) || "Payment"}
              </p>
              {order.paymentMethod === "card" && order.cardLast4 ? (
                <p className="mt-1 font-mono text-[0.875rem] text-admin-muted">
                  •••• {order.cardLast4}
                </p>
              ) : null}
              {order.paymentMethod === "cod" ? (
                <p className="mt-1.5 text-[0.9375rem] text-admin-muted">
                  Collect{" "}
                  <span className="font-mono font-medium text-admin-ink">
                    {formatPkr(order.totalPkr)}
                  </span>{" "}
                  on delivery
                </p>
              ) : null}
              {order.paymentMethod === "bank" ? (
                <div className="mt-4 space-y-1.5 rounded-md border border-(--admin-tone-brass-line) bg-(--admin-tone-brass-bg) p-3.5 text-[0.9375rem]">
                  <p className="font-semibold text-admin-ink">
                    {siteConfig.bankTransfer.bankName}
                  </p>
                  <p className="text-admin-muted">
                    {siteConfig.bankTransfer.accountTitle}
                  </p>
                  <p className="font-mono text-[0.875rem] tabular-nums text-admin-ink">
                    {siteConfig.bankTransfer.accountNumber}
                  </p>
                  <p className="break-all font-mono text-[0.8125rem] tabular-nums text-admin-muted">
                    {siteConfig.bankTransfer.iban}
                  </p>
                  <p className="pt-1 text-admin-muted">
                    Reference: <span className="font-mono">{ref}</span>
                  </p>
                  {order.status === "pending" ? (
                    <p className="pt-1 font-semibold text-admin-accent">
                      Confirm the order once the transfer arrives.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </Section>

            {order.trackingUrl || order.estimatedDeliveryFrom ? (
              <Section title="Shipment">
                {order.estimatedDeliveryFrom ? (
                  <p className="text-[0.9375rem] text-admin-ink">
                    Expected {clean(formatOrderDate(order.estimatedDeliveryFrom))}
                    {order.estimatedDeliveryTo
                      ? ` to ${clean(formatOrderDate(order.estimatedDeliveryTo))}`
                      : ""}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {order.trackingUrl ? (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-admin-accent hover:underline"
                    >
                      Courier tracking
                    </a>
                  ) : null}
                  <a
                    href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.email)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-admin-accent hover:underline"
                  >
                    Customer tracking page
                  </a>
                </div>
              </Section>
            ) : null}

            <Section title="Timeline">
              <ol className="space-y-3 text-[0.9375rem]">
                {timeline.map(([label, at]) => (
                  <li key={label} className="flex justify-between gap-3">
                    <span className="text-admin-muted">{label}</span>
                    <span className="text-right text-admin-ink">
                      {clean(formatOrderDateTime(at))}
                    </span>
                  </li>
                ))}
              </ol>
            </Section>
          </aside>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={(o) => {
          if (!o && !saving) setConfirmCancel(false);
        }}
        title="Cancel this order?"
        description={`${ref} will be marked cancelled and the customer will see this on the tracking page.${
          order?.discountCode
            ? ` One use of ${order.discountCode} goes back to the coupon.`
            : ""
        } This cannot be undone.`}
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={saving}
        onConfirm={async () => {
          await updateStatus("cancelled");
          setConfirmCancel(false);
        }}
      />
      {leaveGuard}
    </AdminShell>
  );
}
