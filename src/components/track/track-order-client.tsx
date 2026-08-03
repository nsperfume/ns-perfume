"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DeliveryMap } from "@/components/track/delivery-map";
import { useCurrency } from "@/context/currency";
import { formatSize } from "@/lib/format";
import {
  formatDayRange,
  formatStatusDate,
  type MapCoords,
  type OrderStatus,
  type TimelineStep,
} from "@/lib/order-status";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/data/site";

type TrackedOrder = {
  orderNumber: string;
  status: OrderStatus;
  headline: string;
  subcopy: string;
  timeline: TimelineStep[];
  map: MapCoords;
  email: string;
  phone?: string;
  customerName?: string;
  currency: string;
  subtotalPkr: number;
  discountPkr: number;
  discountCode?: string;
  shippingPkr: number;
  taxPkr: number;
  totalPkr: number;
  paymentMethod?: string;
  shippingMethod?: { id?: string; title?: string; description?: string };
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  lines: {
    productHandle?: string;
    name: string;
    sizeMl?: number;
    sku: string;
    quantity: number;
    unitPricePkr: number;
    image?: string;
    isGift?: boolean;
  }[];
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery: { from: string; to: string };
  createdAt?: string;
};

const paymentLabels: Record<string, string> = {
  cod: "Cash on delivery (COD)",
  card: "Credit / debit card",
  bank: "Bank deposit / transfer",
};

function TrackLookUpForm({
  orderNumber,
  email,
  setOrderNumber,
  setEmail,
  onSubmit,
  loading,
  error,
}: {
  orderNumber: string;
  email: string;
  setOrderNumber: (v: string) => void;
  setEmail: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="mx-auto w-full max-w-md">
      <header className="mb-8 text-center">
        <Link
          href="/"
          className="inline-block font-display text-xl font-medium tracking-tight text-ink"
        >
          {siteConfig.name}
        </Link>
        <h1 className="mt-8 font-display text-3xl font-medium tracking-tight text-ink">
          Track your order
        </h1>
        <p className="mt-2 font-serif text-base leading-relaxed text-taupe">
          Enter the order number from your confirmation and the email used at
          checkout.
        </p>
      </header>

      <form
        className="space-y-4 rounded-md border border-hairline bg-paper p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <label
            htmlFor="track-order"
            className="mb-1.5 block font-display text-sm font-medium text-ink"
          >
            Order number
          </label>
          <input
            id="track-order"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. NS-4821"
            autoComplete="off"
            required
            className="w-full rounded-md border border-hairline bg-paper px-3.5 py-3 font-serif text-base text-ink outline-none focus:border-brass focus:ring-2 focus:ring-brass/20"
          />
        </div>
        <div>
          <label
            htmlFor="track-email"
            className="mb-1.5 block font-display text-sm font-medium text-ink"
          >
            Email
          </label>
          <input
            id="track-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="w-full rounded-md border border-hairline bg-paper px-3.5 py-3 font-serif text-base text-ink outline-none focus:border-brass focus:ring-2 focus:ring-brass/20"
          />
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-md border border-rosewood/30 bg-rosewood/10 px-3 py-2.5 font-display text-sm text-rosewood"
          >
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-md bg-ink font-display text-sm font-medium uppercase tracking-[0.12em] text-paper transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "Looking up…" : "Track order"}
        </button>
      </form>

      <p className="mt-6 text-center font-display text-sm text-taupe">
        Need help?{" "}
        <a
          href={`mailto:${siteConfig.email}`}
          className="text-brass hover:underline"
        >
          Contact us
        </a>
      </p>
    </div>
  );
}

