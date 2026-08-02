import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchPageClient } from "@/components/search/search-page-client";
import { pageCopy } from "@/data/copy";

export const metadata: Metadata = {
  title: "Search perfume by note or name",
  description: pageCopy.search.description,
};

export default function SearchRoute() {
  return (
    <Suspense
      fallback={
        <div className="container-ns section-y text-taupe">Loading search…</div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
