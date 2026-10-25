import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getJournalPosts } from "@/lib/store-data";
import { siteImages } from "@/data/images";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Journal: scent guides and notes",
  description:
    "NS Perfume journal on scent pyramids, heat, office wear, layering, and gifting in plain language.",
  alternates: { canonical: "/journal" },
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function JournalIndexPage() {
  const posts = await getJournalPosts();
  const [feature, ...rest] = posts;

  return (
    <>
      <PageHero
        title="Notes on wear"
        description="Practical guides on notes, concentration, climate, and gifting, written from the shopper's side of the counter."
        image={siteImages.storyBand}
        alt="Citrus, rose, and wood notes arranged on brass trays"
        objectPosition="center 40%"
      />

      <section className="bg-canvas section-y">
        <div className="container-ns">
          {!posts.length ? (
            <p className="text-body-lg text-taupe">
              New notes are on the way. Check back soon.
            </p>
          ) : null}

          {feature ? (
            <Link
              href={`/journal/${feature.slug}`}
              className="group mb-14 grid gap-7 border-b border-hairline pb-12 md:mb-20 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-center md:gap-12 md:pb-20 lg:gap-16"
            >
              <div className="relative aspect-16/10 overflow-hidden bg-muted">
                {feature.imageUrl ? (
                  <Image
                    src={feature.imageUrl}
                    alt={`Cover for ${feature.title}`}
                    fill
                    priority
                    quality={85}
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: feature.imageTone }}
                  />
                )}
                <span className="absolute left-4 top-4 bg-paper/90 px-2.5 py-1 text-eyebrow text-ink">
                  {feature.category}
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <p className="mb-4 text-caption text-taupe">
                  {formatDate(feature.date)} · {feature.readTime}
                </p>
                <h2 className="text-display-md text-balance transition-colors group-hover:text-brass-ink">
                  {feature.title}
                </h2>
                <p className="mt-5 max-w-[34rem] text-body-lg text-taupe">
                  {feature.excerpt}
                </p>
                <span className="mt-7 inline-flex self-start text-label text-ink underline decoration-ink/25 underline-offset-[6px] transition-colors group-hover:text-brass-ink group-hover:decoration-brass">
                  Read article
                </span>
              </div>
            </Link>
          ) : null}

          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/journal/${post.slug}`}
                className="group flex flex-col"
              >
                <div className="relative mb-5 aspect-16/10 overflow-hidden bg-muted">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt={`Cover for ${post.title}`}
                      fill
                      loading="lazy"
                      quality={80}
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: post.imageTone }}
                    />
                  )}
                </div>
                <p className="mb-2 text-eyebrow text-brass-ink">
                  {post.category}
                </p>
                <p className="mb-3 text-caption text-taupe">
                  {formatDate(post.date)} · {post.readTime}
                </p>
                <h2 className="text-display-sm text-ink transition-colors group-hover:text-brass-ink">
                  {post.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-body text-taupe">
                  {post.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
