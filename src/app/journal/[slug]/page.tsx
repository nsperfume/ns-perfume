import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { getPost, journalPosts } from "@/data/journal";
import { getProduct } from "@/data/products";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return journalPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Journal" };
  return {
    title: `${post.title} | Journal`,
    description: post.excerpt,
  };
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const relatedProduct = post.relatedProductHandle
    ? getProduct(post.relatedProductHandle)
    : undefined;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    description: post.excerpt,
    author: { "@type": "Organization", name: "NS Perfume" },
  };

  return (
    <article className="bg-canvas section-y">
      <JsonLd data={articleLd} />
      <div className="container-ns max-w-2xl">
        <h1 className="text-display-lg mb-4">{post.title}</h1>
        <p className="mb-8 font-mono text-caption text-taupe">
          {post.date} · {post.readTime}
        </p>
        <div
          className="mb-12 aspect-[16/9] rounded-md"
          style={{ backgroundColor: post.imageTone }}
        />
        <div className="flex flex-col gap-6">
          {post.body.map((para) => (
            <p key={para.slice(0, 24)} className="text-body-lg text-taupe">
              {para}
            </p>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-hairline pt-8 sm:flex-row">
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
          <Link href="/journal" className="text-eyebrow text-brass self-center">
            All articles
          </Link>
        </div>
      </div>
    </article>
  );
}
