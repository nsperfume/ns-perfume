import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchPageClient } from "@/components/search/search-page-client";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";

export const metadata: Metadata = {
  title: "Search perfume by note or name",
  description: pageCopy.search.description,
  robots: { index: false },
};

export default function SearchRoute() {
  return (
    <>
      {/* Hero stays server-rendered so the H1 is in the initial HTML. */}
      <PageHero
        title={pageCopy.search.title}
        description={pageCopy.search.description}
        image={siteImages.search}
        alt="Fragrance notes and bottles for searching the NS Perfume line"
        objectPosition="center 42%"
      />
      <Suspense
        fallback={
          <BrandLoaderBlock label="Loading search" />
        }
      >
        <SearchPageClient />
      </Suspense>
    </>
  );
}
