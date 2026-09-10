"use client";

import { useState } from "react";
import { ScentPyramid } from "@/components/commerce/scent-pyramid";
import { RichHtml } from "@/components/ui/rich-html";
import { cn } from "@/lib/cn";
import type { StoreProduct } from "@/lib/mappers";

const tabs = [
  { id: "pyramid", label: "Scent pyramid" },
  { id: "story", label: "The story" },
  { id: "wear", label: "How to wear" },
] as const;

export function ProductTabs({ product }: { product: StoreProduct }) {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("pyramid");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Product details"
        className="mb-8 flex gap-1 overflow-x-auto border-b border-hairline scrollbar-panel"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            id={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-12 shrink-0 cursor-pointer border-b-2 px-2.5 pb-3 font-display text-[11px] font-medium uppercase tracking-[0.08em] transition-colors duration-300 sm:px-3 sm:text-[12px] sm:tracking-[0.12em]",
              tab === t.id
                ? "border-ink text-ink"
                : "border-transparent text-taupe hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="min-h-[10rem]"
      >
        {tab === "pyramid" ? (
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <p className="mb-4 max-w-md font-serif text-[1.1rem] leading-relaxed text-taupe">
                Real top, heart, and base materials as they open and settle on
                skin. Use this to match office air, outdoor heat, or evening
                tables.
              </p>
              <ScentPyramid
                topNotes={product.topNotes}
                heartNotes={product.heartNotes}
                baseNotes={product.baseNotes}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <NoteSummary title="Opens with" notes={product.topNotes} />
              <NoteSummary title="Settles into" notes={product.baseNotes} />
            </div>
          </div>
        ) : null}
        {tab === "story" ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
            <RichHtml
              html={product.story}
              className="max-w-2xl text-pretty font-serif text-[1.2rem] leading-[1.7] text-ink/85"
            />
            <aside className="border border-hairline bg-muted/50 p-6">
              <p className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                At a glance
              </p>
              <ul className="mt-4 space-y-3 font-serif text-[1.05rem] text-ink/80">
                <li>
                  <span className="text-taupe">Family · </span>
                  <span className="capitalize">{product.family}</span>
                </li>
                <li>
                  <span className="text-taupe">Concentration · </span>
                  {product.concentration}
                </li>
                <li>
                  <span className="text-taupe">Origin · </span>
                  {product.countryOfOrigin}
                </li>
                <li>
                  <span className="text-taupe">Gender · </span>
                  <span className="capitalize">{product.gender}</span>
                </li>
              </ul>
            </aside>
          </div>
        ) : null}
        {tab === "wear" ? (
          <RichHtml
            html={product.howToWear}
            className="measure-wide text-pretty font-serif text-[1.2rem] leading-[1.7] text-ink/85"
          />
        ) : null}
      </div>
    </div>
  );
}

function NoteSummary({ title, notes }: { title: string; notes: string[] }) {
  return (
    <div className="border border-hairline bg-paper p-5">
      <p className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
        {title}
      </p>
      <p className="mt-3 font-serif text-[1.05rem] leading-snug text-ink">
        {notes.join(" · ")}
      </p>
    </div>
  );
}
