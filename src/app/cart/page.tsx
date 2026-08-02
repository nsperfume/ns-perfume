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

export default function CartPage() {
  const { lines, removeItem, updateQuantity, subtotal } = useCart();
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

  return (
    <>
      <PageHero
        title={pageCopy.cart.title}
        description={pageCopy.cart.description}
        image={siteImages.cart}
        alt="NS Perfume bottles styled for reviewing your bag"
        objectPosition="center 48%"
      />

      <section className="bg-canvas section-y">
        <div className="container-ns">
          {lines.length === 0 ? (
            <div className="mx-auto flex max-w-lg flex-col items-start gap-6 border border-hairline bg-paper px-8 py-12 sm:px-12">
              <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                Empty Bag
              </p>
              <p className="font-serif text-body-lg text-ink/80">
                {pageCopy.cartEmpty}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button href="/products">Shop All Bottles</Button>
                <Button href="/find-your-scent" variant="secondary">
                  Find Your Scent
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_24rem]">
              <div>
                <div className="mb-8 flex items-end justify-between gap-4 border-b border-hairline pb-5">
                  <div>
                    <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                      Line Items
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-medium text-ink">
                      {count} Piece{count === 1 ? "" : "s"}
                    </h2>
                  </div>
                  <Link
                    href="/products"
                    className="font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
                  >
                    Continue Shopping
                  </Link>
                </div>

                <ul ref={listRef} className="flex flex-col gap-0">
                  {lines.map((line) => (
                    <li
                      key={line.sku}
                      data-line
                      className="grid grid-cols-[6.5rem_1fr] gap-5 border-b border-hairline py-7 sm:grid-cols-[8rem_1fr_auto] sm:gap-8"
                    >
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
                          sizes="128px"
                          className="object-contain p-3"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-col justify-between gap-4">
                        <div>
                          <Link
                            href={`/products/${line.productHandle}`}
                            className="font-display text-xl font-medium text-ink transition-colors hover:text-brass"
                          >
                            {line.name}
                          </Link>
                          <p className="mt-1 font-mono text-[12px] text-taupe">
                            {line.sizeMl > 0
                              ? `${formatSize(line.sizeMl)} · `
                              : ""}
                            {line.sku}
                          </p>
                          {line.isGift ? (
                            <p className="mt-1 font-display text-[10px] uppercase tracking-[0.12em] text-brass">
                              Gift{line.giftWrap ? " · Wrap included" : ""}
                            </p>
                          ) : null}
                          {line.giftMessage ? (
                            <p className="mt-1 max-w-md font-serif text-[0.9rem] italic text-taupe">
                              “{line.giftMessage}”
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="inline-flex items-center border border-hairline">
                            <button
                              type="button"
                              className="min-h-10 min-w-10 cursor-pointer text-sm transition-colors hover:bg-muted"
                              onClick={() =>
                                updateQuantity(line.sku, line.quantity - 1)
                              }
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="min-w-8 text-center font-mono text-sm">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              className="min-h-10 min-w-10 cursor-pointer text-sm transition-colors hover:bg-muted"
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

                      <div className="col-span-2 flex justify-end sm:col-span-1 sm:block sm:text-right">
                        <Price
                          amountPkr={line.price * line.quantity}
                          className="text-lg sm:text-xl"
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="h-fit border border-hairline bg-[#FAF8F4] p-6 sm:p-8 lg:sticky lg:top-[calc(var(--chrome-height)+1.5rem)]">
                <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                  Order Summary
                </p>
                <div className="mt-6 space-y-3 border-b border-hairline pb-6">
                  <div className="flex justify-between font-serif text-[1.05rem]">
                    <span className="text-taupe">Subtotal</span>
                    <Price amountPkr={subtotal} />
                  </div>
                  <div className="flex justify-between font-serif text-[1.05rem]">
                    <span className="text-taupe">Shipping</span>
                    <span className="text-ink/80">Calculated at checkout</span>
                  </div>
                </div>
                <div className="mt-6 flex items-end justify-between gap-3">
                  <span className="font-display text-[12px] uppercase tracking-[0.12em] text-ink">
                    Total
                  </span>
                  <Price amountPkr={subtotal} className="text-2xl" />
                </div>
                <Button className="mt-8 w-full" disabled>
                  Checkout (Coming Soon)
                </Button>
                <p className="mt-4 text-center font-serif text-sm text-taupe">
                  Complimentary shipping on larger orders. Calculated at checkout.
                </p>
                <Button
                  href="/products"
                  variant="ghost"
                  className="mt-2 w-full text-ink"
                >
                  Continue Shopping
                </Button>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
