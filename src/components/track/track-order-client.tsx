"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DeliveryMap } from "@/components/track/delivery-map";
import { PayableAmount } from "@/components/commerce/price";
import { Logo } from "@/components/brand/logo";
import { useCurrency } from "@/context/currency";
import {
  formatDayRange,
  formatStatusDate,
  type MapCoords,
  type OrderStatus,
  type TimelineStep,
} from "@/lib/order-status";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/data/site";
import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/lib/whatsapp";
import { formatPkMobile, giftLineLabel, lineDisplayName } from "@/lib/checkout";

type TrackedOrder = {
  orderNumber: string;
  /** Signed PDF invoice URL from POST /api/orders/track. */
  invoiceUrl?: string;
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
  codFeePkr?: number;
  taxIncludedPkr?: number;
  taxLabel?: string;
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
    giftWrap?: boolean;
    giftMessage?: string;
  }[];
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery: { from: string; to: string };
  createdAt?: string;
};

const contactLink = "font-semibold underline underline-offset-4";

/** WhatsApp and email links, optionally prefilled with an order number. */
function ContactLinks({ orderNumber, className }: { orderNumber?: string; className?: string }) {
  const text = orderNumber
    ? `Hello ${siteConfig.name}, I need help with order ${orderNumber}.`
    : `Hello ${siteConfig.name}, I need help finding my order.`;
  const subject = orderNumber ? `Order ${orderNumber}` : "Order lookup";
  return (
    <>
      <a
        href={whatsappUrl(siteConfig.phone, text)}
        target="_blank"
        rel="noopener noreferrer"
        className={className ?? contactLink}
      >
        WhatsApp us
      </a>{" "}
      or{" "}
      <a
        href={`mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}`}
        className={className ?? contactLink}
      >
        email us
      </a>
    </>
  );
}

const paymentLabels: Record<string, string> = {
  cod: "Cash on delivery (COD)",
  card: "Credit / debit card",
  bank: "Bank transfer or mobile wallet",
};

