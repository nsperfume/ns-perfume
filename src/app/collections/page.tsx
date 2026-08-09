import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { StoreSectionHeader } from "@/components/layout/store-section";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import { getCollections } from "@/lib/store-data";
import { richTextToPlain } from "@/lib/rich-text";

export const metadata: Metadata = {
  title: "Perfume collections | NS Perfume",
  description: pageCopy.collections.metaDescription,
  alternates: { canonical: "/collections" },
};

export const dynamic = "force-dynamic";

const tileImage: Record<string, string> = {
  "for-her": siteImages.shopByCollection.forHer,
  "for-him": siteImages.shopByCollection.forHim,
  unisex: siteImages.shopByCollection.unisex,
  "gift-sets": siteImages.shopByCollection.giftSets,
};

export default async function CollectionsIndexPage() {
  const collections = await getCollections();

  return (
    <>
      <PageHero
        title={pageCopy.collections.title}
        description={pageCopy.collections.description}
        image={siteImages.collectionsHero}
        alt="Fragrance bottles and botanicals on warm stone for NS Perfume collections"
        objectPosition="center 48%"
      />
      <section className="bg-canvas section-y">
        <div className="container-ns">
          <StoreSectionHeader
            eyebrow="Browse by theme"
            title={`${collections.length} collection${collections.length === 1 ? "" : "s"}`}
            description="Gender, family, concentration, and gift formats. Open a lane and filter from there."
            className="mb-8 sm:mb-10"
          />
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {collections.map((c) => {
              const image =
                tileImage[c.handle] ?? siteImages.collectionsHero;
              return (
                <Link
                  key={c.handle}
                  href={`/collections/${c.handle}`}
                  className="group relative flex min-h-56 flex-col justify-end overflow-hidden bg-muted sm:min-h-64 lg:aspect-[5/4] lg:min-h-0"
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    loading="lazy"
                    quality={80}
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
                    aria-hidden
                  />
                  <div className="relative z-10 p-5 md:p-6">
                    <h2 className="font-display text-[1.25rem] font-medium tracking-wide text-paper md:text-[1.35rem]">
                      {c.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 font-serif text-[0.95rem] text-paper/80">
                      {richTextToPlain(c.description || "")}
                    </p>
                    <span className="mt-3 inline-block font-display text-[11px] uppercase tracking-[0.14em] text-paper/70 transition-colors group-hover:text-brass">
                      View collection
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
