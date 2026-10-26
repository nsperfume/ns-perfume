"use client";

import {
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ProductCard } from "@/components/commerce/product-card";
import type { StoreProduct } from "@/lib/mappers";
import { cn } from "@/lib/cn";
import { pageCopy } from "@/data/copy";
import { SelectInline } from "@/components/ui/select";
import { lowestPrice } from "@/lib/search";

/** 24 per page so the whole first page is in the server HTML. */
const PAGE_SIZE = 24;

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

type Badge = StoreProduct["badges"][number];

type Filters = {
  gender: string;
  family: string;
  concentration: string;
  badges: Badge[];
  sort: string;
  page: number;
};

const DEFAULT_FILTERS: Filters = {
  gender: "all",
  family: "all",
  concentration: "all",
  badges: [],
  sort: "featured",
  page: 1,
};

/*
 * Filters live in the address bar (?gender=him&family=woody&sort=price-asc) so
 * Back from a product keeps them and a filtered view can be shared. The page
 * canonical stays /products. The server renders the unfiltered list (so all of
 * page one is in the HTML) and the URL is applied on the client.
 */
const URL_EVENT = "ns:catalog-filters";

function subscribeToUrl(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(URL_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(URL_EVENT, onChange);
  };
}
const readUrlSearch = () => window.location.search;
const readServerSearch = () => "";

function parseFilters(search: string, families: string[]): Filters {
  const q = new URLSearchParams(search);
  const pick = <T extends string>(value: string | null, allowed: readonly T[]) =>
    allowed.find((a) => a.toLowerCase() === (value ?? "").toLowerCase());
  const page = Number.parseInt(q.get("page") ?? "", 10);
  return {
    gender: pick(q.get("gender"), ["her", "him", "unisex"]) ?? "all",
    family: pick(q.get("family"), families) ?? "all",
    concentration: pick(q.get("concentration"), ["EDT", "EDP", "PARFUM"]) ?? "all",
    badges: (q.get("badge") ?? "")
      .split(",")
      .map((b) => pick(b, BADGE_OPTIONS.map((o) => o.value)))
      .filter((b): b is Badge => Boolean(b)),
    sort: pick(q.get("sort"), SORT_OPTIONS.map((o) => o.value)) ?? "featured",
    page: Number.isFinite(page) && page > 1 ? page : 1,
  };
}

function filtersToSearch(f: Filters): string {
  const q = new URLSearchParams();
  if (f.gender !== "all") q.set("gender", f.gender);
  if (f.family !== "all") q.set("family", f.family);
  if (f.concentration !== "all") q.set("concentration", f.concentration.toLowerCase());
  if (f.badges.length) q.set("badge", f.badges.join(","));
  if (f.sort !== "featured") q.set("sort", f.sort);
  if (f.page > 1) q.set("page", String(f.page));
  return q.toString().replace(/%2C/g, ",");
}

type Dimension = "gender" | "family" | "concentration" | "badge";

/** Which active filters a product passes, one flag per dimension. */
function passes(p: StoreProduct, f: Filters): Record<Dimension, boolean> {
  return {
    gender: f.gender === "all" || p.gender === f.gender,
    family: f.family === "all" || p.family === f.family,
    concentration: f.concentration === "all" || p.concentration === f.concentration,
    badge: !f.badges.length || f.badges.some((b) => p.badges.includes(b)),
  };
}

/** Passes every active filter except `skip`: the base for that group's counts. */
function passesOthers(flags: Record<Dimension, boolean>, skip: Dimension) {
  return (Object.keys(flags) as Dimension[]).every((d) => d === skip || flags[d]);
}

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

