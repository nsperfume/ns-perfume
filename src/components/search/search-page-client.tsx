"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/commerce/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { StoreProduct } from "@/lib/mappers";
import { BrandLoader } from "@/components/brand/brand-loader";
import {
  POPULAR_SEARCHES,
  fetchSearchCatalog,
  isBestseller,
  searchProducts,
  type SearchProduct,
} from "@/lib/search";

type CatalogStatus = "loading" | "ready" | "error";

/** Wait this long after the last keystroke before rewriting ?q= in the address bar. */
const URL_DEBOUNCE_MS = 400;

const chipClass =
  "inline-flex min-h-11 cursor-pointer items-center rounded-xs border border-hairline bg-paper px-4 text-body-sm text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper";

/** ProductCard takes a full product; search rows only carry the card fields it reads. */
function asCardProduct(p: SearchProduct): StoreProduct {
  return {
    ...p,
    description: "",
    ingredients: [],
    countryOfOrigin: "",
    story: "",
    howToWear: "",
    gallery: [p.imagePrimary, p.imageSecondary],
    relatedHandles: [],
  };
}

function searchUrl(q: string) {
  return q ? `/search?q=${encodeURIComponent(q)}` : "/search";
}

function ProductGrid({
  products,
  className = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
}: {
  products: SearchProduct[];
  className?: string;
}) {
  return (
    <div className={`grid gap-x-3 gap-y-10 sm:gap-x-5 ${className}`}>
      {products.map((p) => (
        <ProductCard key={p.handle} product={asCardProduct(p)} />
      ))}
    </div>
  );
}

/** Columns that fit a short list exactly (4 bestsellers fill one row, not 3 + 1). */
function fitColumns(count: number) {
  return count >= 4
    ? "grid-cols-2 md:grid-cols-4"
    : count === 3
      ? "grid-cols-2 md:grid-cols-3"
      : "grid-cols-2";
}

export function SearchPageClient() {
  const params = useSearchParams();
  const urlQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  /** Last ?q= this page wrote itself, so it is not mistaken for outside navigation. */
  const [writtenQuery, setWrittenQuery] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<SearchProduct[]>([]);
  const [status, setStatus] = useState<CatalogStatus>("loading");

  // Follow ?q= when it changes from outside (search sheet, back / forward, links).
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery);
    if (urlQuery !== writtenQuery) setQuery(urlQuery);
  }

  useEffect(() => {
    let cancelled = false;
    fetchSearchCatalog()
      .then((data) => {
        if (cancelled) return;
        setCatalog(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Replace (never push) the history entry so Back leaves search in one step.
   * The native History API is wired into the Next router (useSearchParams
   * follows it) and, unlike router.replace, does not refetch the page.
   */
  function writeUrl(q: string) {
    setWrittenQuery(q);
    window.history.replaceState(null, "", searchUrl(q));
  }

  // Keep the address bar in step with typing, debounced.
  useEffect(() => {
    const q = query.trim();
    if (q === urlQuery.trim()) return;
    const timer = window.setTimeout(() => {
      setWrittenQuery(q);
      window.history.replaceState(null, "", searchUrl(q));
    }, URL_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, urlQuery]);

  const search = useMemo(() => searchProducts(catalog, query), [catalog, query]);
  const results = search.results;
  const bestsellers = useMemo(() => catalog.filter(isBestseller).slice(0, 4), [catalog]);

  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const ready = status === "ready";
  const empty = ready && hasQuery && results.length === 0;
  const count = results.length;

  function pick(q: string) {
    setQuery(q);
    writeUrl(q);
  }

  return (
    <section className="bg-canvas pb-20 pt-8 sm:pb-24 sm:pt-10">
      <div className="container-ns">
        <form
          role="search"
          className="flex max-w-2xl flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            writeUrl(trimmed);
          }}
        >
          <Input
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try oud, rose, for men or gifts"
            aria-label="Search perfumes"
            autoComplete="off"
            enterKeyHint="search"
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </form>

        {!hasQuery ? (
          <div className="mt-8 space-y-12">
            <div>
              <h2 className="mb-3 text-eyebrow text-taupe">Popular searches</h2>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => pick(label)}
                    className={chipClass}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {bestsellers.length > 0 ? (
              <div>
                <h2 className="mb-6 text-display-sm text-ink">Bestsellers</h2>
                <ProductGrid products={bestsellers} className={fitColumns(bestsellers.length)} />
              </div>
            ) : null}
          </div>
        ) : null}

        {hasQuery && status === "loading" ? (
          <div className="flex justify-center py-12">
            <BrandLoader size={72} label="Searching" caption="Searching our perfumes" />
          </div>
        ) : null}

        {hasQuery && status === "error" ? (
          <p className="mt-8 text-body text-taupe" role="alert">
            Search is not loading right now. Refresh the page or try again in a
            moment.
          </p>
        ) : null}

        {ready && hasQuery ? (
          <div className="mb-6 mt-8 border-b border-hairline pb-4" role="status">
            {empty ? (
              <h2 className="text-display-sm text-ink">No results for “{trimmed}”</h2>
            ) : search.partial ? (
              <>
                <h2 className="text-display-sm text-ink">No exact matches for “{trimmed}”</h2>
                <p className="mt-1.5 text-body-sm text-taupe">
                  {count === 1
                    ? "This perfume matches part of your search."
                    : `These ${count} perfumes match part of your search.`}
                </p>
              </>
            ) : (
              <h2 className="text-display-sm text-ink">
                <span className="font-sans tabular-nums">{count}</span>{" "}
                {count === 1 ? "result" : "results"} for “{trimmed}”
              </h2>
            )}
          </div>
        ) : null}

        {empty ? (
          <div>
            <p className="mb-8 text-body text-taupe">
              Check the spelling, or try a note like oud or rose. You could also
              start with one of our bestsellers.
            </p>
            <ProductGrid products={bestsellers} className={fitColumns(bestsellers.length)} />
          </div>
        ) : null}

        {ready && results.length > 0 ? <ProductGrid products={results} /> : null}
      </div>
    </section>
  );
}
