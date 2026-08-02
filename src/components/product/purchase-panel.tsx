"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import gsap from "gsap";
import { SizeSelector } from "@/components/commerce/size-selector";
import { PerformanceMeter } from "@/components/commerce/performance-meter";
import { Button } from "@/components/ui/button";
import { StickyAddToCart } from "@/components/product/sticky-atc";
import { Price } from "@/components/commerce/price";
import { useCart } from "@/context/cart";
import { useWishlist } from "@/context/wishlist";
import { useUi } from "@/context/ui";
import type { StoreProduct } from "@/lib/mappers";
import { GIFT_WRAP_FEE_PKR } from "@/lib/types";
import { cn } from "@/lib/cn";

function pressFeedback(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.fromTo(
    el,
    { scale: 0.97 },
    { scale: 1, duration: 0.32, ease: "power2.out", clearProps: "transform" },
  );
}

/**
 * Gift logic:
 * - "This is a gift" marks the line for checkout notes (ribbon / no price slip).
 * - Optional gift wrap adds a fixed PKR fee and a distinct SKU suffix so gift
 *   and non-gift lines do not merge incorrectly in the bag.
 * - Optional message (max 120 chars) is stored on the cart line.
 */
export function ProductPurchasePanel({ product }: { product: StoreProduct }) {
  const { addItem } = useCart();
  const { isSaved, toggleItem } = useWishlist();
  const { showToast } = useUi();
  const sizes = product.prices.map((p) => p.ml);
  const [sizeMl, setSizeMl] = useState(product.prices[0]?.ml ?? 50);
  const [qty, setQty] = useState(1);
  const [isGift, setIsGift] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const selected =
    product.prices.find((p) => p.ml === sizeMl) ?? product.prices[0];
  const saved = isSaved(product.handle);

  const unitPrice =
    (selected?.price ?? 0) + (isGift && giftWrap ? GIFT_WRAP_FEE_PKR : 0);

  useEffect(() => {
    try {
      const key = "ns-recently-viewed";
      const prev = JSON.parse(localStorage.getItem(key) || "[]") as string[];
      const next = [
        product.handle,
        ...prev.filter((h) => h !== product.handle),
      ].slice(0, 8);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [product.handle]);

  useEffect(() => {
    if (!isGift) {
      setGiftWrap(false);
      setGiftMessage("");
    }
  }, [isGift]);

  function addToBag(e?: MouseEvent<HTMLElement>) {
    if (!selected || !product.inStock) return;
    if (e) pressFeedback(e);

    const wrap = isGift && giftWrap;
    const message = isGift ? giftMessage.trim().slice(0, 120) : "";
    const sku = wrap ? `${selected.sku}-GIFT` : selected.sku;

    addItem(
      {
        productHandle: product.handle,
        name: wrap ? `${product.name} (Gift Wrap)` : product.name,
        sizeMl: selected.ml,
        price: selected.price + (wrap ? GIFT_WRAP_FEE_PKR : 0),
        sku,
        image: product.imagePrimary,
        isGift: isGift || undefined,
        giftMessage: message || undefined,
        giftWrap: wrap || undefined,
      },
      qty,
    );
    showToast(
      isGift
        ? `${product.name} added as a gift`
        : `${product.name} added to your bag`,
      "cart",
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        {product.badges.length ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {product.badges.map((b) => (
              <span
                key={b}
                className="rounded-xs bg-ink px-2 py-1 font-display text-[10px] uppercase tracking-[0.12em] text-paper"
              >
                {b === "bestseller"
                  ? "Bestseller"
                  : b === "new"
                    ? "New"
                    : b === "limited"
                      ? "Limited"
                      : "Sale"}
              </span>
            ))}
          </div>
        ) : null}
        <h1 className="text-display-lg">{product.name}</h1>
        <p className="mt-3 text-body-lg text-taupe">{product.descriptor}</p>
        <p className="mt-2 font-mono text-[12px] uppercase tracking-[0.12em] text-taupe">
          {product.concentration}
          {" · "}
          <span className="capitalize">{product.family}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Price amountPkr={unitPrice} className="text-2xl" />
          {isGift && giftWrap ? (
            <p className="mt-1 font-serif text-sm text-taupe">
              Includes gift wrap (+
              <Price amountPkr={GIFT_WRAP_FEE_PKR} className="inline text-sm" />)
            </p>
          ) : null}
        </div>
        {product.reviewCount > 0 ? (
          <Link
            href="#reviews"
            className="font-serif text-[0.95rem] text-taupe underline-offset-4 hover:text-ink hover:underline"
          >
            <span className="font-mono text-brass">
              {product.rating.toFixed(1)}
            </span>
            {" · "}
            {product.reviewCount} reviews
          </Link>
        ) : null}
      </div>

      <div>
        <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
          Size
        </p>
        <SizeSelector sizes={sizes} value={sizeMl} onChange={setSizeMl} />
      </div>

      <div>
        <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
          Quantity
        </p>
        <div className="inline-flex items-center border border-hairline">
          <button
            type="button"
            className="min-h-11 min-w-11 cursor-pointer text-sm transition-colors hover:bg-muted"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="min-w-10 text-center font-mono text-sm">{qty}</span>
          <button
            type="button"
            className="min-h-11 min-w-11 cursor-pointer text-sm transition-colors hover:bg-muted"
            onClick={() => setQty((q) => Math.min(6, q + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <PerformanceMeter sillage={product.sillage} longevity={product.longevity} />

      {/* Gift options */}
      <div className="border border-hairline bg-[#FAF8F4] p-4 sm:p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={isGift}
            onChange={(e) => setIsGift(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-ink"
          />
          <span>
            <span className="block font-display text-[0.95rem] font-medium text-ink">
              This Is A Gift
            </span>
            <span className="mt-0.5 block font-serif text-[0.95rem] text-taupe">
              We can pack it for gifting and skip a price slip in the box.
            </span>
          </span>
        </label>

        {isGift ? (
          <div className="mt-4 space-y-4 border-t border-hairline pt-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={(e) => setGiftWrap(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-ink"
              />
              <span>
                <span className="block font-display text-[0.95rem] font-medium text-ink">
                  Add Gift Wrap
                </span>
                <span className="mt-0.5 block font-serif text-[0.95rem] text-taupe">
                  Tissue and ribbon finish.{" "}
                  <Price
                    amountPkr={GIFT_WRAP_FEE_PKR}
                    className="inline text-[0.95rem]"
                  />
                </span>
              </span>
            </label>

            <div>
              <label
                htmlFor="gift-message"
                className="mb-1.5 block font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe"
              >
                Gift Message (Optional)
              </label>
              <textarea
                id="gift-message"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value.slice(0, 120))}
                rows={3}
                placeholder="A short note for the recipient…"
                className="w-full resize-none rounded-md border border-hairline bg-paper px-3 py-2.5 font-serif text-[1rem] text-ink outline-none placeholder:text-taupe/60 focus:border-ink/40"
              />
              <p className="mt-1 text-right font-mono text-[11px] text-taupe">
                {giftMessage.length}/120
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          className="w-full sm:w-auto"
          disabled={!product.inStock}
          onClick={addToBag}
        >
          {product.inStock ? "Add To Bag" : "Out Of Stock"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={(e) => {
            pressFeedback(e);
            const nextSaved = !saved;
            toggleItem({
              productHandle: product.handle,
              name: product.name,
              image: product.imagePrimary,
              pricePkr: selected?.price ?? product.prices[0]?.price ?? 0,
            });
            showToast(
              nextSaved
                ? `${product.name} saved to wishlist`
                : `${product.name} removed from wishlist`,
              "wishlist",
            );
          }}
        >
          {saved ? "In Wishlist" : "Add To Wishlist"}
        </Button>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          "Cash on delivery",
          "Free ship Rs 8,000+",
          "Easy returns",
          "Authenticity checked",
        ].map((label) => (
          <li
            key={label}
            className={cn(
              "border border-hairline bg-paper px-2.5 py-2.5 text-center font-serif text-[0.8rem] font-medium leading-snug text-ink/80 sm:text-[0.85rem]",
            )}
          >
            {label}
          </li>
        ))}
      </ul>

      <StickyAddToCart
        product={product}
        sizeMl={selected?.ml ?? sizeMl}
        price={unitPrice}
        sku={
          isGift && giftWrap && selected
            ? `${selected.sku}-GIFT`
            : (selected?.sku ?? "")
        }
        quantity={qty}
        isGift={isGift}
        giftWrap={isGift && giftWrap}
        giftMessage={isGift ? giftMessage : ""}
        onAdd={addToBag}
      />
    </div>
  );
}
