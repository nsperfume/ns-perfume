"use client";

import { useState } from "react";
import { ScentPyramid } from "@/components/commerce/scent-pyramid";
import { cn } from "@/lib/cn";
import type { StoreProduct } from "@/lib/mappers";

const tabs = ["Scent Pyramid", "The Story", "How to Wear"] as const;

export function ProductTabs({ product }: { product: StoreProduct }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Scent Pyramid");

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-4 border-b border-hairline">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "min-h-11 border-b-2 px-1 pb-3 text-eyebrow transition-colors",
              tab === t
                ? "border-brass text-ink"
                : "border-transparent text-taupe hover:text-ink",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Scent Pyramid" ? (
        <ScentPyramid
          topNotes={product.topNotes}
          heartNotes={product.heartNotes}
          baseNotes={product.baseNotes}
        />
      ) : null}
      {tab === "The Story" ? (
        <p className="measure text-body-lg text-taupe">{product.story}</p>
      ) : null}
      {tab === "How to Wear" ? (
        <p className="measure text-body-lg text-taupe">{product.howToWear}</p>
      ) : null}
    </div>
  );
}
