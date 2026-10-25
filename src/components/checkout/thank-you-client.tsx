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
import { TransferDetails } from "@/components/commerce/transfer-details";
import { PayableAmount } from "@/components/commerce/price";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/data/site";
import { Button } from "@/components/ui/button";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";

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
      <BrandLoaderBlock className="min-h-dvh bg-canvas" label="Loading your order" />
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <p className="text-display-sm text-ink">No recent order to show</p>
        <Link href="/products" className="font-sans text-sm text-brass-ink hover:underline">
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
    <div className="min-h-dvh bg-canvas text-base text-ink lg:bg-[linear-gradient(90deg,var(--color-canvas)_50%,var(--color-canvas-deep)_50%)]">
      <div className="mx-auto grid min-h-dvh max-w-[1240px] lg:grid-cols-2 2xl:max-w-[1360px]">
        <div className="order-2 bg-canvas px-5 py-10 sm:px-8 lg:order-1 lg:py-12 lg:pl-[var(--gutter)] lg:pr-14 xl:pr-20">
          <Link
            href="/"
            aria-label={`${siteConfig.name} home`}
            className="inline-block text-ink"
          >
            <Logo className="h-7 sm:h-8 lg:h-9" />
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
              <p className="text-sm text-taupe">
                Order{" "}
                <span className="font-mono font-medium text-ink">
                  {order.orderNumber}
                </span>
              </p>
              <h1 className="mt-1 text-display-md text-ink">
                Thank you, {order.customerName.split(" ")[0] || "there"}
              </h1>
            </div>
          </div>

          <section className="mt-8 rounded-xs border border-hairline p-5 sm:p-6">
            <h2 className="text-heading-sm">What happens next</h2>
            <p className="mt-2 text-body-sm text-taupe">
              {order.confirmationEmail ? (
                <>
                  A confirmation is on its way to{" "}
                  <span className="font-medium text-ink">{order.email}</span>.{" "}
                </>
              ) : null}
              Our team will confirm the details with you by phone or WhatsApp
              {order.phone ? (
                <>
                  {" "}
                  on <span className="font-medium text-ink">{order.phone}</span>
                </>
              ) : null}{" "}
              before dispatch. Track status anytime with your order number and
              the email you used at checkout.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Button
                href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.email)}`}
                variant="secondary"
                size="sm"
              >
                Track your order
              </Button>
              {order.invoiceUrl ? (
                <Button
                  href={order.invoiceUrl}
                  download={`${order.orderNumber}-invoice.pdf`}
                  variant="ghost"
                  className="px-1"
                >
                  Download invoice (PDF)
                </Button>
              ) : null}
            </div>
          </section>

          {order.paymentMethod === "cod" ? (
            <section className="mt-4 rounded-xs border border-hairline bg-canvas-deep p-5 sm:p-6">
              <h2 className="text-heading-sm">Cash on delivery</h2>
              <p className="mt-2 text-body-sm text-taupe">
                Pay{" "}
                <PayableAmount
                  amountPkr={order.totalPkr}
                  className="font-medium text-ink"
                />{" "}
                in cash to the courier. Keep exact change if you can. We may call
                the phone on your order before delivery.
              </p>
            </section>
          ) : null}

          {order.paymentMethod === "bank" ? (
            <section className="mt-4 rounded-xs border border-hairline bg-canvas-deep p-5 sm:p-6">
              <h2 className="text-heading-sm">
                Payment next steps
              </h2>
              <p className="mt-2 text-body-sm text-taupe">
                Transfer{" "}
                <PayableAmount
                  amountPkr={order.totalPkr}
                  className="font-medium text-ink"
                />{" "}
                by bank, JazzCash, or Easypaisa. Use order number{" "}
                <span className="font-mono font-medium text-ink">
                  {order.orderNumber}
                </span>{" "}
                as the reference.
              </p>
              <div className="mt-4">
                <TransferDetails />
              </div>
              <p className="mt-3 text-caption text-taupe">
                {siteConfig.bankTransfer.note}
              </p>
            </section>
          ) : null}

          <section className="mt-4 rounded-xs border border-hairline p-5 sm:p-6">
            <h2 className="text-heading-sm">Order details</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="font-sans text-eyebrow text-taupe">
                  Contact information
                </h3>
                <p className="mt-2 text-sm">{order.email}</p>
                {order.phone ? (
                  <p className="text-sm text-taupe">{order.phone}</p>
                ) : null}
              </div>
              <div>
                <h3 className="font-sans text-eyebrow text-taupe">
                  Payment method
                </h3>
                <p className="mt-2 text-sm">
                  {paymentLabels[order.paymentMethod]}
                </p>
              </div>
              <div>
                <h3 className="font-sans text-eyebrow text-taupe">
                  Shipping address
                </h3>
                <p className="mt-2 text-sm text-taupe">
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
                <h3 className="font-sans text-eyebrow text-taupe">
                  Shipping method
                </h3>
                <p className="mt-2 text-sm">{order.shippingMethodTitle}</p>
              </div>
            </div>
          </section>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-taupe">
              Need help?{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="font-semibold text-brass-ink underline-offset-4 hover:underline"
              >
                Contact us
              </a>
            </p>
            <Button href="/products">Continue shopping</Button>
          </div>
        </div>

        <aside className="order-1 border-b border-hairline bg-canvas-deep lg:order-2 lg:border-b-0 lg:border-l">
          <div className="px-5 py-8 sm:px-8 lg:sticky lg:top-0 lg:py-12 lg:pl-14 lg:pr-[var(--gutter)] xl:pl-20">
            <ul className="space-y-5">
              {order.lines.map((line) => (
                <li key={line.sku} className="flex gap-3.5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xs border border-hairline bg-paper">
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
                    <p className="text-base font-semibold leading-snug text-ink">
                      {line.name}
                      {line.isGift ? " (Gift)" : ""}
                    </p>
                    <p className="mt-0.5 text-sm text-taupe">
                      Qty {line.quantity}
                      {line.sizeMl > 0
                        ? ` · ${`${line.sizeMl} ml`}`
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
                  <p className="shrink-0 font-mono text-base font-medium tabular-nums text-ink">
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
            <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-4">
              <span className="font-sans text-base font-semibold text-ink">Total</span>
              <PayableAmount
                amountPkr={order.totalPkr}
                variant="stacked"
                className="items-end text-right font-mono text-2xl font-medium tracking-tight text-ink"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
