"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { animate } from "@/lib/animate";
import { SizeSelector } from "@/components/commerce/size-selector";
import { PerformanceMini } from "@/components/commerce/performance-meter";
import { DeliveryEstimate } from "@/components/product/delivery-estimate";
import {
  BanknoteIcon,
  CircleCheckIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  TruckIcon,
  XIcon,
} from "@/components/ui/icons";
import { useCheckoutConfig } from "@/context/checkout-config";
import { Button } from "@/components/ui/button";
import { StickyAddToCart } from "@/components/product/sticky-atc";
import { Price } from "@/components/commerce/price";
import { StarRating } from "@/components/ui/star-rating";
import { useCart } from "@/context/cart";
import { useCurrency } from "@/context/currency";
import { useWishlist } from "@/context/wishlist";
import { useUi } from "@/context/ui";
import { siteConfig } from "@/data/site";
import type { StoreProduct } from "@/lib/mappers";
import { BrandIcon } from "@/components/ui/brand-icon";
import { whatsappUrl } from "@/lib/whatsapp";

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

/**
 * Buy box: identity, decision support (notes, performance, sizes with prices,
 * stock and delivery), purchase controls, one trust row, then service links.
 */
export function ProductPurchasePanel({ product }: { product: StoreProduct }) {
  const { addItem } = useCart();
  const { isSaved, toggleItem } = useWishlist();
  const { showToast } = useUi();
  const { format } = useCurrency();
  const sizes = product.prices.map((p) => p.ml);
  const [sizeMl, setSizeMl] = useState(product.prices[0]?.ml ?? 50);
  const [qty, setQty] = useState(1);
  const [isGift, setIsGift] = useState(false);
  const [giftWrapPicked, setGiftWrap] = useState(false);
  const config = useCheckoutConfig();
  const wrapFee = config.giftWrap.feePkr;
  // Gift wrap only counts while the owner offers it.
  const giftWrap = config.giftWrap.enabled && giftWrapPicked;
  const [giftMessage, setGiftMessage] = useState("");
  const selected =
    product.prices.find((p) => p.ml === sizeMl) ?? product.prices[0];
  const saved = isSaved(product.handle);
  const phoneTel = siteConfig.phone.replace(/\s/g, "");

  const unitPrice =
    (selected?.price ?? 0) + (isGift && giftWrap ? wrapFee : 0);

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
        price: selected.price + (wrap ? wrapFee : 0),
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
    "inline-flex min-h-10 items-center gap-2.5 text-caption font-semibold text-ink transition-colors hover:text-brass-ink";

  // One note per tier, without repeats when a note is listed in more than one tier.
  const keyNotes = [
    ...new Set(
      [product.topNotes[0], product.heartNotes[0], product.baseNotes[0]]
        .map((n) => n?.trim())
        .filter((n): n is string => Boolean(n)),
    ),
  ];

  const sizeOptions = product.prices.map((p) => ({ ml: p.ml, price: p.price }));

  return (
    <div className="flex flex-col">
      <p className="text-eyebrow text-brass-ink">
        {[badgeText, product.concentration, product.family]
          .filter(Boolean)
          .join(" · ")}
      </p>

      <h1 className="mt-3 text-display-lg text-ink">{product.name}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
        {product.reviewCount > 0 ? (
          <Link
            href="#reviews"
            className="inline-flex min-h-8 items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <StarRating rating={product.rating} size="sm" />
            <span className="text-caption text-taupe underline decoration-hairline underline-offset-4">
              {product.rating.toFixed(1)} · {product.reviewCount} review
              {product.reviewCount === 1 ? "" : "s"}
            </span>
          </Link>
        ) : (
          <Link
            href="#write-review"
            className="inline-flex min-h-8 items-center text-caption text-taupe underline decoration-hairline underline-offset-4 hover:text-ink"
          >
            Be the first to review
          </Link>
        )}
      </div>

      <p className="mt-4 max-w-[34rem] text-pretty text-body-lg text-ink/80">
        {product.descriptor}
      </p>

      {keyNotes.length ? (
        <Link
          href="#notes"
          className="group mt-4 flex flex-wrap items-center gap-2 self-start"
          aria-label={`Key notes: ${keyNotes.join(", ")}. See all notes`}
        >
          {keyNotes.map((note) => (
            <span
              key={note}
              className="inline-flex min-h-8 items-center rounded-full border border-[#e2d6bd] bg-canvas-deep/50 px-3 text-caption text-ink transition-colors group-hover:border-brass"
            >
              {note}
            </span>
          ))}
          <span className="text-caption text-taupe underline decoration-hairline underline-offset-4 group-hover:text-ink">
            All notes
          </span>
        </Link>
      ) : null}

      <PerformanceMini
        sillage={product.sillage}
        longevity={product.longevity}
        className="mt-4"
      />

      <div className="mt-6 flex items-baseline gap-3 border-t border-hairline pt-5">
        <Price amountPkr={unitPrice} className="text-2xl text-ink" />
        {selected?.ml ? (
          <span className="font-mono text-sm text-taupe">{selected.ml} ml</span>
        ) : null}
        {isGift && giftWrap ? (
          <span className="text-caption text-taupe">incl. gift wrap</span>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="mb-1 text-eyebrow text-ink">Size</p>
        <SizeSelector
          sizes={sizes}
          prices={sizeOptions}
          value={sizeMl}
          onChange={setSizeMl}
        />
      </div>

      <ul className="mt-5 space-y-1.5 text-body-sm">
        {product.inStock ? (
          <li className="flex items-start gap-2.5 text-ink">
            <CircleCheckIcon size={18} className="mt-0.5 shrink-0 text-brass-ink" />
            In stock, ships in 1 to 2 business days
          </li>
        ) : (
          <li className="flex items-start gap-2.5 font-medium text-rosewood">
            <XIcon size={18} className="mt-0.5 shrink-0" />
            Out of stock. Message us on WhatsApp to hear when it is back.
          </li>
        )}
        {product.inStock ? (
          <li className="flex items-start gap-2.5 text-taupe">
            <TruckIcon size={18} className="mt-0.5 shrink-0 text-brass-ink" />
            <DeliveryEstimate />
          </li>
        ) : null}
      </ul>

      <div className="mt-4">
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
            {config.giftWrap.enabled ? (
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={giftWrapPicked}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-ink"
                />
                <span className="text-body-sm text-ink">
                  Gift wrap
                  {wrapFee > 0 ? (
                    <>
                      {" "}
                      <Price
                        amountPkr={wrapFee}
                        className="inline text-sm text-taupe"
                      />
                    </>
                  ) : (
                    " (free)"
                  )}
                </span>
              </label>
            ) : null}
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

      <div className="mt-3 flex items-stretch gap-2">
        <div
          className="inline-flex h-12 shrink-0 items-stretch rounded-xs border border-ink/70"
          role="group"
          aria-label="Quantity"
        >
          <button
            type="button"
            className="flex w-11 cursor-pointer items-center justify-center text-lg transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={!product.inStock}
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
            className="flex w-11 cursor-pointer items-center justify-center text-lg transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => setQty((q) => Math.min(6, q + 1))}
            disabled={!product.inStock}
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

      <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xs bg-canvas-deep/60 px-4 py-3 text-caption text-ink">
        <li className="inline-flex items-center gap-2">
          <BanknoteIcon size={18} className="shrink-0 text-brass-ink" />
          Cash on delivery
        </li>
        {config.freeShippingThresholdPkr > 0 ? (
          <li className="inline-flex items-center gap-2">
            <TruckIcon size={18} className="shrink-0 text-brass-ink" />
            Free delivery over {format(config.freeShippingThresholdPkr)}
          </li>
        ) : null}
        <li className="inline-flex items-center gap-2">
          <ShieldCheckIcon size={18} className="shrink-0 text-brass-ink" />
          100% authentic
        </li>
      </ul>

      <ul className="mt-4 grid grid-cols-2 gap-x-4 border-b border-hairline pb-3">
        <li>
          <a
            href={whatsappUrl(
              siteConfig.phone,
              `Hi NS Perfume, I would like to order ${product.name}${selected ? ` ${selected.ml} ml` : ""}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={serviceLink}
          >
            <BrandIcon name="whatsapp" size={18} />
            Order on WhatsApp
          </a>
        </li>
        <li>
          <a href={`tel:${phoneTel}`} className={serviceLink}>
            <PhoneIcon size={18} className="shrink-0" />
            <span>
              Call <span className="font-mono font-normal">{siteConfig.phone}</span>
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
            <MapPinIcon size={18} className="shrink-0" />
            Find us: {siteConfig.location.label}
          </a>
        </li>
        <li>
          <Link href="/track-order" className={serviceLink}>
            <TruckIcon size={18} className="shrink-0" />
            Track an order
          </Link>
        </li>
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <button
          type="button"
          onClick={shareProduct}
          className="inline-flex min-h-10 cursor-pointer items-center text-caption font-semibold text-ink underline decoration-hairline underline-offset-4 transition-colors hover:text-brass-ink"
        >
          Share
        </button>
        <p className="font-mono text-xs text-taupe">
          Ref. {selected?.sku || product.handle}
        </p>
      </div>
    </div>
  );
}
