import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { RichHtml } from "@/components/ui/rich-html";
import {
  getJournalPost,
  getJournalPosts,
  getStoreProduct,
} from "@/lib/store-data";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getJournalPost(slug);
  if (!post) return { title: "Journal" };
  const title =
    post.title.length > 50 ? `${post.title.slice(0, 47)}...` : post.title;
  return {
    title: `${title} | Journal`,
    description: post.excerpt.slice(0, 154),
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
        <div className="container-ns max-w-3xl section-y pb-10 pt-12 md:pb-12 md:pt-16">
          <Link
            href="/journal"
            className="mb-6 inline-flex font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe transition-colors hover:text-brass"
          >
            Journal
          </Link>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-brass">
            {post.category}
          </p>
          <h1 className="text-display-lg text-balance text-ink">{post.title}</h1>
          <p className="mt-5 max-w-2xl font-serif text-[1.15rem] leading-relaxed text-taupe">
            {post.excerpt}
          </p>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.12em] text-taupe">
            {formatDate(post.date)} · {post.readTime}
          </p>
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

      <div className="container-ns max-w-2xl py-12 md:py-16">
        <RichHtml
          html={post.bodyHtml}
          className="font-serif text-[1.15rem] leading-[1.75] text-ink/85"
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
          <Link
            href="/journal"
            className="font-display text-[12px] font-medium uppercase tracking-[0.12em] text-brass sm:ml-auto"
          >
            All articles
          </Link>
        </div>
      </div>

      {related.length ? (
        <section className="border-t border-hairline bg-muted/40 section-y">
          <div className="container-ns">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
                  Keep reading
                </p>
                <h2 className="text-display-md text-ink">More from the journal</h2>
              </div>
              <Button href="/journal" variant="ghost" className="hidden sm:inline-flex">
                View all
              </Button>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/journal/${item.slug}`}
                  className="group flex flex-col"
                >
                  <div className="relative mb-4 aspect-16/10 overflow-hidden bg-muted">
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
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-taupe">
                    {formatDate(item.date)} · {item.readTime}
                  </p>
                  <h3 className="font-display text-[1.1rem] font-medium leading-snug text-ink transition-colors group-hover:text-brass">
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