function TrackLookUpForm({
  orderNumber,
  email,
  setOrderNumber,
  setEmail,
  onSubmit,
  loading,
  error,
  notFound,
}: {
  orderNumber: string;
  email: string;
  setOrderNumber: (v: string) => void;
  setEmail: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-[30rem]">
      <header className="mb-8 text-center">
        <Link
          href="/"
          aria-label={`${siteConfig.name} home`}
          className="inline-block text-ink"
        >
          <Logo className="h-10 lg:h-11" />
        </Link>
        <h1 className="mt-8 text-display-md text-ink">
          Track your order
        </h1>
        <p className="mt-3 text-body-lg text-taupe">
          Enter the order number from your confirmation and the email used at
          checkout.
        </p>
      </header>

      <form
        className="space-y-5 rounded-xl border border-hairline bg-paper p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <label
            htmlFor="track-order"
            className="mb-2 block text-sm font-semibold text-ink/80"
          >
            Order number
          </label>
          <input
            id="track-order"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. NS-7K4Q2M"
            autoComplete="off"
            required
            className="min-h-12 w-full rounded-xl border border-[#d6cfbf] bg-paper px-4 py-3 text-base text-ink outline-none hover:border-ink/40 focus:border-brass focus:ring-2 focus:ring-brass/25"
          />
        </div>
        <div>
          <label
            htmlFor="track-email"
            className="mb-2 block text-sm font-semibold text-ink/80"
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
            className="min-h-12 w-full rounded-xl border border-[#d6cfbf] bg-paper px-4 py-3 text-base text-ink outline-none hover:border-ink/40 focus:border-brass focus:ring-2 focus:ring-brass/25"
          />
        </div>
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-rosewood/30 bg-rosewood/10 px-4 py-3 text-sm font-medium text-rosewood"
          >
            <p>{error}</p>
            {notFound ? (
              <p className="mt-2 font-normal">
                Still stuck? <ContactLinks orderNumber={orderNumber.trim() || undefined} /> and
                we will find it for you.
              </p>
            ) : null}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-ink text-label text-paper transition-colors hover:bg-brass hover:text-ink disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "Looking up…" : "Track order"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-taupe">
        Need help?{" "}
        <ContactLinks className="font-semibold text-brass-ink underline-offset-4 hover:underline" />
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
                  "font-sans text-base font-semibold",
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
                <p className="mt-1 font-sans text-xs text-taupe/80">
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
    <div className="mx-auto grid w-full max-w-[1240px] gap-0 lg:grid-cols-2 2xl:max-w-[1360px]">
      {/* Main column */}
      <div className="bg-canvas px-5 py-8 sm:px-8 lg:py-12 lg:pl-[var(--gutter)] lg:pr-14 xl:pr-20">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            aria-label={`${siteConfig.name} home`}
            className="text-ink"
          >
            <Logo className="h-10 lg:h-11" />
          </Link>
          <button
            type="button"
            onClick={onLookupAnother}
            className="inline-flex min-h-10 cursor-pointer items-center text-sm font-medium text-brass-ink underline-offset-4 hover:underline"
          >
            Look up another order
          </button>
        </div>

        <p className="text-sm text-taupe">
          Order <span className="font-sans tabular-nums text-ink">#{order.orderNumber}</span>
        </p>
        <h1 className="mt-2 text-display-md text-ink">
          {order.headline}
          {name ? (
            <span className="font-normal text-taupe">
              , {name.split(" ")[0]}
            </span>
          ) : null}
        </h1>
        <p className="mt-3 max-w-lg text-body text-taupe">
          {order.subcopy}
        </p>

        {order.status !== "cancelled" && order.status !== "delivered" ? (
          <div className="mt-5 rounded-xl border border-hairline bg-canvas-deep px-4 py-3">
            <p className="text-eyebrow text-taupe">
              Estimated delivery
            </p>
            <p className="mt-1 text-base font-semibold text-ink">
              {etaLabel}
            </p>
            {order.shippingMethod?.title ? (
              <p className="mt-0.5 text-caption text-taupe">
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
          <h2 className="mb-3 font-sans text-lg font-semibold text-ink">
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
          <section className="mt-4 rounded-xl border border-hairline p-4">
            <h2 className="text-sm font-semibold text-ink">
              Tracking details
            </h2>
            <dl className="mt-3 grid gap-2 text-[0.8125rem] sm:grid-cols-2">
              {order.carrier ? (
                <div>
                  <dt className="text-taupe">Carrier</dt>
                  <dd className="font-medium text-ink">{order.carrier}</dd>
                </div>
              ) : null}
              {order.trackingNumber ? (
                <div>
                  <dt className="text-taupe">Tracking number</dt>
                  <dd className="font-sans tabular-nums font-medium text-ink">
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
                className="mt-3 inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-label text-paper transition-colors hover:bg-brass hover:text-ink"
              >
                Track shipment
              </a>
            ) : null}
          </section>
        ) : null}

        <section className="mt-6 rounded-xl border border-hairline p-5">
          <h2 className="mb-4 font-sans text-lg font-semibold text-ink">
            Order updates
          </h2>
          <Timeline steps={order.timeline} />
        </section>

        <section className="mt-4 rounded-xl border border-hairline p-5">
          <h2 className="font-sans text-lg font-semibold text-ink">
            Customer information
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-sans text-eyebrow text-taupe">
                Contact
              </h3>
              <p className="mt-1.5 text-sm text-ink">{order.email}</p>
              {(order.phone || addr.phone) && (
                <p className="font-sans text-sm tabular-nums text-taupe">
                  {formatPkMobile(order.phone || addr.phone)}
                </p>
              )}
            </div>
            <div>
              <h3 className="font-sans text-eyebrow text-taupe">
                Payment
              </h3>
              <p className="mt-1.5 text-sm text-ink">
                {paymentLabels[order.paymentMethod || ""] ||
                  order.paymentMethod ||
                  "Not specified"}
              </p>
              <p className="text-sm text-taupe">
                <PayableAmount amountPkr={order.totalPkr} />
              </p>
            </div>
            <div>
              <h3 className="font-sans text-eyebrow text-taupe">
                Shipping address
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-taupe">
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
              <h3 className="font-sans text-eyebrow text-taupe">
                Shipping method
              </h3>
              <p className="mt-1.5 text-sm text-ink">
                {order.shippingMethod?.title || "Standard"}
              </p>
              {order.shippingMethod?.description ? (
                <p className="text-[0.8125rem] text-taupe">
                  {order.shippingMethod.description}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-6">
          <p className="text-sm text-taupe">
            Need help?{" "}
            <ContactLinks
              orderNumber={order.orderNumber}
              className="inline-flex min-h-11 items-center font-semibold text-brass-ink underline-offset-4 hover:underline"
            />
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            {order.invoiceUrl ? (
              <Button
                href={order.invoiceUrl}
                download={`${order.orderNumber}-invoice.pdf`}
                variant="secondary"
              >
                Download invoice
              </Button>
            ) : null}
            <Button href="/products">Continue shopping</Button>
          </div>
        </div>
      </div>

      {/* Order summary sidebar */}
      <aside className="border-t border-hairline bg-canvas-deep lg:border-l lg:border-t-0">
        <div className="px-5 py-8 sm:px-8 lg:sticky lg:top-0 lg:py-12 lg:pl-14 lg:pr-[var(--gutter)] xl:pl-20">
          <h2 className="mb-5 font-sans text-lg font-semibold text-ink">
            Order summary
          </h2>
          <ul className="space-y-4">
            {order.lines.map((line) => (
              <li key={line.sku} className="flex gap-3.5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-hairline bg-paper">
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
                  <p className="font-sans text-base font-semibold text-ink">
                    {lineDisplayName(line.name)}
                  </p>
                  <p className="font-sans text-sm tabular-nums text-taupe">
                    Qty {line.quantity}
                    {line.sizeMl ? ` · ${line.sizeMl} ml` : ""}
                  </p>
                  {giftLineLabel(line) ? (
                    <p className="mt-1 text-sm font-medium text-brass-ink">
                      {giftLineLabel(line)}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 font-sans tabular-nums text-base font-medium text-ink">
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
            {order.codFeePkr ? (
              <div className="flex justify-between">
                <span>Cash on delivery fee</span>
                <span className="text-ink">{format(order.codFeePkr)}</span>
              </div>
            ) : null}
            {order.taxPkr ? (
              <div className="flex justify-between">
                <span>{order.taxLabel || "Tax"}</span>
                <span className="text-ink">{format(order.taxPkr)}</span>
              </div>
            ) : null}
            {order.taxIncludedPkr ? (
              <p className="text-right text-caption">
                Includes {order.taxLabel || "tax"} of {format(order.taxIncludedPkr)}
              </p>
            ) : null}
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-4">
            <span className="font-sans text-base font-semibold text-ink">Total</span>
            <PayableAmount
              amountPkr={order.totalPkr}
              variant="stacked"
              className="items-end text-right font-sans tabular-nums text-2xl font-medium tracking-tight text-ink"
            />
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
  const [notFound, setNotFound] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [autoTried, setAutoTried] = useState(false);

  const lookup = useCallback(async (on: string, em: string) => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: on, email: em }),
      });
      const json = await res.json();
      if (!json.ok) {
        setOrder(null);
        if (res.status === 404) {
          setNotFound(true);
          setError("We could not find an order with that number and email. Check both and try again.");
        } else {
          setError(json.error || "Could not find that order.");
        }
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
    <div
      className={cn(
        "min-h-dvh bg-canvas text-base text-ink",
        order &&
          "lg:bg-[linear-gradient(90deg,var(--color-canvas)_50%,var(--color-canvas-deep)_50%)]",
      )}
    >
      {order ? (
        <OrderStatusView
          order={order}
          onLookupAnother={() => {
            setOrder(null);
            setError(null);
            setNotFound(false);
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
            notFound={notFound}
            onSubmit={() => lookup(orderNumber, email)}
          />
        </div>
      )}
    </div>
  );
}
