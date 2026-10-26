import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CollectionFilters } from "@/components/collection/filters";
import { PageHero } from "@/components/layout/page-hero";
import { StoreBreadcrumb } from "@/components/layout/store-section";
import { JsonLd } from "@/components/seo/json-ld";
import { siteImages } from "@/data/images";
import { siteConfig } from "@/data/site";
import { getCollectionWithProducts, getCollections } from "@/lib/store-data";
import { richTextToPlain } from "@/lib/rich-text";

type Props = { params: Promise<{ handle: string }> };

/** Cached for speed; admin edits refresh it at once via revalidateStorefront(). */
export const revalidate = 300;

/** Prerender every collection at build; new ones render on first visit. */
export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ handle: String(c.handle) }));
}

/** Search-friendly titles for the main collections; others follow "{title} perfumes in Pakistan". */
const SEO_TITLES: Record<string, string> = {
  "for-him": "Perfumes for men in Pakistan",
  "for-her": "Perfumes for women in Pakistan",
  unisex: "Unisex perfumes in Pakistan",
  bestsellers: "Best selling perfumes in Pakistan",
  "new-arrivals": "New perfumes in Pakistan",
  "gift-sets": "Perfume gift sets in Pakistan",
  oriental: "Oud and amber perfumes in Pakistan",
  "eau-de-parfum": "Eau de parfum in Pakistan",
  "eau-de-toilette": "Eau de toilette in Pakistan",
  "wedding-season": "Wedding perfumes in Pakistan",
};

function seoTitle(handle: string, title: string) {
  if (SEO_TITLES[handle]) return SEO_TITLES[handle];
  const base = /perfume|fragrance|scent/i.test(title) ? title : `${title} perfumes`;
  return `${base} in Pakistan`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const data = await getCollectionWithProducts(handle);
  if (!data) return { title: "Collection" };
  const prices = data.products.flatMap((p) => p.prices.map((s) => s.price)).filter((n) => n > 0);
  const intro = richTextToPlain(data.collection.description || "").trim();
  const from = prices.length ? ` Prices from Rs ${Math.min(...prices).toLocaleString("en-US")}.` : "";
  const description = `${intro ? `${intro.replace(/\.?$/, ".")} ` : ""}Shop ${data.products.length} perfume${data.products.length === 1 ? "" : "s"} online.${from} Cash on delivery across Pakistan.`;
  return {
    title: seoTitle(handle, String(data.collection.title)),
    description: description.slice(0, 160),
    alternates: { canonical: `/collections/${handle}` },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  const data = await getCollectionWithProducts(handle);
  if (!data) notFound();
  const { collection, products } = data;

  // One trail for the visible breadcrumb and the BreadcrumbList markup.
  const trail = [
    { label: "Home", href: "/" },
    { label: "Collections", href: "/collections" },
    { label: String(collection.title), href: `/collections/${handle}` },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.label,
      item: `${siteConfig.url}${t.href === "/" ? "" : t.href}`,
    })),
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: String(collection.title),
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteConfig.url}/products/${p.handle}`,
      name: p.name,
    })),
  };

  return (
    <>
      <JsonLd data={products.length ? [breadcrumbLd, itemListLd] : breadcrumbLd} />
      <PageHero
        title={collection.title}
        description={richTextToPlain(collection.description || "")}
        image={siteImages.collectionsHero}
        alt={`${collection.title} collection atmosphere with fragrance bottles`}
        objectPosition="center 48%"
      />
      <section className="border-b border-hairline bg-paper">
        <div className="container-ns flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
          <StoreBreadcrumb items={trail} className="" />
          <p className="text-caption text-taupe">
            {products.length} perfume{products.length === 1 ? "" : "s"}
          </p>
        </div>
      </section>
      <section className="bg-canvas section-y">
        <div className="container-ns">
          {products.length === 0 ? (
            <div className="max-w-lg">
              <p className="font-sans text-body text-taupe">
                There are no perfumes in this collection yet. Browse all
                perfumes or another collection.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="text-label text-ink underline-offset-4 hover:underline"
                >
                  All perfumes
                </Link>
                <Link
                  href="/collections"
                  className="text-label text-ink underline-offset-4 hover:underline"
                >
                  All collections
                </Link>
              </div>
            </div>
          ) : (
            <CollectionFilters
              products={products}
              seoCopy={collection.seoCopy || collection.description}
              filterTags={(collection as { filterTags?: string[] }).filterTags}
            />
          )}
        </div>
      </section>
    </>
  );
}
