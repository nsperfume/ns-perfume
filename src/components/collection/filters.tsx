"use client";

import { useMemo, useRef, useState } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import { Select } from "@/components/ui/select";
import type { StoreProduct } from "@/lib/mappers";
import { pageCopy } from "@/data/copy";
import { lowestPrice } from "@/lib/search";

const PAGE_SIZE = 24;

const CONCENTRATION_OPTIONS = [
  { value: "all", label: "All" },
  { value: "EDT", label: "EDT" },
  { value: "EDP", label: "EDP" },
  { value: "PARFUM", label: "Parfum" },
] as const;

const GENDER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "her", label: "For her" },
  { value: "him", label: "For him" },
  { value: "unisex", label: "Unisex" },
] as const;

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
] as const;

type Dimension = "gender" | "family" | "concentration";

/** Grid columns for the toolbar: one per visible filter, plus sort and the count. */
const TOOLBAR_COLUMNS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 md:grid-cols-3",
  4: "sm:grid-cols-2 md:grid-cols-4",
  5: "sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
};

/**
 * Dimensions the collection already fixes, so their filter is not shown:
 * from the collection rule tags when passed (gender:him, family:woody,
 * concentration:edp), else whenever every product shares one value.
 */
function fixedDimensions(
  products: StoreProduct[],
  filterTags: readonly string[] | null | undefined,
): Set<Dimension> {
  const fixed = new Set<Dimension>();
  for (const tag of filterTags ?? []) {
    const key = tag.split(":")[0];
    if (key === "gender" || key === "family" || key === "concentration") fixed.add(key);
  }
  if (products.length > 0) {
    for (const d of ["gender", "family", "concentration"] as const) {
      if (new Set(products.map((p) => p[d])).size === 1) fixed.add(d);
    }
  }
  return fixed;
}

export function CollectionFilters({
  products,
  seoCopy,
  filterTags,
}: {
  products: StoreProduct[];
  seoCopy: string;
  /** The collection's rule tags, e.g. ["gender:him"]. Optional: inferred from products otherwise. */
  filterTags?: readonly string[] | null;
}) {
  const [family, setFamily] = useState("all");
  const [concentration, setConcentration] = useState("all");
  const [gender, setGender] = useState("all");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const fixed = useMemo(() => fixedDimensions(products, filterTags), [products, filterTags]);

  const families = useMemo(
    () => Array.from(new Set(products.map((p) => p.family))).sort(),
    [products],
  );

  const matchesFilters = (p: StoreProduct, skip?: Dimension) =>
    (skip === "family" || family === "all" || p.family === family) &&
    (skip === "concentration" || concentration === "all" || p.concentration === concentration) &&
    (skip === "gender" || gender === "all" || p.gender === gender);

  /** Options with no product under the other filters are disabled, not offered as dead ends. */
  const available = (d: Dimension, value: string) =>
    products.some((p) => matchesFilters(p, d) && p[d] === value);

  const filtered = useMemo(() => {
    const list = products.filter(
      (p) =>
        (family === "all" || p.family === family) &&
        (concentration === "all" || p.concentration === concentration) &&
        (gender === "all" || p.gender === gender),
    );
    if (sort === "price-asc") list.sort((a, b) => lowestPrice(a) - lowestPrice(b));
    if (sort === "price-desc") list.sort((a, b) => lowestPrice(b) - lowestPrice(a));
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, family, concentration, gender, sort]);

  /** Hide concentrations the collection does not carry at all. */
  const concentrationOptions = CONCENTRATION_OPTIONS.filter(
    (o) => o.value === "all" || products.some((p) => p.concentration === o.value),
  ).map((o) => ({
    ...o,
    disabled: o.value !== "all" && o.value !== concentration && !available("concentration", o.value),
  }));
  const genderOptions = GENDER_OPTIONS.filter(
    (o) => o.value === "all" || products.some((p) => p.gender === o.value),
  ).map((o) => ({
    ...o,
    disabled: o.value !== "all" && o.value !== gender && !available("gender", o.value),
  }));
  const showFamily = !fixed.has("family") && families.length > 1;
  const showConcentration = !fixed.has("concentration") && concentrationOptions.length > 2;
  const showGender = !fixed.has("gender") && genderOptions.length > 2;
  const toolbarItems = 2 + Number(showFamily) + Number(showConcentration) + Number(showGender);

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
        className={`mb-8 grid scroll-mt-[calc(var(--spacing-chrome-height)+1rem)] gap-4 border-b border-hairline pb-6 ${TOOLBAR_COLUMNS[toolbarItems]}`}
      >
        {showFamily ? (
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
                disabled: f !== family && !available("family", f),
              })),
            ]}
          />
        ) : null}
        {showConcentration ? (
          <Select
            label="Concentration"
            value={concentration}
            onValueChange={(v) => {
              setConcentration(v);
              setPage(1);
            }}
            options={concentrationOptions}
          />
        ) : null}
        {showGender ? (
          <Select
            label="Gender"
            value={gender}
            onValueChange={(v) => {
              setGender(v);
              setPage(1);
            }}
            options={genderOptions}
          />
        ) : null}
        <Select
          label="Sort"
          value={sort}
          onValueChange={setSort}
          options={[...SORT_OPTIONS]}
        />
        <p className="flex items-end text-body-sm text-taupe lg:justify-end lg:pb-3">
          <span>
            <span className="font-sans tabular-nums">{filtered.length}</span> product
            {filtered.length === 1 ? "" : "s"}
          </span>
        </p>
      </div>

      {pageItems.length === 0 ? (
        <p className="mb-24 text-body text-taupe">{pageCopy.emptyFilters}</p>
      ) : (
        <>
          <h2 className="sr-only">Products</h2>
          <div className="mb-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 2xl:gap-x-6">
            {pageItems.map((p) => (
              <ProductCard key={p.handle} product={p} />
            ))}
          </div>
        </>
      )}

      {totalPages > 1 ? (
        <div className="mb-24 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={safePage <= 1}
            className="min-h-11 cursor-pointer rounded-xs border border-ink/60 px-5 text-label text-ink transition-colors hover:border-ink disabled:opacity-40"
            onClick={() => goToPage(safePage - 1)}
          >
            Previous
          </button>
          <span className="font-sans tabular-nums text-sm text-taupe">
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            className="min-h-11 cursor-pointer rounded-xs border border-ink/60 px-5 text-label text-ink transition-colors hover:border-ink disabled:opacity-40"
            onClick={() => goToPage(safePage + 1)}
          >
            Next
          </button>
        </div>
      ) : (
        <div className="mb-24" />
      )}

      <div className="border-t border-hairline pt-8">
        <h2 className="mb-4 text-heading-sm">About this collection</h2>
        <p className="measure text-body text-taupe">{seoCopy}</p>
      </div>
    </>
  );
}
