"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useCart } from "@/context/cart";
import { formatSize } from "@/lib/format";
import { Price } from "@/components/commerce/price";
import { Button } from "@/components/ui/button";
import { pageCopy } from "@/data/copy";
import { FREE_SHIPPING_THRESHOLD_PKR } from "@/lib/checkout";
import { cn } from "@/lib/cn";

export function CartDrawer() {
  const { lines, isOpen, closeCart, removeItem, updateQuantity, subtotal } =
    useCart();
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
  const freeShipRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD_PKR - subtotal);
  const freeShipProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD_PKR) * 100),
  );

  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!mounted) return;
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.killTweensOf([root, panel]);

    if (isOpen) {
      if (reduced) {
        gsap.set(root, { autoAlpha: 1 });
        gsap.set(panel, { x: 0 });
        return;
      }
      gsap.set(root, { autoAlpha: 1 });
      gsap.fromTo(
        panel,
        { x: "100%" },
        { x: "0%", duration: 0.45, ease: "power4.out" },
      );
      gsap.fromTo(
        root.querySelector("[data-cart-scrim]"),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.35, ease: "power2.out" },
      );
      if (listRef.current) {
        const items = listRef.current.querySelectorAll("[data-cart-line]");
        if (items.length) {
          gsap.fromTo(
            items,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.3,
              stagger: 0.04,
              ease: "power3.out",
              delay: 0.1,
            },
          );
        }
      }
    } else {
      if (reduced) {
        gsap.set(root, { autoAlpha: 0 });
        setMounted(false);
        return;
      }
      gsap.to(panel, {
        x: "100%",
        duration: 0.32,
        ease: "power3.in",
      });
      gsap.to(root.querySelector("[data-cart-scrim]"), {
        autoAlpha: 0,
        duration: 0.28,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(root, { autoAlpha: 0 });
          setMounted(false);
        },
      });
    }
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  if (!mounted) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[80] flex justify-end opacity-0"
      role="dialog"
      aria-modal="true"
      aria-label="Your bag"
    >
      <button
        type="button"
        data-cart-scrim
        aria-label="Close cart"
        className="absolute inset-0 cursor-pointer bg-ink/40 backdrop-blur-[2px]"
        onClick={closeCart}
      />
      <aside
        ref={panelRef}
        className="relative flex h-full w-full max-w-[26rem] flex-col bg-paper shadow-modal"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-hairline px-5 py-4 sm:px-6">
          <h2 className="flex items-baseline gap-2.5 font-display text-lg font-medium tracking-tight text-ink">
            Your Bag
            {itemCount > 0 ? (
              <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 font-mono text-[11px] font-medium text-paper">
                {itemCount}
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-9 w-9 cursor-pointer items-center justify-center text-taupe transition-colors hover:bg-muted hover:text-ink"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Lines / empty body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-panel">
          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col px-5 pt-6 pb-4 sm:px-6">
              <p className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                Empty
              </p>
              <p className="mt-3 max-w-none font-serif text-[1.1rem] leading-relaxed text-ink/85">
                {pageCopy.cartEmpty}
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <Button
                  href="/products"
                  className="w-full sm:w-full"
                  onClick={closeCart}
                >
                  Shop all
                </Button>
                <Button
                  href="/collections/bestsellers"
                  variant="secondary"
                  className="w-full sm:w-full"
                  onClick={closeCart}
                >
                  Bestsellers
                </Button>
              </div>
              <div className="mt-auto border-t border-hairline pt-5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <Link
                  href="/wishlist"
                  onClick={closeCart}
                  className="font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
                >
                  View wishlist
                </Link>
              </div>
            </div>
          ) : (
            <ul ref={listRef} className="divide-y divide-hairline">
              {lines.map((line) => (
                <li
                  key={line.sku}
                  data-cart-line
                  className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-3.5 px-5 py-4 sm:grid-cols-[4.75rem_minmax(0,1fr)] sm:gap-4 sm:px-6 sm:py-5"
                >
                  <Link
                    href={`/products/${line.productHandle}`}
                    onClick={closeCart}
                    className="relative aspect-square overflow-hidden bg-muted"
                  >
                    <Image
                      src={line.image}
                      alt=""
                      fill
                      loading="lazy"
                      quality={70}
                      sizes="80px"
                      className="object-contain p-2"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${line.productHandle}`}
                          onClick={closeCart}
                          className="font-display text-[0.95rem] font-medium leading-snug text-ink transition-colors hover:text-brass"
                        >
                          {line.name}
                          {line.isGift ? " (Gift)" : ""}
                        </Link>
                        <p className="mt-0.5 font-mono text-[11px] tracking-wide text-taupe">
                          {line.sizeMl > 0 ? formatSize(line.sizeMl) : line.sku}
                          {line.giftWrap ? " · Wrap" : ""}
                        </p>
                        {line.giftMessage ? (
                          <p className="mt-1 line-clamp-2 font-serif text-[0.8rem] leading-snug text-taupe">
                            Note: {line.giftMessage}
                          </p>
                        ) : null}
                      </div>
                      <Price
                        amountPkr={line.price * line.quantity}
                        className="shrink-0 text-[0.95rem] font-medium tabular-nums"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div
                        className="inline-flex h-8 items-stretch overflow-hidden border border-hairline"
                        role="group"
                        aria-label={`Quantity for ${line.name}`}
                      >
                        <button
                          type="button"
                          className="flex w-8 cursor-pointer items-center justify-center text-sm text-ink transition-colors hover:bg-muted"
                          onClick={() =>
                            updateQuantity(line.sku, line.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="flex min-w-8 items-center justify-center border-x border-hairline font-mono text-[12px] tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex w-8 cursor-pointer items-center justify-center text-sm text-ink transition-colors hover:bg-muted"
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
                        className="cursor-pointer font-display text-[11px] uppercase tracking-[0.1em] text-taupe transition-colors hover:text-ink"
                        onClick={() => removeItem(line.sku)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer (filled bag only) */}
        {lines.length > 0 ? (
          <div className="shrink-0 border-t border-hairline bg-muted/50 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-5">
            <div className="mb-4" aria-label="Free shipping progress">
              <div className="mb-1.5 flex justify-between gap-2 font-serif text-[13px] text-taupe">
                <span>
                  {freeShipRemaining > 0
                    ? "Toward free shipping"
                    : "Free standard shipping"}
                </span>
                {freeShipRemaining > 0 ? (
                  <Price
                    amountPkr={freeShipRemaining}
                    className="text-[13px] text-taupe"
                  />
                ) : null}
              </div>
              <div className="h-1 overflow-hidden bg-hairline">
                <div
                  className={cn(
                    "h-full bg-ink transition-[width] duration-500 ease-out",
                    freeShipRemaining === 0 && "bg-brass",
                  )}
                  style={{ width: `${freeShipProgress}%` }}
                />
              </div>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                  Subtotal
                </p>
                <p className="mt-0.5 font-serif text-[12px] text-taupe">
                  Shipping at checkout
                </p>
              </div>
              <Price
                amountPkr={subtotal}
                className="text-xl font-medium tabular-nums text-ink"
              />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Button
                href="/checkout"
                className="w-full sm:w-full"
                onClick={closeCart}
              >
                Check out
              </Button>
              <Button
                href="/cart"
                variant="secondary"
                className="w-full sm:w-full"
                onClick={closeCart}
              >
                View full bag
              </Button>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
