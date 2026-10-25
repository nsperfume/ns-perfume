"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/commerce/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { StoreProduct } from "@/lib/mappers";
import { BrandLoader } from "@/components/brand/brand-loader";

type CatalogStatus = "loading" | "ready" | "error";

export function SearchPageClient() {
  const params = useSearchParams();
  const router = useRouter();
  const urlQuery = params.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  const [catalog, setCatalog] = useState<StoreProduct[]>([]);
  const [status, setStatus] = useState<CatalogStatus>("loading");

  // Follow ?q= when it changes from outside (search sheet, back / forward, links).
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) {
          setCatalog(j.data);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.descriptor.toLowerCase().includes(q) ||
        p.family.toLowerCase().includes(q) ||
        p.topNotes.some((n) => n.toLowerCase().includes(q)) ||
        p.heartNotes.some((n) => n.toLowerCase().includes(q)) ||
        p.baseNotes.some((n) => n.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query, catalog]);

  const bestsellers = catalog
    .filter((p) => p.badges.includes("bestseller"))
    .slice(0, 4);
  const hasQuery = query.trim().length > 0;
  const empty = status === "ready" && hasQuery && results.length === 0;

  return (
    <section className="bg-canvas section-y">
      <div className="container-ns max-w-4xl">
        <form
          role="search"
          className="mb-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            router.replace(q ? `/search?q=${encodeURIComponent(q)}` : "/search", {
              scroll: false,
            });
          }}
        >
          <Input
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, names, families…"
            aria-label="Search products"
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </form>

        {hasQuery && status === "loading" ? (
          <div className="mb-24 flex justify-center py-8">
            <BrandLoader size={72} label="Searching" caption="Searching the collection" />
          </div>
        ) : null}

        {hasQuery && status === "error" ? (
          <p className="mb-24 text-body text-taupe" role="alert">
            Could not load the catalog right now. Refresh the page or try again
            shortly.
          </p>
        ) : null}

        {empty ? (
          <div className="mb-24">
            <p className="mb-4 text-body text-taupe">
              No results for “{query.trim()}”. Try a note name, or start with
              these bestsellers.
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3">
              {bestsellers.map((p) => (
                <ProductCard key={p.handle} product={p} />
              ))}
            </div>
          </div>
        ) : null}

        {results.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3">
            {results.map((p) => (
              <ProductCard key={p.handle} product={p} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
