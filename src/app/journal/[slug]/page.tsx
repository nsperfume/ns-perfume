import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { RichHtml } from "@/components/ui/rich-html";
import { siteConfig } from "@/data/site";
import {
  getJournalPost,
  getJournalPosts,
  getStoreProduct,
} from "@/lib/store-data";

type Props = { params: Promise<{ slug: string }> };

/** Cached for speed; admin edits refresh it at once via revalidateStorefront(). */
export const revalidate = 300;

/** Prerender every published article at build; new ones render on first visit. */
export async function generateStaticParams() {
  const posts = await getJournalPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Root layout appends " | NS Perfume"; keep the full title tag under 60 characters. */
const MAX_TITLE = 59 - ` | ${siteConfig.name}`.length;

function seoTitle(title: string) {
  if (title.length <= MAX_TITLE) return title;
  const cut = title.slice(0, MAX_TITLE - 1);
  const space = cut.lastIndexOf(" ");
  const trimmed = space > MAX_TITLE * 0.6 ? cut.slice(0, space) : cut;
  return `${trimmed.replace(/[\s,:;.\-]+$/, "")}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getJournalPost(slug);
  if (!post) return { title: "Journal" };
  return {
    title: seoTitle(post.title),
    description: post.excerpt.slice(0, 154),
    alternates: { canonical: `/journal/${post.slug}` },
  };
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getJournalPost(slug);
  if (!post) notFound();

  const [relatedProduct, more] = await Promise.all([
    post.relatedProductHandle
      ? getStoreProduct(post.relatedProductHandle)
      : Promise.resolve(null),
    getJournalPosts(),
  ]);

  const related = more.filter((p) => p.slug !== post.slug).slice(0, 3);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    description: post.excerpt,
    image: post.imageUrl || undefined,
    author: { "@type": "Organization", name: "NS Perfume" },
  };

  return (
    <article className="bg-canvas">
      <JsonLd data={articleLd} />

      <header className="border-b border-hairline">
        <div className="container-ns pb-12 pt-12 md:pb-16 md:pt-20">
          <div className="mx-auto max-w-[46rem]">
          <p className="mb-5 flex flex-wrap items-center gap-2.5 text-eyebrow">
            <Link
              href="/journal"
              className="inline-flex min-h-8 items-center text-taupe transition-colors hover:text-brass-ink"
            >
              Journal
            </Link>
            {post.category ? (
              <>
                <span className="text-taupe/50" aria-hidden>
                  /
                </span>
                <span className="text-brass-ink">{post.category}</span>
              </>
            ) : null}
          </p>
          <h1 className="text-display-lg text-balance text-ink">{post.title}</h1>
          <p className="mt-6 max-w-[40rem] text-body-lg text-taupe">
            {post.excerpt}
          </p>
          <p className="mt-6 text-caption text-taupe">
            {formatDate(post.date)} · {post.readTime}
          </p>
          </div>
        </div>

        <div className="relative aspect-16/9 w-full overflow-hidden bg-muted md:aspect-[2.2/1]">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={`Cover for ${post.title}`}
              fill
              priority
              quality={88}
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: post.imageTone }}
            />
          )}
        </div>
      </header>

      <div className="container-ns py-12 md:py-20">
        <div className="mx-auto max-w-[42rem]">
        <RichHtml
          html={post.bodyHtml}
          className="text-body-lg text-ink/85"
        />

        <div className="mt-12 flex flex-col gap-3 border-t border-hairline pt-8 sm:flex-row sm:flex-wrap sm:items-center">
          {relatedProduct ? (
            <Button href={`/products/${relatedProduct.handle}`}>
              Shop {relatedProduct.name}
            </Button>
          ) : null}
          {post.relatedCollectionHandle ? (
            <Button
              href={`/collections/${post.relatedCollectionHandle}`}
              variant="secondary"
            >
              Browse collection
            </Button>
          ) : null}
          {related.length ? null : (
            <Link
              href="/journal"
              className="inline-flex min-h-11 items-center text-label text-brass-ink underline decoration-brass/40 underline-offset-[6px] sm:ml-auto"
            >
              All articles
            </Link>
          )}
        </div>
        </div>
      </div>

      {related.length ? (
        <section className="border-t border-hairline bg-muted/40 section-y">
          <div className="container-ns">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="mb-3 text-eyebrow text-taupe">
                  Keep reading
                </p>
                <h2 className="text-display-md text-ink">More from the journal</h2>
              </div>
              <Button href="/journal" variant="ghost" className="hidden sm:inline-flex">
                View all
              </Button>
            </div>
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/journal/${item.slug}`}
                  className="group flex flex-col"
                >
                  <div className="relative mb-5 aspect-16/10 overflow-hidden bg-muted">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        loading="lazy"
                        quality={80}
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{ backgroundColor: item.imageTone }}
                      />
                    )}
                  </div>
                  <p className="mb-2 text-caption text-taupe">
                    {formatDate(item.date)} · {item.readTime}
                  </p>
                  <h3 className="text-display-sm text-ink transition-colors group-hover:text-brass-ink">
                    {item.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
