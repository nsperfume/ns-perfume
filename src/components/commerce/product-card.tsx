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
  const price = product.prices[0]?.price ?? 0;
  const badge = product.badges[0];
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
      <div className="relative mb-3 aspect-square w-full overflow-hidden bg-muted sm:mb-3.5 sm:aspect-4/5">
        <Image
          src={product.imagePrimary}
          alt={`NS Perfume ${product.name} bottle`}
          fill
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          quality={80}
          className="object-cover object-center transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 28vw"
        />
        <Image
          src={product.imageSecondary}
          alt=""
          fill
          loading="lazy"
          quality={80}
          className="object-cover object-center scale-105 opacity-0 transition-[opacity,transform] duration-700 ease-out will-change-transform group-hover:scale-105 group-hover:opacity-100"
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 28vw"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/5"
          aria-hidden
        />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            {badge ? (
              <p
                className={cn(
                  "mb-1 font-display text-[10px] font-medium uppercase tracking-[0.14em]",
                  badge === "sale" || badge === "limited"
                    ? "text-rosewood"
                    : "text-taupe",
                )}
              >
                {badgeLabel(badge)}
              </p>
            ) : (
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-taupe">
                <span className="capitalize">{product.family}</span>
              </p>
            )}
            <h3 className="font-display text-[1.05rem] font-medium leading-snug tracking-tight text-ink transition-colors duration-300 group-hover:text-brass sm:text-[1.125rem]">
              {product.name}
            </h3>
          </div>
          <Price
            amountPkr={price}
            className="shrink-0 text-[0.95rem] font-medium tabular-nums sm:pt-0.5 sm:text-[1rem]"
          />
        </div>

        {showDescriptor ? (
          <p className="mt-1.5 line-clamp-2 font-serif text-[0.9rem] leading-snug text-taupe">
            {product.descriptor}
          </p>
        ) : (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-taupe/80">
            {product.concentration}
            {product.prices[0]?.ml ? ` · ${product.prices[0].ml}ml` : ""}
          </p>
        )}

        {showMeter ? (
          <p className="mt-2 font-mono text-[10px] tabular-nums tracking-wide text-taupe">
            Sillage {sillage}/5 · Longevity {longevity}/5
          </p>
        ) : null}
      </div>
    </Link>
  );
}
