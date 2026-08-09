"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CHECKOUT_ORDER_STORAGE_KEY,
  type CompletedOrderSnapshot,
  type PaymentMethodId,
} from "@/lib/checkout";
import { useCurrency } from "@/context/currency";
import { formatSize } from "@/lib/format";
import { TransferDetails } from "@/components/commerce/transfer-details";
import { siteConfig } from "@/data/site";

const paymentLabels: Record<PaymentMethodId, string> = {
  cod: "Cash on delivery (COD)",
  card: "Credit card",
  bank: "Bank transfer or mobile wallet",
};

export function ThankYouClient() {
  const { format } = useCurrency();
  const [order, setOrder] = useState<CompletedOrderSnapshot | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_ORDER_STORAGE_KEY);
      if (raw) setOrder(JSON.parse(raw) as CompletedOrderSnapshot);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas font-serif text-base text-taupe">
        Loading…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center font-serif">
        <p className="font-display text-lg text-ink">No recent order to show</p>
        <Link href="/products" className="font-display text-sm text-brass hover:underline">
          Continue shopping
        </Link>
        <Link href="/track-order" className="text-sm text-taupe hover:underline">
          Track an order
        </Link>
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="min-h-dvh bg-canvas font-serif text-base text-ink ">
      <div className="mx-auto grid min-h-dvh max-w-[1100px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="order-2 px-5 py-10 sm:px-8 lg:order-1 lg:px-12 xl:px-16">
          <Link
            href="/"
            className="inline-block font-display text-2xl font-medium tracking-tight"
          >
            NS Perfume
          </Link>

          <div className="mt-10 flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-brass text-brass"
              aria-hidden
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="font-display text-sm text-taupe">
                Confirmation #{order.orderNumber}
              </p>
              <h1 className="mt-1 font-display text-2xl font-medium leading-snug text-ink sm:text-3xl">
                Thank you, {order.customerName.split(" ")[0] || "there"}
              </h1>
            </div>
          </div>

          <section className="mt-8 rounded-md border border-hairline p-5">
            <h2 className="font-display text-lg font-medium">Your order is confirmed</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-taupe">
              You’ll receive an email at{" "}
              <span className="font-medium text-ink">{order.email}</span> when
              your order is ready. You can also track status anytime with your
              order number and email.
            </p>
            <Link
              href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.email)}`}
              className="mt-3 inline-block text-[14px] text-brass hover:underline"
            >
              Track your order
            </Link>
          </section>

          {order.paymentMethod === "cod" ? (
            <section className="mt-4 rounded-md border border-hairline bg-canvas-deep p-5">
              <h2 className="font-display text-lg font-medium">Cash on delivery</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-taupe">
                Pay{" "}
                <span className="font-medium text-ink">
                  {format(order.totalPkr)}
                </span>{" "}
                in cash to the courier. Keep exact change if you can. We may call
                the phone on your order before delivery.
              </p>
            </section>
          ) : null}

          {order.paymentMethod === "bank" ? (
            <section className="mt-4 rounded-md border border-hairline bg-canvas-deep p-5">
              <h2 className="font-display text-lg font-medium">
                Payment next steps
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-taupe">
                Transfer{" "}
                <span className="font-medium text-ink">
                  {format(order.totalPkr)}
                </span>{" "}
                by bank, JazzCash, or Easypaisa. Use order number{" "}
                <span className="font-mono font-medium text-ink">
                  {order.orderNumber}
                </span>{" "}
                as the reference.
              </p>
              <div className="mt-4">
                <TransferDetails />
              </div>
              <p className="mt-3 text-[13px] text-taupe">
                {siteConfig.bankTransfer.note}
              </p>
            </section>
          ) : null}

          <section className="mt-4 rounded-md border border-hairline p-5">
            <h2 className="font-display text-lg font-medium">Order details</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-taupe">
                  Contact information
                </h3>
                <p className="mt-2 text-[14px]">{order.email}</p>
                {order.phone ? (
                  <p className="text-[14px] text-taupe">{order.phone}</p>
                ) : null}
              </div>
              <div>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-taupe">
                  Payment method
                </h3>
                <p className="mt-2 text-[14px]">
                  {paymentLabels[order.paymentMethod]} · {format(order.totalPkr)}
                </p>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-taupe">
                  Shipping address
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-taupe">
                  {order.customerName}
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
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-taupe">
                  Shipping method
                </h3>
                <p className="mt-2 text-[14px]">{order.shippingMethodTitle}</p>
              </div>
            </div>
          </section>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] text-taupe">
              Need help?{" "}
              <a
                href="mailto:care@nsperfume.com"
                className="text-brass hover:underline"
              >
                Contact us
              </a>
            </p>
            <Link
              href="/products"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-8 font-display text-sm font-medium uppercase tracking-[0.12em] text-paper hover:opacity-90"
            >
              Continue shopping
            </Link>
          </div>
        </div>

        <aside className="order-1 border-b border-hairline bg-canvas-deep lg:order-2 lg:border-b-0 lg:border-l">
          <div className="px-5 py-8 sm:px-8 lg:sticky lg:top-0 lg:px-10 lg:py-10 xl:px-14">
            <ul className="space-y-5">
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
                    <p className="font-display text-base font-medium leading-snug text-ink">
                      {line.name}
                      {line.isGift ? " (Gift)" : ""}
                    </p>
                    <p className="mt-0.5 text-sm text-taupe">
                      Qty {line.quantity}
                      {line.sizeMl > 0
                        ? ` · ${formatSize(line.sizeMl)}`
                        : ` · ${line.sku}`}
                      {line.giftWrap ? " · Gift wrap" : line.isGift ? " · Gift" : ""}
                    </p>
                    {line.giftWrap ? (
                      <p className="mt-1 text-sm text-taupe">
                        Gift wrap included
                      </p>
                    ) : null}
                    {line.giftMessage ? (
                      <p className="mt-1 text-sm leading-snug text-taupe">
                        <span className="text-taupe">Gift note: </span>
                        {line.giftMessage}
                      </p>
                    ) : null}
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
                  <span>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</span>
                  <span className="text-ink">−{format(order.discountPkr)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-ink">
                  {order.shippingPkr === 0 ? "Free" : format(order.shippingPkr)}
                </span>
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
    </div>
  );
}
