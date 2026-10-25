"use client";

import { ProductCard } from "@/components/commerce/product-card";
import { EmblaCarousel } from "@/components/ui/embla-carousel";
import type { StoreProduct } from "@/lib/mappers";

export function ProductCarousel({
  products,
  showMeter = false,
}: {
  products: StoreProduct[];
  showMeter?: boolean;
}) {
  if (!products.length) return null;

  return (
    <EmblaCarousel
      gap="md"
      align="start"
      loop
      autoplayDelay={4200}
      slideClassName="min-w-0 flex-[0_0_72%] sm:flex-[0_0_50%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%]"
      showDots
      showArrows
    >
      {products.map((product, i) => (
        <ProductCard
          key={product.handle}
          product={product}
          showMeter={showMeter}
          priority={i < 2}
          className="h-auto"
        />
      ))}
    </EmblaCarousel>
  );
}
