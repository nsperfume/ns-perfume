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
    // The sentinel sits right after the main Add to bag button. Only show the bar once
    // that button has scrolled up out of view, not while it is still below the fold.
    const obs = new IntersectionObserver(
      ([entry]) =>
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const footer =
      document.getElementById("site-footer") ?? document.querySelector("footer");
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
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-paper px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-modal md:hidden">
          <div className="flex items-center gap-3">
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
              className="h-11! min-h-11! w-auto! shrink-0 px-0! [&>span:last-child]:px-4"
            >
              Add To Bag
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
