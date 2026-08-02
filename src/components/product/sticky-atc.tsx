"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatSize } from "@/lib/format";
import { Price } from "@/components/commerce/price";
import type { StoreProduct } from "@/lib/mappers";

export function StickyAddToCart({
  product,
  sizeMl,
  price,
  onAdd,
}: {
  product: StoreProduct;
  sizeMl: number;
  price: number;
  sku: string;
  quantity?: number;
  isGift?: boolean;
  giftWrap?: boolean;
  giftMessage?: string;
  onAdd: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const obs = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(footer);
    return () => obs.disconnect();
  }, []);

  const show = visible && !footerVisible;

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      {show ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-paper p-4 shadow-modal md:hidden">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="font-mono text-caption text-taupe">
                {formatSize(sizeMl)} ·{" "}
                <Price amountPkr={price} className="text-sm" />
              </p>
            </div>
            <Button
              onClick={onAdd}
              disabled={!product.inStock}
              className="!w-auto shrink-0"
            >
              Add To Bag
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
