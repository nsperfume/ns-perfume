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

export function CartDrawer() {
  const { lines, isOpen, closeCart, removeItem, updateQuantity, subtotal } =
    useCart();
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

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
            { opacity: 0, x: 18 },
            {
              opacity: 1,
              x: 0,
              duration: 0.32,
              stagger: 0.045,
              ease: "power3.out",
              delay: 0.12,
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
        className="absolute inset-0 bg-ink/35"
        onClick={closeCart}
      />
      <aside
        ref={panelRef}
        className="relative flex h-full w-full max-w-md flex-col border-l border-hairline bg-paper shadow-modal"
      >
        <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
          <div>
            <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
              Bag
            </p>
            <h2 className="mt-1 font-display text-xl font-medium text-ink">
              Your Bag
              {lines.length > 0 ? (
                <span className="ml-2 font-mono text-sm text-taupe">
                  ({lines.reduce((s, l) => s + l.quantity, 0)})
                </span>
              ) : null}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="min-h-11 cursor-pointer px-2 font-display text-[11px] uppercase tracking-[0.14em] text-taupe transition-colors hover:text-ink"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-panel">
          {lines.length === 0 ? (
            <div className="flex flex-col gap-5 py-8">
              <p className="font-serif text-body text-taupe">{pageCopy.cartEmpty}</p>
              <Button href="/products" onClick={closeCart}>
                Find Your Bottle
              </Button>
            </div>
          ) : (
            <ul ref={listRef} className="flex flex-col gap-5">
              {lines.map((line) => (
                <li
                  key={line.sku}
                  data-cart-line
                  className="flex gap-4 border-b border-hairline pb-5 last:border-0"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-canvas">
                    <Image
                      src={line.image}
                      alt=""
                      fill
                      loading="lazy"
                      quality={70}
                      sizes="96px"
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex justify-between gap-3">
                      <div>
                        <Link
                          href={`/products/${line.productHandle}`}
                          onClick={closeCart}
                          className="font-display text-[1.05rem] font-medium text-ink hover:text-brass"
                        >
                          {line.name}
                        </Link>
                        <p className="font-mono text-[12px] text-taupe">
                          {line.sizeMl > 0 ? `${formatSize(line.sizeMl)} · ` : ""}
                          {line.sku}
                        </p>
                        {line.isGift ? (
                          <p className="mt-1 font-display text-[10px] uppercase tracking-[0.12em] text-brass">
                            Gift
                            {line.giftWrap ? " · Wrap" : ""}
                          </p>
                        ) : null}
                        {line.giftMessage ? (
                          <p className="mt-1 line-clamp-2 font-serif text-[0.85rem] italic text-taupe">
                            “{line.giftMessage}”
                          </p>
                        ) : null}
                      </div>
                      <Price amountPkr={line.price * line.quantity} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="min-h-9 min-w-9 cursor-pointer border border-hairline text-sm transition-colors hover:border-ink"
                        onClick={() => updateQuantity(line.sku, line.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center font-mono text-sm">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="min-h-9 min-w-9 cursor-pointer border border-hairline text-sm transition-colors hover:border-ink"
                        onClick={() => updateQuantity(line.sku, line.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="ml-auto cursor-pointer font-display text-[10px] uppercase tracking-[0.12em] text-taupe hover:text-ink"
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

        {lines.length > 0 ? (
          <div className="border-t border-hairline bg-[#FAF8F4] px-6 py-6">
            <div className="mb-4 flex items-end justify-between gap-3">
              <span className="font-display text-[11px] uppercase tracking-[0.14em] text-taupe">
                Subtotal
              </span>
              <Price amountPkr={subtotal} className="text-xl" />
            </div>
            <Button className="mb-2 w-full" disabled>
              Checkout (Coming Soon)
            </Button>
            <Button
              href="/cart"
              variant="secondary"
              className="w-full"
              onClick={closeCart}
            >
              View Full Bag
            </Button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