function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const done = step.state === "done";
        const current = step.state === "current";
        const cancelled = step.state === "cancelled";
        return (
          <li key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-0.5 flex h-3.5 w-3.5 shrink-0 rounded-full border-2",
                  done && "border-brass bg-brass",
                  current && "border-brass bg-paper",
                  cancelled && "border-rosewood bg-rosewood",
                  step.state === "upcoming" && "border-hairline bg-paper",
                )}
              />
              {!isLast ? (
                <span
                  className={cn(
                    "w-px flex-1 min-h-[1.75rem]",
                    done ? "bg-brass" : "bg-hairline",
                  )}
                />
              ) : null}
            </div>
            <div className={cn("pb-5", isLast && "pb-0")}>
              <p
                className={cn(
                  "font-display text-base font-medium",
                  cancelled ? "text-rosewood" : "text-ink",
                  step.state === "upcoming" && "text-taupe",
                )}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-taupe">
                {step.description}
              </p>
              {step.at ? (
                <p className="mt-1 font-display text-xs text-taupe/80">
                  {formatStatusDate(step.at)}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function OrderStatusView({
  order,
  onLookupAnother,
}: {
  order: TrackedOrder;
  onLookupAnother: () => void;
}) {
  const { format } = useCurrency();
  const name =
    order.customerName ||
    [order.shippingAddress.firstName, order.shippingAddress.lastName]
      .filter(Boolean)
      .join(" ");
  const addr = order.shippingAddress;
  const etaLabel = formatDayRange(
    order.estimatedDelivery.from,
    order.estimatedDelivery.to,
  );

  return (
    <div className="mx-auto grid w-full max-w-[1100px] gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      {/* Main column */}
      <div className="px-5 py-8 sm:px-8 lg:px-12 lg:py-10 xl:px-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="font-display text-xl font-medium tracking-tight text-ink"
          >
            {siteConfig.name}
          </Link>
          <button
            type="button"
            onClick={onLookupAnother}
            className="cursor-pointer text-[13px] text-brass hover:underline"
          >
            Look up another order
          </button>
        </div>

        <p className="text-[13px] text-taupe">
          Order <span className="font-mono text-ink">#{order.orderNumber}</span>
        </p>
        <h1 className="mt-1 font-display text-2xl font-medium leading-snug text-ink sm:text-3xl">
          {order.headline}
          {name ? (
            <span className="font-normal text-taupe">
              , {name.split(" ")[0]}
            </span>
          ) : null}
        </h1>
        <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-taupe">
          {order.subcopy}
        </p>

        {order.status !== "cancelled" && order.status !== "delivered" ? (
          <div className="mt-5 rounded-md border border-hairline bg-canvas-deep px-4 py-3">
            <p className="text-[12px] uppercase tracking-wide text-taupe">
              Estimated delivery
            </p>
            <p className="mt-0.5 text-[15px] font-medium text-ink">
              {etaLabel}
            </p>
            {order.shippingMethod?.title ? (
              <p className="mt-0.5 text-[13px] text-taupe">
                {order.shippingMethod.title}
                {order.shippingMethod.description
                  ? ` · ${order.shippingMethod.description}`
                  : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Map + tracking (Shopify-style) */}
        <section className="mt-6">
          <h2 className="mb-3 font-display text-lg font-medium text-ink">
            {order.status === "delivered"
              ? "Delivered to"
              : order.status === "shipped"
                ? "On the way to"
                : "Shipping to"}
          </h2>
          <DeliveryMap map={order.map} />
        </section>

        {(order.trackingNumber || order.carrier) &&
        (order.status === "shipped" || order.status === "delivered") ? (
          <section className="mt-4 rounded-md border border-hairline p-4">
            <h2 className="text-[14px] font-semibold text-ink">
              Tracking details
            </h2>
            <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
              {order.carrier ? (
                <div>
                  <dt className="text-taupe">Carrier</dt>
                  <dd className="font-medium text-ink">{order.carrier}</dd>
                </div>
              ) : null}
              {order.trackingNumber ? (
                <div>
                  <dt className="text-taupe">Tracking number</dt>
                  <dd className="font-mono font-medium text-ink">
                    {order.trackingNumber}
                  </dd>
                </div>
              ) : null}
            </dl>
            {order.trackingUrl ? (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-10 items-center rounded-md bg-ink px-4 font-display text-sm font-medium uppercase tracking-[0.1em] text-paper hover:opacity-90"
              >
                Track shipment
              </a>
            ) : null}
          </section>
        ) : null}

        <section className="mt-6 rounded-md border border-hairline p-5">
          <h2 className="mb-4 font-display text-lg font-medium text-ink">
            Order updates
          </h2>
          <Timeline steps={order.timeline} />
        </section>

        <section className="mt-4 rounded-md border border-hairline p-5">
          <h2 className="font-display text-lg font-medium text-ink">
            Customer information
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-taupe">
                Contact
              </h3>
              <p className="mt-1.5 text-[14px] text-ink">{order.email}</p>
              {(order.phone || addr.phone) && (
                <p className="text-[14px] text-taupe">
                  {order.phone || addr.phone}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-taupe">
                Payment
              </h3>
              <p className="mt-1.5 text-[14px] text-ink">
                {paymentLabels[order.paymentMethod || ""] ||
                  order.paymentMethod ||
                  "—"}
              </p>
              <p className="text-[14px] text-taupe">
                {format(order.totalPkr)}
              </p>
            </div>
            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-taupe">
                Shipping address
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-taupe">
                {name}
                <br />
                {addr.address1}
                {addr.address2 ? (
                  <>
                    <br />
                    {addr.address2}
                  </>
                ) : null}
                <br />
                {[addr.city, addr.province, addr.postalCode]
                  .filter(Boolean)
                  .join(", ")}
                <br />
                {addr.country === "PK" ? "Pakistan" : addr.country}
              </p>
            </div>
            <div>
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-taupe">
                Shipping method
              </h3>
              <p className="mt-1.5 text-[14px] text-ink">
                {order.shippingMethod?.title || "Standard"}
              </p>
              {order.shippingMethod?.description ? (
                <p className="text-[13px] text-taupe">
                  {order.shippingMethod.description}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-6">
          <a
            href={`mailto:${siteConfig.email}?subject=Order%20${encodeURIComponent(order.orderNumber)}`}
            className="text-[14px] text-brass hover:underline"
          >
            Need help? Contact us
          </a>
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-6 font-display text-sm font-medium uppercase tracking-[0.12em] text-paper hover:opacity-90"
          >
            Continue shopping
          </Link>
        </div>
      </div>

      {/* Order summary sidebar */}
      <aside className="border-t border-hairline bg-canvas-deep lg:border-l lg:border-t-0">
        <div className="px-5 py-8 sm:px-8 lg:sticky lg:top-0 lg:px-10 lg:py-10">
          <h2 className="mb-5 font-display text-lg font-medium text-ink">
            Order summary
          </h2>
          <ul className="space-y-4">
            {order.lines.map((line) => (
              <li key={line.sku} className="flex gap-3.5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-hairline bg-paper">
                  {line.image ? (
                    <Image
                      src={line.image}
                      alt=""
                      fill
                      className="object-contain p-1.5"
                      sizes="64px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-medium text-ink">
                    {line.name}
                  </p>
                  <p className="text-sm text-taupe">
                    Qty {line.quantity}
                    {line.sizeMl
                      ? ` · ${formatSize(line.sizeMl)}`
                      : ` · ${line.sku}`}
                    {line.isGift ? " · Gift" : ""}
                  </p>
                </div>
                <p className="shrink-0 font-display text-base tabular-nums text-ink">
                  {format(line.unitPricePkr * line.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2 border-t border-hairline pt-4 text-base text-taupe">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-ink">{format(order.subtotalPkr)}</span>
            </div>
            {order.discountPkr > 0 ? (
              <div className="flex justify-between">
                <span>
                  Discount
                  {order.discountCode ? ` (${order.discountCode})` : ""}
                </span>
                <span className="text-ink">−{format(order.discountPkr)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-ink">
                {order.shippingPkr === 0
                  ? "Free"
                  : format(order.shippingPkr)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taxes</span>
              <span className="text-ink">{format(order.taxPkr || 0)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-hairline pt-4">
            <span className="font-display text-base font-medium text-ink">Total</span>
            <span className="font-display text-2xl font-medium tracking-tight text-ink">
              {format(order.totalPkr)}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [autoTried, setAutoTried] = useState(false);

  const lookup = useCallback(async (on: string, em: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: on, email: em }),
      });
      const json = await res.json();
      if (!json.ok) {
        setOrder(null);
        setError(json.error || "Could not find that order.");
        return;
      }
      setOrder(json.data as TrackedOrder);
      try {
        sessionStorage.setItem(
          "ns-track-last",
          JSON.stringify({ orderNumber: on, email: em }),
        );
      } catch {
        /* ignore */
      }
    } catch {
      setOrder(null);
      setError("Could not reach the server. Try again shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const qOrder =
      searchParams.get("orderNumber") ||
      searchParams.get("order") ||
      searchParams.get("o") ||
      "";
    const qEmail =
      searchParams.get("email") || searchParams.get("e") || "";
    if (qOrder) setOrderNumber(qOrder);
    if (qEmail) setEmail(qEmail);
    if (qOrder && qEmail && !autoTried) {
      setAutoTried(true);
      void lookup(qOrder, qEmail);
      return;
    }
    if (!autoTried) {
      setAutoTried(true);
      try {
        const raw = sessionStorage.getItem("ns-track-last");
        if (raw && !qOrder) {
          const d = JSON.parse(raw) as {
            orderNumber?: string;
            email?: string;
          };
          if (d.orderNumber) setOrderNumber(d.orderNumber);
          if (d.email) setEmail(d.email);
        }
      } catch {
        /* ignore */
      }
    }
  }, [searchParams, lookup, autoTried]);

  return (
    <div className="min-h-dvh bg-canvas font-serif text-base text-ink ">
      {order ? (
        <OrderStatusView
          order={order}
          onLookupAnother={() => {
            setOrder(null);
            setError(null);
          }}
        />
      ) : (
        <div className="flex min-h-dvh items-start justify-center px-5 py-12 sm:py-16">
          <TrackLookUpForm
            orderNumber={orderNumber}
            email={email}
            setOrderNumber={setOrderNumber}
            setEmail={setEmail}
            loading={loading}
            error={error}
            onSubmit={() => lookup(orderNumber, email)}
          />
        </div>
      )}
    </div>
  );
}
