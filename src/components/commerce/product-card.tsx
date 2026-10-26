import Image from "next/image";
import Link from "next/link";
import { Price } from "@/components/commerce/price";
import type { StoreProduct } from "@/lib/mappers";
import { cn } from "@/lib/cn";

function badgeLabel(badge: string) {
  if (badge === "bestseller") return "Bestseller";
  if (badge === "new") return "New";
  if (badge === "limited") return "Limited";
  if (badge === "sale") return "Sale";
  return badge;
}

/**
 * Frameless product tile (no ring, border, or card chrome).
 * Image sits on a quiet wash; type stays tight below.
 */
export function ProductCard({
  product,
  showMeter = false,
  showDescriptor = false,
  className,
  priority = false,
}: {
  product: StoreProduct;
  showMeter?: boolean;
  showDescriptor?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const sizes = product.prices.filter((p) => p.price > 0);
  const price = sizes.length ? Math.min(...sizes.map((p) => p.price)) : 0;
  const badge = product.badges[0];
  const wearer =
    product.gender === "him" ? "Men" : product.gender === "her" ? "Women" : "Unisex";
  const sillage = Math.min(5, Math.max(1, Math.round(product.sillage)));
  const longevity = Math.min(5, Math.max(1, Math.round(product.longevity)));

  return (
    <Link
      href={`/products/${product.handle}`}
      className={cn(
        "group flex h-full flex-col outline-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass/60",
        className,
      )}
    >
      <div className="relative mb-4 aspect-4/5 w-full overflow-hidden bg-muted">
        <Image
          src={product.imagePrimary}
          alt={`NS Perfume ${product.name} bottle`}
          fill
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          quality={80}
          className="object-cover object-center transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 34vw, 25vw"
        />
        <Image
          src={product.imageSecondary}
          alt=""
          fill
          loading="lazy"
          quality={80}
          className="object-cover object-center scale-105 opacity-0 transition-[opacity,transform] duration-700 ease-out will-change-transform group-hover:scale-105 group-hover:opacity-100"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 34vw, 25vw"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/5"
          aria-hidden
        />
      </div>

      <div className="flex flex-1 flex-col">
        <p
          className={cn(
            "text-eyebrow",
            !product.inStock || badge === "sale" || badge === "limited"
              ? "text-rosewood"
              : badge
                ? "text-brass-ink"
                : "text-taupe",
          )}
        >
          {!product.inStock ? "Sold out" : badge ? badgeLabel(badge) : product.family}
        </p>
        <h3 className="mt-1.5 text-display-sm text-ink transition-colors duration-300 group-hover:text-brass-ink">
          {product.name}
        </h3>
        {showDescriptor ? (
          <p className="mt-1.5 line-clamp-2 text-body-sm text-taupe">
            {product.descriptor}
          </p>
        ) : null}
        <div className="mt-auto flex flex-col gap-1 pt-3 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-3">
          <span className="inline-flex items-baseline gap-1.5">
            {sizes.length > 1 ? <span className="text-caption text-taupe">From</span> : null}
            <Price amountPkr={price} className="text-ink" />
          </span>
          <span className="font-sans tabular-nums text-xs text-taupe">
            {product.concentration} · {wearer}
            {sizes.length === 1 ? ` · ${sizes[0]!.ml} ml` : ""}
          </span>
        </div>
        {showMeter ? (
          <p className="mt-2 text-caption text-taupe">
            Projection {sillage}/5 · Longevity {longevity}/5
          </p>
        ) : null}
      </div>
    </Link>
  );
}
