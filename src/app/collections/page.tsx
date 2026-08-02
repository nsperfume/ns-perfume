import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import { getCollections } from "@/lib/store-data";

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
          <p className="mb-6 font-mono text-caption text-taupe">
            {collections.length} collection{collections.length === 1 ? "" : "s"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => {
              const image =
                tileImage[c.handle] ?? siteImages.collectionsHero;
              return (
                <Link
                  key={c.handle}
                  href={`/collections/${c.handle}`}
                  className="group relative flex min-h-52 flex-col justify-end overflow-hidden rounded-lg border border-hairline sm:min-h-60 lg:aspect-[5/4] lg:min-h-0"
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    loading="lazy"
                    quality={80}
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10"
                    aria-hidden
                  />
                  <div className="relative z-10 p-5 md:p-6">
                    <h2 className="text-heading-sm text-paper">{c.title}</h2>
                    <p className="mt-1 line-clamp-2 font-sans text-sm text-paper/80">
                      {c.description}
                    </p>
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
