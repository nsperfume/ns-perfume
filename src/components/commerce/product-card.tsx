import Image from "next/image";
import Link from "next/link";
import { PerformanceMeter } from "@/components/commerce/performance-meter";
import { Price } from "@/components/commerce/price";
import type { StoreProduct } from "@/lib/mappers";
import { cn } from "@/lib/cn";

export function ProductCard({
  product,
  showMeter = false,
  className,
}: {
  product: StoreProduct;
  showMeter?: boolean;
  className?: string;
}) {
  const price = product.prices[0]?.price ?? 0;

  return (
    <Link
      href={`/products/${product.handle}`}
      className={cn(
        "group flex h-full flex-col rounded-md border border-transparent bg-paper p-4 transition-colors duration-300 hover:border-hairline sm:p-5",
        className,
      )}
    >
      <div className="relative mb-4 aspect-square w-full overflow-hidden bg-canvas">
        <Image
          src={product.imagePrimary}
          alt={`NS Perfume ${product.name} bottle`}
          fill
          loading="lazy"
          quality={75}
          className="object-contain p-5 transition-opacity duration-500 group-hover:opacity-0"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <Image
          src={product.imageSecondary}
          alt=""
          fill
          loading="lazy"
          quality={75}
          className="object-contain p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          sizes="(max-width: 768px) 50vw, 25vw"
          aria-hidden
        />
      </div>
      <h3 className="mb-2 font-serif text-[1.2rem] font-bold leading-snug text-ink sm:text-[1.25rem]">
        {product.name}
      </h3>
      <p className="mb-3 line-clamp-2 font-serif text-[1rem] font-medium leading-snug text-ink/75">
        {product.descriptor}
      </p>
      <Price amountPkr={price} className="mt-auto text-[1.2rem] font-bold" />
      {showMeter ? (
        <div className="mt-4 border-t border-hairline pt-4">
          <PerformanceMeter
            sillage={product.sillage}
            longevity={product.longevity}
            compact
          />
        </div>
      ) : null}
    </Link>
  );
}
