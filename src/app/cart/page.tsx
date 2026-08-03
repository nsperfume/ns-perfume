"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useCart } from "@/context/cart";
import { formatSize } from "@/lib/format";
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
              <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                Empty bag
              </p>
              <p className="font-serif text-body-lg text-ink/80">
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
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-16 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div>
                <div className="mb-8 flex items-end justify-between gap-4 border-b border-hairline pb-5">
                  <div>
                    <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                      Line items
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-medium text-ink">
                      {count} piece{count === 1 ? "" : "s"}
                    </h2>
                  </div>
                  <Link
                    href="/products"
                    className="font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
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
                      <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:gap-6">
                        <Link
                          href={`/products/${line.productHandle}`}
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
                                className="font-display text-[1.15rem] font-medium leading-snug text-ink transition-colors hover:text-brass sm:text-xl"
                              >
                                {line.name}
                                {line.isGift ? " (Gift)" : ""}
                              </Link>
                              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-taupe">
                                {line.sizeMl > 0 ? formatSize(line.sizeMl) : null}
                                {line.sizeMl > 0 ? " · " : null}
                                {line.sku}
                              </p>
                            </div>
                            <Price
                              amountPkr={line.price * line.quantity}
                              className="shrink-0 text-[1rem] font-medium tabular-nums sm:hidden"
                            />
                          </div>

                          {line.isGift || line.giftMessage ? (
                            <div className="mt-3 space-y-1.5 border-l-2 border-brass/40 pl-3">
                              {line.isGift ? (
                                <p className="font-display text-[10px] uppercase tracking-[0.12em] text-brass">
                                  Gift
                                  {line.giftWrap ? " · Wrap included" : ""}
                                </p>
                              ) : null}
                              {line.giftMessage ? (
                                <p className="font-serif text-[0.95rem] leading-snug text-ink/80">
                                  <span className="text-taupe">Note: </span>
                                  {line.giftMessage}
                                </p>
                              ) : null}
                            </div>
                          ) : null}

                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div
                              className="inline-flex h-9 items-stretch border border-hairline"
                              role="group"
                              aria-label={`Quantity for ${line.name}`}
                            >
                              <button
                                type="button"
                                className="flex w-9 cursor-pointer items-center justify-center text-sm transition-colors hover:bg-muted"
                                onClick={() =>
                                  updateQuantity(line.sku, line.quantity - 1)
                                }
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>
                              <span className="flex min-w-9 items-center justify-center border-x border-hairline font-mono text-[13px] tabular-nums">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                className="flex w-9 cursor-pointer items-center justify-center text-sm transition-colors hover:bg-muted"
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
                              className="cursor-pointer font-display text-[11px] uppercase tracking-[0.12em] text-taupe transition-colors hover:text-ink"
                              onClick={() => removeItem(line.sku)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="hidden text-right sm:block">
                          <Price
                            amountPkr={line.price * line.quantity}
                            className="text-[1.05rem] font-medium tabular-nums"
                          />
                          {line.quantity > 1 ? (
                            <p className="mt-1 font-mono text-[11px] text-taupe">
                              {format(line.price)} each
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="lg:sticky lg:top-[calc(var(--chrome-height)+1.25rem)]">
                <div className="border border-hairline bg-muted/40 p-6 sm:p-7">
                  <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                    Order summary
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-baseline justify-between gap-4 font-serif text-[1.05rem]">
                      <span className="text-taupe">
                        Subtotal · {count} item{count === 1 ? "" : "s"}
                      </span>
                      <Price
                        amountPkr={subtotal}
                        className="font-medium tabular-nums text-ink"
                      />
                    </div>
                    <div className="flex items-baseline justify-between gap-4 font-serif text-[1.05rem]">
                      <span className="text-taupe">Shipping</span>
                      <span className="text-right text-[0.95rem] text-ink/70">
                        Calculated at checkout
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-hairline pt-5">
                    <div className="flex items-end justify-between gap-3">
                      <span className="font-display text-[12px] uppercase tracking-[0.12em] text-ink">
                        Estimated total
                      </span>
                      <Price
                        amountPkr={subtotal}
                        className="text-[1.5rem] font-medium tabular-nums"
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
                    <p className="font-serif text-[0.85rem] leading-snug text-taupe">
                      {freeShipGap > 0
                        ? `Add ${format(freeShipGap)} more for complimentary shipping.`
                        : "This order qualifies for complimentary shipping."}
                    </p>
                  </div>

                  <Button href="/checkout" className="mt-6 w-full sm:w-full">
                    Check out
                  </Button>
                  <Link
                    href="/products"
                    className="mt-4 block text-center font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
                  >
                    Continue shopping
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
