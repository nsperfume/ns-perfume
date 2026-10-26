"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { animate } from "@/lib/animate";
import { useCart } from "@/context/cart";
import { Price } from "@/components/commerce/price";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/context/currency";
import { useCheckoutConfig } from "@/context/checkout-config";
import { freeShippingGap } from "@/lib/checkout-config";
import { giftLineLabel } from "@/lib/checkout";

export default function CartPage() {
  const { lines, removeItem, updateQuantity, subtotal } = useCart();
  const { format } = useCurrency();
  const listRef = useRef<HTMLUListElement>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);
  /** The summary's own Check out button or the site footer is on screen. */
  const [ctaInView, setCtaInView] = useState(false);
  const [footerInView, setFooterInView] = useState(false);

  useEffect(() => {
    if (!listRef.current || !lines.length) return;
    listRef.current.querySelectorAll("[data-line]").forEach((line, i) => {
      animate(line, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], {
        duration: 400,
        delay: i * 60,
      });
    });
  }, [lines.length]);

  const hasLines = lines.length > 0;

  // Hide the sticky phone bar while the summary button or the footer is visible.
  useEffect(() => {
    if (!hasLines) return;
    const cta = checkoutRef.current;
    const footer =
      document.getElementById("site-footer") ?? document.querySelector("footer");
    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === cta) setCtaInView(entry.isIntersecting);
        else setFooterInView(entry.isIntersecting);
      }
    });
    if (cta) obs.observe(cta);
    if (footer) obs.observe(footer);
    return () => obs.disconnect();
  }, [hasLines]);

  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const checkoutConfig = useCheckoutConfig();
  // null when the free-shipping offer is switched off in admin.
  const freeShipGap = freeShippingGap(checkoutConfig, subtotal);
  const freeShipProgress =
    freeShipGap === null
      ? 100
      : Math.min(100, Math.round((subtotal / checkoutConfig.freeShippingThresholdPkr) * 100));

  return (
    <>
      <section className="border-b border-hairline bg-canvas pb-16 pt-8 sm:pt-10 lg:pb-24 lg:pt-12">
        <div className="container-ns">
          {!hasLines ? (
            <div className="mx-auto flex max-w-lg flex-col items-start gap-6 py-10 sm:py-16">
              <h1 className="text-display-md text-ink">Your cart is empty</h1>
              <Button href="/collections/bestsellers">Shop bestsellers</Button>
            </div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-16 xl:grid-cols-[minmax(0,1fr)_25rem] 2xl:gap-24">
              <div>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-hairline pb-5">
                  <h1 className="text-display-md text-ink">
                    Your cart <span className="font-sans tabular-nums">({count})</span>
                  </h1>
                  <Link
                    href="/products"
                    className="inline-flex min-h-11 items-center text-label text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-brass"
                  >
                    Continue shopping
                  </Link>
                </div>

                <ul ref={listRef} className="flex flex-col">
                  {lines.map((line) => {
                    const gift = giftLineLabel(line);
                    return (
                      <li
                        key={line.sku}
                        data-line
                        className="border-b border-hairline py-7 first:pt-0"
                      >
                        <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-5 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:gap-7">
                          <Link
                            href={`/products/${line.productHandle}`}
                            aria-label={`View ${line.name}`}
                            className="relative aspect-square overflow-hidden rounded-xl bg-muted"
                          >
                            <Image
                              src={line.image}
                              alt=""
                              fill
                              loading="lazy"
                              quality={75}
                              sizes="112px"
                              className="object-contain p-2.5"
                            />
                          </Link>

                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-3 sm:block">
                              <div className="min-w-0">
                                <Link
                                  href={`/products/${line.productHandle}`}
                                  className="text-display-sm text-ink transition-colors hover:text-brass-ink"
                                >
                                  {line.name}
                                </Link>
                                {line.sizeMl > 0 ? (
                                  <p className="mt-1.5 font-sans tabular-nums text-xs text-taupe">
                                    {line.sizeMl} ml
                                  </p>
                                ) : null}
                              </div>
                              <Price
                                amountPkr={line.price * line.quantity}
                                className="shrink-0 sm:hidden"
                              />
                            </div>

                            {gift || line.giftMessage ? (
                              <div className="mt-3 space-y-1.5 border-l-2 border-brass/40 pl-3">
                                {gift ? (
                                  <p className="text-body-sm font-medium text-brass-ink">{gift}</p>
                                ) : null}
                                {line.giftMessage ? (
                                  <p className="text-body-sm leading-snug text-ink/80">
                                    <span className="text-taupe">Gift note: </span>
                                    {line.giftMessage}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}

                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                              <div
                                className="inline-flex h-11 items-stretch rounded-xl border border-[#d6cfbf]"
                                role="group"
                                aria-label={`Quantity for ${line.name}`}
                              >
                                <button
                                  type="button"
                                  className="flex w-11 cursor-pointer items-center justify-center text-base transition-colors hover:bg-muted"
                                  onClick={() =>
                                    updateQuantity(line.sku, line.quantity - 1)
                                  }
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </button>
                                <span className="flex min-w-10 items-center justify-center font-sans tabular-nums text-sm ">
                                  {line.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="flex w-11 cursor-pointer items-center justify-center text-base transition-colors hover:bg-muted"
                                  onClick={() =>
                                    updateQuantity(line.sku, line.quantity + 1)
                                  }
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                className="inline-flex min-h-11 cursor-pointer items-center text-caption text-taupe underline decoration-hairline underline-offset-4 transition-colors hover:text-ink"
                                onClick={() => removeItem(line.sku)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <div className="hidden text-right sm:block">
                            <Price
                              amountPkr={line.price * line.quantity}
                              className="text-lg"
                            />
                            {line.quantity > 1 ? (
                              <p className="mt-1 font-sans tabular-nums text-xs text-taupe">
                                {format(line.price)} each
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <aside
                aria-labelledby="cart-summary"
                className="lg:sticky lg:top-[calc(var(--spacing-chrome-height)+1.25rem)]"
              >
                <div className="rounded-2xl border border-hairline bg-muted/40 p-6 sm:p-8">
                  <h2 id="cart-summary" className="text-eyebrow text-taupe">
                    Order summary
                  </h2>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-baseline justify-between gap-4 text-body">
                      <span className="text-taupe">
                        Subtotal · <span className="font-sans tabular-nums">{count}</span> item
                        {count === 1 ? "" : "s"}
                      </span>
                      <Price
                        amountPkr={subtotal}
                        className="text-ink"
                      />
                    </div>
                    <div className="flex items-baseline justify-between gap-4 text-body">
                      <span className="text-taupe">Shipping</span>
                      <span className="text-right text-body-sm text-ink/75">
                        {freeShipGap === 0 ? "Free standard shipping" : "Calculated at checkout"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-hairline pt-5">
                    <div className="flex items-end justify-between gap-3">
                      <span className="text-eyebrow text-ink">
                        Estimated total
                      </span>
                      <Price
                        amountPkr={subtotal}
                        className="text-2xl"
                      />
                    </div>
                  </div>

                  {freeShipGap !== null ? (
                    <div className="mt-5 space-y-2">
                      <div className="h-1 overflow-hidden bg-hairline">
                        <div
                          className="h-full bg-brass transition-[width] duration-500"
                          style={{ width: `${freeShipProgress}%` }}
                        />
                      </div>
                      <p className="text-caption text-taupe">
                        {freeShipGap > 0 ? (
                          <>
                            Add{" "}
                            <span className="whitespace-nowrap font-sans tabular-nums text-ink">
                              {format(freeShipGap)}
                            </span>{" "}
                            more for free standard shipping.
                          </>
                        ) : (
                          "This order qualifies for free standard shipping."
                        )}
                      </p>
                    </div>
                  ) : null}

                  <div ref={checkoutRef}>
                    <Button href="/checkout" className="mt-6 w-full sm:w-full">
                      Check out
                    </Button>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      {hasLines ? (
        // Sticky phone bar. The summary sits below the lines on phones, so the bar
        // steps aside once that button or the footer scrolls into view.
        <div
          className={
            ctaInView || footerInView
              ? "hidden"
              : "fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
          }
        >
          <Button href="/checkout" className="w-full sm:w-full">
            Check out
            <span aria-hidden> · </span>
            <span className="sr-only">, </span>
            <span className="font-sans tabular-nums">{format(subtotal)}</span>
          </Button>
        </div>
      ) : null}
    </>
  );
}
