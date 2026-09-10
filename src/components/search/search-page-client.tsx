"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/commerce/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import type { StoreProduct } from "@/lib/mappers";

export function SearchPageClient() {
  const params = useSearchParams();
  const initial = params.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [catalog, setCatalog] = useState<StoreProduct[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setCatalog(j.data);
      })
      .catch(() => {});
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
  const empty = query.trim().length > 0 && results.length === 0;

  return (
    <>
      <PageHero
        title={pageCopy.search.title}
        description={pageCopy.search.description}
        image={siteImages.search}
        alt="Fragrance notes and bottles for searching the NS Perfume line"
        objectPosition="center 42%"
      />
      <section className="bg-canvas section-y">
        <div className="container-ns max-w-4xl">
          <form
            className="mb-8 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => e.preventDefault()}
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

          {empty ? (
            <div className="mb-24">
              <p className="mb-4 text-body text-taupe">
                No results for “{query}”. Try a note name, or start with these
                bestsellers.
              </p>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {bestsellers.map((p) => (
                  <ProductCard key={p.handle} product={p} />
                ))}
              </div>
            </div>
          ) : null}

          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {results.map((p) => (
                <ProductCard key={p.handle} product={p} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