/** Row colours: checked, unavailable (0 matches with the other filters) or normal. */
function optionTone(checked: boolean, disabled: boolean) {
  return checked
    ? "cursor-pointer bg-ink text-paper"
    : disabled
      ? "cursor-not-allowed text-ink/35"
      : "cursor-pointer text-ink/85 hover:bg-muted/70 hover:text-ink";
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
  const disabled = !checked && count === 0;
  return (
    <label
      className={cn(
        "flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2 transition-colors",
        optionTone(checked, disabled),
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="h-4 w-4 shrink-0 accent-ink disabled:cursor-not-allowed"
        />
        <span className="text-body-sm font-medium leading-snug">
          {label}
        </span>
      </span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "shrink-0 font-sans tabular-nums text-sm font-semibold",
            checked ? "text-paper/75" : disabled ? "text-ink/35" : "text-ink/55",
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
  const disabled = !checked && count === 0;
  return (
    <label
      className={cn(
        "flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2 transition-colors",
        optionTone(checked, disabled),
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="h-4 w-4 shrink-0 rounded-sm accent-ink disabled:cursor-not-allowed"
        />
        <span className="text-body-sm font-medium leading-snug">
          {label}
        </span>
      </span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "shrink-0 font-sans tabular-nums text-sm font-semibold",
            checked ? "text-paper/75" : disabled ? "text-ink/35" : "text-ink/55",
          )}
        >
          {count}
        </span>
      ) : null}
    </label>
  );
}

export function ProductsCatalog({ products }: { products: StoreProduct[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const gridTopRef = useRef<HTMLDivElement>(null);

  const families = useMemo(() => {
    const set = new Set(products.map((p) => p.family).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const urlSearch = useSyncExternalStore(subscribeToUrl, readUrlSearch, readServerSearch);
  const filters = useMemo(() => parseFilters(urlSearch, families), [urlSearch, families]);
  const { family, concentration, gender, badges, sort, page } = filters;

  /** Write filters to the URL with replace (no new history entry per click). */
  function update(patch: Partial<Filters>) {
    const next = { ...filters, page: 1, ...patch };
    const qs = filtersToSearch(next);
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    // The native History API is wired into the Next router and, unlike
    // router.replace, does not refetch the page or reset scroll.
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new Event(URL_EVENT));
  }

  /** Badges that exist anywhere in the catalog (others are never offered). */
  const badgeTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const p of products) for (const b of p.badges) totals[b] = (totals[b] ?? 0) + 1;
    return totals;
  }, [products]);

  // Each group counts against the other active filters, so an option that
  // would empty the grid shows 0 and is disabled.
  const counts = useMemo(() => {
    const gender: Record<string, number> = { all: 0 };
    const family: Record<string, number> = { all: 0 };
    const concentration: Record<string, number> = { all: 0 };
    const badge: Record<string, number> = {};

    for (const p of products) {
      const flags = passes(p, filters);
      if (passesOthers(flags, "gender")) {
        gender.all += 1;
        gender[p.gender] = (gender[p.gender] ?? 0) + 1;
      }
      if (passesOthers(flags, "family")) {
        family.all += 1;
        family[p.family] = (family[p.family] ?? 0) + 1;
      }
      if (passesOthers(flags, "concentration")) {
        concentration.all += 1;
        concentration[p.concentration] = (concentration[p.concentration] ?? 0) + 1;
      }
      if (passesOthers(flags, "badge")) {
        for (const b of p.badges) badge[b] = (badge[b] ?? 0) + 1;
      }
    }
    return { gender, family, concentration, badge };
  }, [products, filters]);

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      const flags = passes(p, filters);
      return flags.gender && flags.family && flags.concentration && flags.badge;
    });

    if (sort === "price-asc") list.sort((a, b) => lowestPrice(a) - lowestPrice(b));
    else if (sort === "price-desc") list.sort((a, b) => lowestPrice(b) - lowestPrice(a));
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function goToPage(next: number) {
    const clamped = Math.min(Math.max(1, next), totalPages);
    update({ page: clamped });
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
    update(DEFAULT_FILTERS);
  }

  function toggleBadge(value: Badge) {
    update({
      badges: badges.includes(value)
        ? badges.filter((b) => b !== value)
        : [...badges, value],
    });
  }

  /**
   * Rendered twice (phone panel and desktop sidebar), so radio names carry the
   * panel id; one shared name would make the two copies a single radio group.
   */
  const filtersPanel = (panel: "mobile" | "desktop") => (
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
            name={`${panel}-gender`}
            value={opt.value}
            label={opt.label}
            checked={gender === opt.value}
            count={counts.gender[opt.value] ?? 0}
            onChange={() => update({ gender: opt.value })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Scent family">
        <FilterOption
          name={`${panel}-family`}
          value="all"
          label="All families"
          checked={family === "all"}
          count={counts.family.all}
          onChange={() => update({ family: "all" })}
        />
        {families.map((f) => (
          <FilterOption
            key={f}
            name={`${panel}-family`}
            value={f}
            label={f.charAt(0).toUpperCase() + f.slice(1)}
            checked={family === f}
            count={counts.family[f] ?? 0}
            onChange={() => update({ family: f })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Concentration">
        {CONCENTRATION_OPTIONS.map((opt) => (
          <FilterOption
            key={opt.value}
            name={`${panel}-concentration`}
            value={opt.value}
            label={opt.label}
            checked={concentration === opt.value}
            count={counts.concentration[opt.value] ?? 0}
            onChange={() => update({ concentration: opt.value })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Highlights">
        {BADGE_OPTIONS.map((opt) => {
          if (!badgeTotals[opt.value]) return null;
          const count = counts.badge[opt.value] ?? 0;
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
          className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border border-ink/70 bg-paper px-5 text-label text-ink"
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
        <div className="mb-6 rounded-xl border border-hairline bg-paper p-5 lg:hidden">
          {filtersPanel("mobile")}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="mt-5 min-h-12 w-full cursor-pointer rounded-full border border-ink bg-ink text-label text-paper"
          >
            Show {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10 2xl:gap-14">
        {/* Desktop sidebar */}
        <aside className="hidden w-full shrink-0 lg:block lg:w-60 2xl:w-64">
          <div className="sticky top-[calc(var(--spacing-chrome-height)+1.5rem)] max-h-[calc(100dvh-var(--spacing-chrome-height)-3rem)] overflow-y-auto rounded-xl border border-hairline bg-paper p-5 scrollbar-panel xl:p-6">
            {filtersPanel("desktop")}
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
              onValueChange={(v) => update({ sort: v })}
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
                className="min-h-11 cursor-pointer rounded-full border border-ink/60 px-5 text-label text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
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
                className="min-h-11 cursor-pointer rounded-full border border-ink/60 px-5 text-label text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
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
