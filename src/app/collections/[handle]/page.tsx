import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CollectionFilters } from "@/components/collection/filters";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { siteImages } from "@/data/images";
import { getCollectionWithProducts } from "@/lib/store-data";

type Props = { params: Promise<{ handle: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const data = await getCollectionWithProducts(handle);
  if (!data) return { title: "Collection" };
  return {
    title: `${data.collection.title} perfume collection`,
    description: data.collection.description,
    alternates: { canonical: `/collections/${handle}` },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  const data = await getCollectionWithProducts(handle);
  if (!data) notFound();
  const { collection, products } = data;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Collections",
        item: "/collections",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: collection.title,
        item: `/collections/${handle}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <PageHero
        title={collection.title}
        description={collection.description}
        image={siteImages.collectionsHero}
        alt={`${collection.title} collection atmosphere with fragrance bottles`}
        objectPosition="center 48%"
      />
      <section className="border-b border-hairline bg-paper">
        <div className="container-ns flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 font-display text-[11px] uppercase tracking-[0.12em] text-taupe">
          <Link href="/collections" className="cursor-pointer transition-colors hover:text-ink">
            All collections
          </Link>
          <span aria-hidden className="text-hairline">
            /
          </span>
          <Link href="/products" className="cursor-pointer transition-colors hover:text-ink">
            All products
          </Link>
          <span aria-hidden className="hidden text-hairline sm:inline">
            /
          </span>
          <span className="w-full font-serif text-[0.95rem] normal-case tracking-normal text-ink/70 sm:w-auto">
            {products.length} product{products.length === 1 ? "" : "s"} in this collection
          </span>
        </div>
      </section>
      <section className="bg-canvas section-y">
        <div className="container-ns">
          {products.length === 0 ? (
            <div className="max-w-lg">
              <p className="font-sans text-body text-taupe">
                No bottles are linked to this collection yet. Browse the full
                line or another collection.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="font-display text-sm uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
                >
                  All Products
                </Link>
                <Link
                  href="/collections"
                  className="font-display text-sm uppercase tracking-[0.12em] text-ink underline-offset-4 hover:underline"
                >
                  All Collections
                </Link>
              </div>
            </div>
          ) : (
            <CollectionFilters
              products={products}
              seoCopy={collection.seoCopy || collection.description}
            />
          )}
        </div>
      </section>
    </>
  );
}
