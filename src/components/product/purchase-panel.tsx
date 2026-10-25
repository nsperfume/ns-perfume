"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { animate } from "@/lib/animate";
import { SizeSelector } from "@/components/commerce/size-selector";
import { Button } from "@/components/ui/button";
import { TrustedHtml as RichHtml } from "@/components/ui/trusted-html";
import { StickyAddToCart } from "@/components/product/sticky-atc";
import { Price } from "@/components/commerce/price";
import { StarRating } from "@/components/ui/star-rating";
import { useCart } from "@/context/cart";
import { useWishlist } from "@/context/wishlist";
import { useUi } from "@/context/ui";
import { siteConfig } from "@/data/site";
import type { StoreProduct } from "@/lib/mappers";
import { GIFT_WRAP_FEE_PKR } from "@/lib/types";
import { htmlToPlain as richTextToPlain } from "@/lib/plain-text";

function pressFeedback(e: MouseEvent<HTMLElement>) {
  animate(e.currentTarget, [{ transform: "scale(0.97)" }, { transform: "scale(1)" }], { duration: 320 });
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
      // Remember the exact size so the wishlist can move this bottle to the bag later.
      sku: selected?.sku,
      sizeMl: selected?.ml,
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

  const badgeText = product.badges
    .map((b) =>
      b === "bestseller"
        ? "Bestseller"
        : b === "new"
          ? "New"
          : b === "limited"
            ? "Limited"
            : "Sale",
    )
    .join(" · ");

  const serviceLink =
    "inline-flex min-h-11 items-center gap-3 text-label text-ink transition-colors hover:text-brass-ink";

  return (
    <div className="flex flex-col">
      <p className="text-eyebrow text-brass-ink">
        {[badgeText, product.concentration, product.family]
          .filter(Boolean)
          .join(" · ")}
      </p>

      <h1 className="mt-3 text-display-lg text-ink">{product.name}</h1>

      {product.reviewCount > 0 ? (
        <Link
          href="#reviews"
          className="mt-4 inline-flex min-h-8 items-center gap-2.5 self-start transition-opacity hover:opacity-80"
        >
          <StarRating rating={product.rating} size="sm" />
          <span className="text-caption text-taupe underline decoration-hairline underline-offset-4">
            {product.reviewCount} review{product.reviewCount === 1 ? "" : "s"}
          </span>
        </Link>
      ) : (
        <Link
          href="#write-review"
          className="mt-4 inline-flex min-h-8 items-center self-start text-caption text-taupe underline decoration-hairline underline-offset-4 hover:text-ink"
        >
          Be the first to review
        </Link>
      )}

      <p className="mt-5 max-w-[34rem] text-pretty text-body-lg text-ink/80">
        {product.descriptor}
      </p>

      <div className="mt-6 flex items-baseline gap-3">
        <Price
          amountPkr={unitPrice}
          className="text-2xl text-ink"
        />
        {selected?.ml ? (
          <span className="font-mono text-sm text-taupe">
            {selected.ml} ml
          </span>
        ) : null}
      </div>
      {isGift && giftWrap ? (
        <p className="mt-1 text-caption text-taupe">Includes gift wrap</p>
      ) : null}
      {!product.inStock ? (
        <p className="mt-2 text-body-sm font-medium text-rosewood">
          Currently out of stock.
        </p>
      ) : null}

      <div className="mt-7 border-t border-hairline pt-6">
        <p className="mb-3 text-eyebrow text-ink">Size</p>
        <SizeSelector sizes={sizes} value={sizeMl} onChange={setSizeMl} />
      </div>

      <div className="mt-6">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={isGift}
            onChange={(e) => setIsGift(e.target.checked)}
            className="h-4 w-4 shrink-0 accent-ink"
          />
          <span className="text-body-sm font-medium text-ink">
            This is a gift
          </span>
        </label>
        {isGift ? (
          <div className="mt-2 space-y-4 border border-hairline bg-canvas-deep/40 p-4">
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={(e) => setGiftWrap(e.target.checked)}
                className="h-4 w-4 shrink-0 accent-ink"
              />
              <span className="text-body-sm text-ink">
                Gift wrap{" "}
                <Price
                  amountPkr={GIFT_WRAP_FEE_PKR}
                  className="inline text-sm text-taupe"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-2 block text-eyebrow text-ink">
                Gift message (optional)
              </span>
              <textarea
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value.slice(0, 120))}
                rows={2}
                maxLength={120}
                placeholder="Up to 120 characters"
                className="w-full resize-none rounded-xs border border-hairline bg-paper px-4 py-3 text-base text-ink outline-none placeholder:text-taupe/70 focus:border-brass focus:ring-2 focus:ring-brass/25"
              />
            </label>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex items-stretch gap-2">
        <div
          className="inline-flex h-12 shrink-0 items-stretch rounded-xs border border-ink/70"
          role="group"
          aria-label="Quantity"
        >
          <button
            type="button"
            className="flex w-11 cursor-pointer items-center justify-center text-lg transition-colors hover:bg-muted"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span
            className="flex min-w-10 items-center justify-center font-mono text-base tabular-nums"
            aria-live="polite"
          >
            {qty}
          </span>
          <button
            type="button"
            className="flex w-11 cursor-pointer items-center justify-center text-lg transition-colors hover:bg-muted"
            onClick={() => setQty((q) => Math.min(6, q + 1))}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <Button
          className="min-w-0 flex-1 sm:w-auto! sm:flex-1"
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
          className="w-12! max-w-12! shrink-0 p-0! active:scale-100! [&>span:last-child]:gap-0! [&>span:last-child]:px-0! [&>span:last-child]:tracking-normal!"
        >
          <WishlistHeart filled={saved} />
        </Button>
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

      <ul className="mt-6 grid gap-x-6 border-y border-hairline py-3 sm:grid-cols-2">
        <li>
          <a href={`tel:${phoneTel}`} className={serviceLink}>
            <LineIcon name="phone" className="h-5 w-5 shrink-0" />
            <span>
              Order by phone{" "}
              <span className="font-mono tracking-normal">{siteConfig.phone}</span>
            </span>
          </a>
        </li>
        <li>
          <a
            href={siteConfig.location.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={serviceLink}
          >
            <LineIcon name="pin" className="h-5 w-5 shrink-0" />
            Find us: {siteConfig.location.label}
          </a>
        </li>
        <li>
          <Link href="/contact" className={serviceLink}>
            <LineIcon name="chat" className="h-5 w-5 shrink-0" />
            Contact care
          </Link>
        </li>
        <li>
          <Link href="/track-order" className={serviceLink}>
            <LineIcon name="truck" className="h-5 w-5 shrink-0" />
            Track an order
          </Link>
        </li>
      </ul>

      {hasDescription ? (
        <div className="mt-8">
          <p className="text-eyebrow text-ink">Product description</p>
          <RichHtml
            html={product.description}
            className="mt-3 max-w-[38rem] text-body text-ink/80 [&_li]:my-1 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
          />
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={shareProduct}
          className="inline-flex min-h-11 cursor-pointer items-center text-label text-ink transition-colors hover:text-brass-ink"
        >
          Share
        </button>
        <span className="hidden h-4 w-px bg-hairline sm:block" aria-hidden />
        <p className="font-mono text-xs text-taupe">
          Ref. {selected?.sku || product.handle}
        </p>
      </div>
    </div>
  );
}
