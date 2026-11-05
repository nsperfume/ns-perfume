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
  const count = products.length;
  // Slides per row: 2 from sm, 3 from md, 4 from lg. Hide the controls in CSS where all
  // of them fit, so nothing jumps when the carousel starts up.
  const controls =
    count === 1
      ? "hidden"
      : count === 2
        ? "flex sm:hidden"
        : count === 3
          ? "flex md:hidden"
          : count === 4
            ? "flex lg:hidden"
            : "flex";

  return (
    <EmblaCarousel
      gap="md"
      align="start"
      loop={count > 4}
      controlsClassName={controls}
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
