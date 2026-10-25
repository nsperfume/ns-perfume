"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useCart } from "@/context/cart";
import { Price } from "@/components/commerce/price";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import { FREE_SHIPPING_THRESHOLD_PKR } from "@/lib/checkout";
import { useCurrency } from "@/context/currency";

export default function CartPage() {
  const { lines, removeItem, updateQuantity, subtotal } = useCart();
  const { format } = useCurrency();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!listRef.current || !lines.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    gsap.fromTo(
      listRef.current.querySelectorAll("[data-line]"),
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power3.out" },
    );
  }, [lines.length]);

  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const freeShipGap = Math.max(0, FREE_SHIPPING_THRESHOLD_PKR - subtotal);
  const freeShipProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD_PKR) * 100),
  );

  return (
    <>
      <PageHero
        title={pageCopy.cart.title}
        description={pageCopy.cart.description}
        image={siteImages.cart}
        alt="NS Perfume bottles styled for reviewing your bag"
        objectPosition="center 48%"
      />

      <section className="border-b border-hairline bg-canvas section-y">
        <div className="container-ns">
          {lines.length === 0 ? (
            <div className="mx-auto flex max-w-lg flex-col items-start gap-6">
              <p className="text-eyebrow text-taupe">
                Empty bag
              </p>
              <p className="text-body-lg text-ink/80">
                {pageCopy.cartEmpty}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button href="/products">Shop all bottles</Button>
                <Button href="/find-your-scent" variant="secondary">
                  Find your scent
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-16 xl:grid-cols-[minmax(0,1fr)_25rem] 2xl:gap-24">
              <div>
                <div className="mb-8 flex flex-col gap-3 border-b border-hairline pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                  <div>
                    <p className="text-eyebrow text-taupe">
                      Line items
                    </p>
                    <h2 className="mt-2 text-display-md text-ink">
                      {count} piece{count === 1 ? "" : "s"}
                    </h2>
                  </div>
                  <Link
                    href="/products"
                    className="inline-flex min-h-11 items-center text-label text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-brass"
                  >
                    Continue shopping
                  </Link>
                </div>

                <ul ref={listRef} className="flex flex-col">
                  {lines.map((line) => (
                    <li
                      key={line.sku}
                      data-line
                      className="border-b border-hairline py-7 first:pt-0"
                    >
                      <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-5 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:gap-7">
                        <Link
                          href={`/products/${line.productHandle}`}
                          aria-label={`View ${line.name}`}
                          className="relative aspect-square overflow-hidden bg-muted"
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
                              <p className="mt-1.5 font-mono text-xs text-taupe">
                                {line.sizeMl > 0 ? `${line.sizeMl} ml` : null}
                                {line.sizeMl > 0 ? " · " : null}
                                {line.sku}
                              </p>
                            </div>
                            <Price
                              amountPkr={line.price * line.quantity}
                              className="shrink-0 text-base sm:hidden"
                            />
                          </div>

                          {line.isGift || line.giftMessage ? (
                            <div className="mt-3 space-y-1.5 border-l-2 border-brass/40 pl-3">
                              {line.isGift ? (
                                <p className="text-eyebrow text-brass-ink">
                                  Gift
                                  {line.giftWrap ? " · Wrap included" : ""}
                                </p>
                              ) : null}
                              {line.giftMessage ? (
                                <p className="text-body-sm leading-snug text-ink/80">
                                  <span className="text-taupe">Note: </span>
                                  {line.giftMessage}
                                </p>
                              ) : null}
                            </div>
                          ) : null}

                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div
                              className="inline-flex h-11 items-stretch rounded-xs border border-[#d6cfbf]"
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
                              <span className="flex min-w-10 items-center justify-center font-mono text-sm tabular-nums">
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
                            <p className="mt-1 font-mono text-xs text-taupe">
                              {format(line.price)} each
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="lg:sticky lg:top-[calc(var(--spacing-chrome-height)+1.25rem)]">
                <div className="border border-hairline bg-muted/40 p-6 sm:p-8">
                  <p className="text-eyebrow text-taupe">
                    Order summary
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-baseline justify-between gap-4 text-body">
                      <span className="text-taupe">
                        Subtotal · {count} item{count === 1 ? "" : "s"}
                      </span>
                      <Price
                        amountPkr={subtotal}
                        className="text-ink"
                      />
                    </div>
                    <div className="flex items-baseline justify-between gap-4 text-body">
                      <span className="text-taupe">Shipping</span>
                      <span className="text-right text-body-sm text-ink/75">
                        Calculated at checkout
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

                  <div className="mt-5 space-y-2">
                    <div className="h-1 overflow-hidden bg-hairline">
                      <div
                        className="h-full bg-brass transition-[width] duration-500"
                        style={{ width: `${freeShipProgress}%` }}
                      />
                    </div>
                    <p className="text-caption text-taupe">
                      {freeShipGap > 0
                        ? `Add ${format(freeShipGap)} more for complimentary shipping.`
                        : "This order qualifies for complimentary shipping."}
                    </p>
                  </div>

                  <Button href="/checkout" className="mt-6 w-full sm:w-full">
                    Check out
                  </Button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
