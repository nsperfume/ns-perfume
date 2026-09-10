"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import { StoreSectionHeader } from "@/components/layout/store-section";
import type { StoreProduct } from "@/lib/mappers";

export function RecentlyViewed({
  currentHandle,
  catalog,
}: {
  currentHandle: string;
  catalog: StoreProduct[];
}) {
  const [items, setItems] = useState<StoreProduct[]>([]);

  useEffect(() => {
    try {
      const key = "ns-recently-viewed";
      const handles = (
        JSON.parse(localStorage.getItem(key) || "[]") as string[]
      ).filter((h) => h !== currentHandle);
      setItems(
        handles
          .map((h) => catalog.find((p) => p.handle === h))
          .filter((p): p is StoreProduct => Boolean(p))
          .slice(0, 4),
      );
    } catch {
      setItems([]);
    }
  }, [currentHandle, catalog]);

  if (!items.length) return null;

  return (
    <section className="border-t border-hairline bg-canvas section-y">
      <div className="container-ns">
        <StoreSectionHeader
          eyebrow="Continue"
          title="Recently viewed"
          description="Bottles you opened in this browser."
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.handle} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
