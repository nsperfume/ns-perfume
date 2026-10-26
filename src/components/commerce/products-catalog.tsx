"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { ProductCard } from "@/components/commerce/product-card";
import type { StoreProduct } from "@/lib/mappers";
import { cn } from "@/lib/cn";
import { pageCopy } from "@/data/copy";
import { SelectInline } from "@/components/ui/select";

const PAGE_SIZE = 12;

const GENDER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "her", label: "For her" },
  { value: "him", label: "For him" },
  { value: "unisex", label: "Unisex" },
] as const;

const CONCENTRATION_OPTIONS = [
  { value: "all", label: "All" },
  { value: "EDT", label: "Eau de Toilette" },
  { value: "EDP", label: "Eau de Parfum" },
  { value: "PARFUM", label: "Parfum" },
] as const;

const BADGE_OPTIONS = [
  { value: "bestseller", label: "Bestsellers" },
  { value: "new", label: "New arrivals" },
  { value: "limited", label: "Limited edition" },
  { value: "sale", label: "Sale" },
] as const;

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
] as const;

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="border-b border-hairline pb-5">
      <legend className="mb-3 w-full text-eyebrow text-taupe">
        {title}
      </legend>
      <div className="flex flex-col gap-0.5">{children}</div>
    </fieldset>
  );
}

function FilterOption({
  name,
  value,
  label,
  checked,
  onChange,
  count,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xs px-3 py-2 transition-colors",
        checked
          ? "bg-ink text-paper"
          : "text-ink/85 hover:bg-muted/70 hover:text-ink",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 shrink-0 accent-ink"
        />
        <span className="text-body-sm font-medium leading-snug">
          {label}
        </span>
      </span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "shrink-0 text-sm font-semibold",
            checked ? "text-paper/75" : "text-ink/55",
          )}
        >
          {count}
        </span>
      ) : null}
    </label>
  );
}

function BadgeOption({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xs px-3 py-2 transition-colors",
        checked
          ? "bg-ink text-paper"
          : "text-ink/85 hover:bg-muted/70 hover:text-ink",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 shrink-0 rounded-sm accent-ink"
        />
        <span className="text-body-sm font-medium leading-snug">
          {label}
        </span>
      </span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "shrink-0 text-sm font-semibold",
            checked ? "text-paper/75" : "text-ink/55",
          )}
        >
          {count}
        </span>
      ) : null}
    </label>
  );
}

