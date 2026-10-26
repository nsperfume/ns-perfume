import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchPageClient } from "@/components/search/search-page-client";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";

export const metadata: Metadata = {
  title: "Search perfumes",
  description:
    "Search NS Perfume by name, note such as oud or rose, or who it is for.",
  robots: { index: false },
};

export default function SearchRoute() {
  return (
    <>
      {/* Utility page: a plain header instead of a photo hero. Server-rendered so the H1 is in the HTML. */}
      <section className="border-b border-hairline bg-paper">
        <div className="container-ns pb-6 pt-8 sm:pb-8 sm:pt-12">
          <h1 className="text-display-md text-ink">Search</h1>
          <p className="mt-2 text-body text-taupe">
            Search by perfume name, a note like oud or rose, or who it is for.
          </p>
        </div>
      </section>
      <Suspense fallback={<BrandLoaderBlock label="Loading search" />}>
        <SearchPageClient />
      </Suspense>
    </>
  );
}
