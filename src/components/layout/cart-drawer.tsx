"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useCart } from "@/context/cart";
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
      className="fixed inset-0 z-80 flex justify-end opacity-0"
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
        className="relative flex h-full w-full max-w-[28rem] flex-col bg-paper shadow-modal 2xl:max-w-[30rem]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-hairline px-5 py-3 sm:px-7">
          <h2 className="flex items-center gap-3 text-display-sm text-ink">
            Your Bag
            {itemCount > 0 ? (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-ink px-1.5 font-mono text-xs font-medium text-paper">
                {itemCount}
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xs text-taupe transition-colors hover:bg-muted hover:text-ink"
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
            <div className="flex flex-1 flex-col px-5 pt-8 pb-4 sm:px-7">
              <p className="text-eyebrow text-taupe">
                Empty
              </p>
              <p className="mt-3 max-w-[34ch] text-body-lg text-ink/85">
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
              <div className="mt-auto border-t border-hairline pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <Link
                  href="/wishlist"
                  onClick={closeCart}
                  className="inline-flex min-h-11 items-center text-label text-ink underline decoration-ink/25 underline-offset-[6px] hover:decoration-brass"
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
                  className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 px-5 py-5 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-5 sm:px-7"
                >
                  <Link
                    href={`/products/${line.productHandle}`}
                    onClick={closeCart}
                    aria-label={`View ${line.name}`}
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
                          className="line-clamp-2 text-base font-semibold leading-snug text-ink transition-colors hover:text-brass-ink"
                        >
                          {line.name}
                          {line.isGift ? " (Gift)" : ""}
                        </Link>
                        <p className="mt-1 font-mono text-xs text-taupe">
                          {line.sizeMl > 0 ? `${line.sizeMl} ml` : line.sku}
                          {line.giftWrap ? " · Wrap" : ""}
                        </p>
                        {line.giftMessage ? (
                          <p className="mt-1 line-clamp-2 text-caption leading-snug text-taupe">
                            Note: {line.giftMessage}
                          </p>
                        ) : null}
                      </div>
                      <Price
                        amountPkr={line.price * line.quantity}
                        className="shrink-0 text-base"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div
                        className="inline-flex h-10 items-stretch overflow-hidden rounded-xs border border-[#d6cfbf]"
                        role="group"
                        aria-label={`Quantity for ${line.name}`}
                      >
                        <button
                          type="button"
                          className="flex w-10 cursor-pointer items-center justify-center text-base text-ink transition-colors hover:bg-muted"
                          onClick={() =>
                            updateQuantity(line.sku, line.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="flex min-w-9 items-center justify-center font-mono text-sm tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex w-10 cursor-pointer items-center justify-center text-base text-ink transition-colors hover:bg-muted"
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
                        className="inline-flex min-h-10 cursor-pointer items-center text-caption text-taupe underline decoration-hairline underline-offset-4 transition-colors hover:text-ink"
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
          <div className="shrink-0 border-t border-hairline bg-muted/50 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-7">
            <div className="mb-4" aria-label="Free shipping progress">
              <div className="mb-2 flex justify-between gap-2 text-caption text-taupe">
                <span>
                  {freeShipRemaining > 0
                    ? "Toward free shipping"
                    : "Free standard shipping"}
                </span>
                {freeShipRemaining > 0 ? (
                  <Price
                    amountPkr={freeShipRemaining}
                    className="text-sm text-taupe"
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
                <p className="text-eyebrow text-taupe">
                  Subtotal
                </p>
                <p className="mt-0.5 text-caption text-taupe">
                  Shipping at checkout
                </p>
              </div>
              <Price
                amountPkr={subtotal}
                className="text-xl text-ink"
              />
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
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