export function ProductsCatalog({ products }: { products: StoreProduct[] }) {
  const [family, setFamily] = useState("all");
  const [concentration, setConcentration] = useState("all");
  const [gender, setGender] = useState("all");
  const [badges, setBadges] = useState<string[]>([]);
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [mobileOpen, setMobileOpen] = useState(false);
  const gridTopRef = useRef<HTMLDivElement>(null);

  const families = useMemo(() => {
    const set = new Set(products.map((p) => p.family).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const counts = useMemo(() => {
    const gender: Record<string, number> = { all: products.length };
    const family: Record<string, number> = { all: products.length };
    const concentration: Record<string, number> = { all: products.length };
    const badge: Record<string, number> = {};

    for (const p of products) {
      gender[p.gender] = (gender[p.gender] ?? 0) + 1;
      family[p.family] = (family[p.family] ?? 0) + 1;
      concentration[p.concentration] =
        (concentration[p.concentration] ?? 0) + 1;
      for (const b of p.badges) {
        badge[b] = (badge[b] ?? 0) + 1;
      }
    }
    return { gender, family, concentration, badge };
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (family !== "all") list = list.filter((p) => p.family === family);
    if (concentration !== "all")
      list = list.filter((p) => p.concentration === concentration);
    if (gender !== "all") list = list.filter((p) => p.gender === gender);
    if (badges.length)
      list = list.filter((p) =>
        badges.some((b) =>
          p.badges.includes(b as StoreProduct["badges"][number]),
        ),
      );

    if (sort === "price-asc")
      list.sort((a, b) => (a.prices[0]?.price ?? 0) - (b.prices[0]?.price ?? 0));
    else if (sort === "price-desc")
      list.sort((a, b) => (b.prices[0]?.price ?? 0) - (a.prices[0]?.price ?? 0));
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, family, concentration, gender, badges, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function goToPage(next: number) {
    const clamped = Math.min(Math.max(1, next), totalPages);
    setPage(clamped);
    requestAnimationFrame(() => {
      gridTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  const activeCount =
    (family !== "all" ? 1 : 0) +
    (concentration !== "all" ? 1 : 0) +
    (gender !== "all" ? 1 : 0) +
    badges.length;

  function resetFilters() {
    setFamily("all");
    setConcentration("all");
    setGender("all");
    setBadges([]);
    setSort("featured");
    setPage(1);
  }

  function toggleBadge(value: string) {
    setBadges((prev) =>
      prev.includes(value) ? prev.filter((b) => b !== value) : [...prev, value],
    );
    setPage(1);
  }

  const filtersPanel = (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-label text-ink">
            Filters
          </p>
          <p className="mt-1 text-caption text-taupe">
            {filtered.length} of {products.length}
          </p>
        </div>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex min-h-8 cursor-pointer items-center text-label text-ink/70 underline underline-offset-4 hover:text-ink"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <FilterGroup title="Shop by gender">
        {GENDER_OPTIONS.map((opt) => (
          <FilterOption
            key={opt.value}
            name="gender"
            value={opt.value}
            label={opt.label}
            checked={gender === opt.value}
            count={counts.gender[opt.value] ?? 0}
            onChange={() => {
              setGender(opt.value);
              setPage(1);
            }}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Scent family">
        <FilterOption
          name="family"
          value="all"
          label="All families"
          checked={family === "all"}
          count={counts.family.all}
          onChange={() => {
            setFamily("all");
            setPage(1);
          }}
        />
        {families.map((f) => (
          <FilterOption
            key={f}
            name="family"
            value={f}
            label={f.charAt(0).toUpperCase() + f.slice(1)}
            checked={family === f}
            count={counts.family[f] ?? 0}
            onChange={() => {
              setFamily(f);
              setPage(1);
            }}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Concentration">
        {CONCENTRATION_OPTIONS.map((opt) => (
          <FilterOption
            key={opt.value}
            name="concentration"
            value={opt.value}
            label={opt.label}
            checked={concentration === opt.value}
            count={counts.concentration[opt.value] ?? 0}
            onChange={() => {
              setConcentration(opt.value);
              setPage(1);
            }}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Featured">
        {BADGE_OPTIONS.map((opt) => {
          const count = counts.badge[opt.value] ?? 0;
          if (count === 0 && opt.value !== "bestseller") return null;
          return (
            <BadgeOption
              key={opt.value}
              label={opt.label}
              checked={badges.includes(opt.value)}
              count={count}
              onChange={() => toggleBadge(opt.value)}
            />
          );
        })}
      </FilterGroup>
    </div>
  );

  return (
    <div className="container-ns">
      {/* Mobile filter toggle */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xs border border-ink/70 bg-paper px-5 text-label text-ink"
          aria-expanded={mobileOpen}
        >
          Filters
          {activeCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 font-sans tabular-nums text-xs text-paper">
              {activeCount}
            </span>
          ) : null}
        </button>
      </div>

      {mobileOpen ? (
        <div className="mb-6 rounded-xs border border-hairline bg-paper p-5 lg:hidden">
          {filtersPanel}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="mt-5 min-h-12 w-full cursor-pointer rounded-xs border border-ink bg-ink text-label text-paper"
          >
            Show {filtered.length} results
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10 2xl:gap-14">
        {/* Desktop sidebar */}
        <aside className="hidden w-full shrink-0 lg:block lg:w-60 2xl:w-64">
          <div className="sticky top-[calc(var(--spacing-chrome-height)+1.5rem)] max-h-[calc(100dvh-var(--spacing-chrome-height)-3rem)] overflow-y-auto rounded-xs border border-hairline bg-paper p-5 scrollbar-panel xl:p-6">
            {filtersPanel}
          </div>
        </aside>

        {/* Products */}
        <div className="min-w-0 flex-1">
          <div
            ref={gridTopRef}
            className="mb-5 flex scroll-mt-[calc(var(--spacing-chrome-height)+1rem)] flex-col gap-3 border-b border-hairline pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <p className="min-w-0 text-body-sm text-taupe">
              {filtered.length} product{filtered.length === 1 ? "" : "s"}
              {activeCount > 0 ? " · filtered" : ""}
            </p>
            <SelectInline
              className="min-w-0 sm:shrink-0"
              value={sort}
              onValueChange={(v) => {
                setSort(v);
                setPage(1);
              }}
              aria-label="Sort products"
              prefix={
                <span className="shrink-0 text-eyebrow text-taupe">
                  Sort by
                </span>
              }
              options={SORT_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </div>

          {pageItems.length === 0 ? (
            <div className="py-16 text-center lg:py-20">
              <p className="mx-auto max-w-sm font-sans text-body text-taupe">
                {pageCopy.emptyFilters}
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 cursor-pointer text-label text-ink underline-offset-4 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <h2 className="sr-only">Products</h2>
              <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 2xl:grid-cols-4 2xl:gap-x-6">
                {pageItems.map((p) => (
                  <ProductCard key={p.handle} product={p} />
                ))}
              </div>
            </>
          )}

          {totalPages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-3 border-t border-hairline pt-8">
              <button
                type="button"
                disabled={safePage <= 1}
                className="min-h-11 cursor-pointer rounded-xs border border-ink/60 px-5 text-label text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
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
                className="min-h-11 cursor-pointer rounded-xs border border-ink/60 px-5 text-label text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => goToPage(safePage + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
