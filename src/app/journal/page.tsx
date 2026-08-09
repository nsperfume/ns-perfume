import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getJournalPosts } from "@/lib/store-data";
import { siteImages } from "@/data/images";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Journal - scent guides and notes",
  description:
    "NS Perfume journal on scent pyramids, heat, office wear, layering, and gifting in plain language.",
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
            <p className="font-serif text-[1.15rem] text-taupe">
              New notes are on the way. Check back soon.
            </p>
          ) : null}

          {feature ? (
            <Link
              href={`/journal/${feature.slug}`}
              className="group mb-14 grid gap-6 border-b border-hairline pb-12 md:mb-16 md:grid-cols-2 md:gap-12 md:pb-16"
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
                <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.14em] text-paper/90 mix-blend-difference">
                  {feature.category}
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-taupe">
                  {formatDate(feature.date)} · {feature.readTime}
                </p>
                <h2 className="text-display-md text-balance transition-colors group-hover:text-brass">
                  {feature.title}
                </h2>
                <p className="mt-4 max-w-md font-serif text-[1.1rem] leading-relaxed text-taupe">
                  {feature.excerpt}
                </p>
                <span className="mt-6 font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink transition-colors group-hover:text-brass">
                  Read article
                </span>
              </div>
            </Link>
          ) : null}

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {rest.map((post, i) => (
              <Link
                key={post.slug}
                href={`/journal/${post.slug}`}
                className="group flex flex-col"
              >
                <div className="relative mb-4 aspect-16/10 overflow-hidden bg-muted">
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
                  <span className="absolute left-3 top-3 font-mono text-[11px] text-paper/85 mix-blend-difference">
                    {String(i + 2).padStart(2, "0")}
                  </span>
                </div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-brass">
                  {post.category}
                </p>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-taupe">
                  {formatDate(post.date)} · {post.readTime}
                </p>
                <h2 className="font-display text-[1.2rem] font-medium leading-snug text-ink transition-colors group-hover:text-brass">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-3 font-serif text-[1rem] text-taupe">
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
