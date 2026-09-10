"use client";

import { useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import { Select } from "@/components/ui/select";
import type { StoreProduct } from "@/lib/mappers";
import { pageCopy } from "@/data/copy";

const PAGE_SIZE = 8;

const CONCENTRATION_OPTIONS = [
  { value: "all", label: "All" },
  { value: "EDT", label: "EDT" },
  { value: "EDP", label: "EDP" },
  { value: "PARFUM", label: "Parfum" },
] as const;

const GENDER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "her", label: "For Her" },
  { value: "him", label: "For Him" },
  { value: "unisex", label: "Unisex" },
] as const;

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price · Low to High" },
  { value: "price-desc", label: "Price · High to Low" },
  { value: "name", label: "Name · A–Z" },
] as const;

export function CollectionFilters({
  products,
  seoCopy,
}: {
  products: StoreProduct[];
  seoCopy: string;
}) {
  const [family, setFamily] = useState("all");
  const [concentration, setConcentration] = useState("all");
  const [gender, setGender] = useState("all");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const families = useMemo(
    () => Array.from(new Set(products.map((p) => p.family))).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    let list = [...products];
    if (family !== "all") list = list.filter((p) => p.family === family);
    if (concentration !== "all")
      list = list.filter((p) => p.concentration === concentration);
    if (gender !== "all") list = list.filter((p) => p.gender === gender);
    if (sort === "price-asc")
      list.sort((a, b) => (a.prices[0]?.price ?? 0) - (b.prices[0]?.price ?? 0));
    if (sort === "price-desc")
      list.sort((a, b) => (b.prices[0]?.price ?? 0) - (a.prices[0]?.price ?? 0));
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, family, concentration, gender, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function goToPage(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages));
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <>
      <div
        ref={topRef}
        className="mb-8 grid scroll-mt-[calc(var(--spacing-chrome-height)+1rem)] gap-4 border-b border-hairline pb-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
      >
        <Select
          label="Family"
          value={family}
          onValueChange={(v) => {
            setFamily(v);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All" },
            ...families.map((f) => ({
              value: f,
              label: f.charAt(0).toUpperCase() + f.slice(1),
            })),
          ]}
        />
        <Select
          label="Concentration"
          value={concentration}
          onValueChange={(v) => {
            setConcentration(v);
            setPage(1);
          }}
          options={[...CONCENTRATION_OPTIONS]}
        />
        <Select
          label="Gender"
          value={gender}
          onValueChange={(v) => {
            setGender(v);
            setPage(1);
          }}
          options={[...GENDER_OPTIONS]}
        />
        <Select
          label="Sort"
          value={sort}
          onValueChange={setSort}
          options={[...SORT_OPTIONS]}
        />
        <p className="flex items-end font-serif text-[15px] font-medium text-ink/65 lg:justify-end lg:pb-2">
          {filtered.length} product{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {pageItems.length === 0 ? (
        <p className="mb-24 text-body text-taupe">{pageCopy.emptyFilters}</p>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {pageItems.map((p) => (
            <ProductCard key={p.handle} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mb-24 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={safePage <= 1}
            className="min-h-11 cursor-pointer border border-hairline px-4 text-eyebrow disabled:opacity-40"
            onClick={() => goToPage(safePage - 1)}
          >
            Previous
          </button>
          <span className="font-mono text-caption">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            className="min-h-11 cursor-pointer border border-hairline px-4 text-eyebrow disabled:opacity-40"
            onClick={() => goToPage(safePage + 1)}
          >
            Next
          </button>
        </div>
      ) : (
        <div className="mb-24" />
      )}

      <div className="border-t border-hairline pt-8">
        <h2 className="text-heading-sm mb-4">About This Collection</h2>
        <p className="measure text-body text-taupe">{seoCopy}</p>
      </div>
    </>
  );
}
