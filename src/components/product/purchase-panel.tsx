"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import gsap from "gsap";
import { SizeSelector } from "@/components/commerce/size-selector";
import { Button } from "@/components/ui/button";
import { RichHtml } from "@/components/ui/rich-html";
import { StickyAddToCart } from "@/components/product/sticky-atc";
import { Price } from "@/components/commerce/price";
import { StarRating } from "@/components/ui/star-rating";
import { useCart } from "@/context/cart";
import { useWishlist } from "@/context/wishlist";
import { useUi } from "@/context/ui";
import { siteConfig } from "@/data/site";
import type { StoreProduct } from "@/lib/mappers";
import { GIFT_WRAP_FEE_PKR } from "@/lib/types";
import { cn } from "@/lib/cn";
import { richTextToPlain } from "@/lib/rich-text";

function pressFeedback(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.fromTo(
    el,
    { scale: 0.97 },
    { scale: 1, duration: 0.32, ease: "power2.out", clearProps: "transform" },
  );
}

/** Crisp lucide-style heart. Hard-coded red so Button hover text color cannot wash it out. */
function WishlistHeart({ filled }: { filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={22}
      height={22}
      className="block h-[22px] w-[22px] shrink-0"
      aria-hidden
      fill={filled ? "#c62828" : "none"}
      stroke="#c62828"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function LineIcon({
  name,
  className,
}: {
  name: "phone" | "pin" | "chat" | "truck";
  className?: string;
}) {
  const paths: Record<typeof name, string> = {
    phone:
      "M6.5 4.5h2.2l1.1 3.2-1.4 1.4a12 12 0 0 0 5.5 5.5l1.4-1.4 3.2 1.1v2.2a1.5 1.5 0 0 1-1.6 1.5A14.5 14.5 0 0 1 5 6.1a1.5 1.5 0 0 1 1.5-1.6z",
    pin: "M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10zm0-8.2a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z",
    chat: "M5 6.5h14v9H12l-4 3v-3H5v-9zm3.5 3h7M8.5 12.5h4.5",
    truck:
      "M3 7.5h11v8H3v-8zm11 2h3.2L20 13v2.5h-1.2a1.8 1.8 0 1 1-3.5 0H9.5a1.8 1.8 0 1 1-3.5 0H4.5",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={paths[name]} />
    </svg>
  );
}

/**
 * Buy column: details scroll above, purchase rail sticks to the bottom.
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
  const phoneTel = siteConfig.phone.replace(/\s/g, "");

  const unitPrice =
    (selected?.price ?? 0) + (isGift && giftWrap ? GIFT_WRAP_FEE_PKR : 0);

  const descriptionPlain = richTextToPlain(product.description || "").trim();
  const hasDescription = Boolean(descriptionPlain);

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

  function toggleWishlist() {
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
  }

  async function shareProduct() {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `${siteConfig.url}/products/${product.handle}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast("Link copied", "info");
    } catch {
      /* ignore cancel */
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1">
        {product.badges.length ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {product.badges.map((b) => (
              <span
                key={b}
                className="font-display text-[10px] font-medium uppercase tracking-[0.16em] text-taupe"
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

        <h1 className="font-display text-[1.65rem] font-medium uppercase leading-[1.15] tracking-[0.04em] text-ink sm:text-[1.85rem]">
          {product.name}
        </h1>

        <p className="mt-5 max-w-md text-pretty font-serif text-[1.05rem] leading-relaxed text-ink/80">
          {product.descriptor}
        </p>

        {product.reviewCount > 0 ? (
          <Link
            href="#reviews"
            className="mt-4 inline-flex items-center gap-2 self-start transition-opacity hover:opacity-80"
          >
            <StarRating rating={product.rating} size="sm" />
            <span className="font-display text-[11px] uppercase tracking-[0.12em] text-taupe">
              {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
            </span>
          </Link>
        ) : null}

        {hasDescription ? (
          <div className="mt-8">
            <p className="font-display text-[12px] font-medium uppercase tracking-[0.14em] text-ink">
              Product description
            </p>
            <RichHtml
              html={product.description}
              className="mt-3 max-w-md font-serif text-[1rem] leading-relaxed text-ink/80 [&_li]:my-1 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
            />
            {!product.inStock ? (
              <p className="mt-3 font-serif text-sm italic text-rosewood">
                Currently out of stock.
              </p>
            ) : null}
          </div>
        ) : !product.inStock ? (
          <p className="mt-6 font-serif text-sm italic text-rosewood">
            Currently out of stock.
          </p>
        ) : null}

        <div className="mt-8">
          <p className="mb-3 font-display text-[12px] font-medium uppercase tracking-[0.14em] text-ink">
            Size
          </p>
          <SizeSelector sizes={sizes} value={sizeMl} onChange={setSizeMl} />
        </div>

        <div className="mt-5">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={isGift}
              onChange={(e) => setIsGift(e.target.checked)}
              className="h-3.5 w-3.5 shrink-0 accent-ink"
            />
            <span className="font-display text-[11px] font-medium uppercase tracking-[0.12em] text-ink">
              This is a gift
            </span>
          </label>
          {isGift ? (
            <div className="mt-3 space-y-3 border border-hairline bg-canvas-deep/40 p-3">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  className="h-3.5 w-3.5 shrink-0 accent-ink"
                />
                <span className="font-serif text-[0.95rem] text-ink">
                  Gift wrap{" "}
                  <Price
                    amountPkr={GIFT_WRAP_FEE_PKR}
                    className="inline text-[0.95rem] text-taupe"
                  />
                </span>
              </label>
              <textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value.slice(0, 120))}
                rows={2}
                placeholder="Optional gift message"
                className="w-full resize-none border border-hairline bg-paper px-3 py-2 font-serif text-[0.95rem] text-ink outline-none placeholder:text-taupe/60 focus:border-ink/40"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/*
        Sits at the bottom of the stretched buy column (mt-auto) and sticks
        to the viewport bottom while the gallery scrolls.
      */}
      <div
        className={cn(
          "sticky bottom-0 z-20 mt-auto",
          "border-t border-hairline bg-canvas/95 py-4 backdrop-blur-sm",
          "supports-[backdrop-filter]:bg-canvas/90",
        )}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Price
              amountPkr={unitPrice}
              className="text-[1.35rem] font-medium text-ink"
            />
            {isGift && giftWrap ? (
              <p className="mt-0.5 font-serif text-sm text-taupe">
                Includes gift wrap
              </p>
            ) : null}
          </div>
          <div>
            <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
              Quantity
            </p>
            <div className="inline-flex h-11 items-stretch border border-ink/80">
              <button
                type="button"
                className="flex w-11 cursor-pointer items-center justify-center text-sm transition-colors hover:bg-muted"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="flex min-w-11 items-center justify-center border-x border-ink/80 font-mono text-sm tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                className="flex w-11 cursor-pointer items-center justify-center text-sm transition-colors hover:bg-muted"
                onClick={() => setQty((q) => Math.min(6, q + 1))}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-stretch gap-2">
          <Button
            className="!h-12 min-h-12 flex-1 !rounded-none sm:!w-auto sm:flex-1"
            disabled={!product.inStock}
            onClick={addToBag}
          >
            {product.inStock ? "Add to bag" : "Out of stock"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={toggleWishlist}
            aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={saved}
            className="!h-12 !min-h-12 !w-12 !max-w-12 shrink-0 !rounded-none !p-0 active:!scale-100 [&>span:last-child]:!gap-0 [&>span:last-child]:!px-0 [&>span:last-child]:!tracking-normal"
          >
            <WishlistHeart filled={saved} />
          </Button>
        </div>
      </div>

      <ul className="mt-8 space-y-3.5">
        <li>
          <a
            href={`tel:${phoneTel}`}
            className="inline-flex items-center gap-3 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:text-brass"
          >
            <LineIcon name="phone" className="h-4 w-4" />
            Order by phone {siteConfig.phone}
          </a>
        </li>
        <li>
          <a
            href={siteConfig.location.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:text-brass"
          >
            <LineIcon name="pin" className="h-4 w-4" />
            Find us · {siteConfig.location.label}
          </a>
        </li>
        <li>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:text-brass"
          >
            <LineIcon name="chat" className="h-4 w-4" />
            Contact care
          </Link>
        </li>
        <li>
          <Link
            href="/track-order"
            className="inline-flex items-center gap-3 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:text-brass"
          >
            <LineIcon name="truck" className="h-4 w-4" />
            Track an order
          </Link>
        </li>
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline pt-5">
        <button
          type="button"
          onClick={shareProduct}
          className="cursor-pointer font-display text-[11px] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:text-brass"
        >
          Share
        </button>
        <span className="hidden h-3 w-px bg-hairline sm:block" aria-hidden />
        <p className="font-mono text-[11px] tabular-nums text-taupe">
          Ref. {selected?.sku || product.handle}
        </p>
      </div>

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
