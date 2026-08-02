import type { Metadata } from "next";
import Link from "next/link";
import { journalPosts } from "@/data/journal";

export const metadata: Metadata = {
  title: "Journal - scent guides and notes",
  description:
    "NS Perfume journal on scent pyramids, layering, gifting, and EDP versus EDT in plain language.",
};

export default function JournalIndexPage() {
  return (
    <section className="bg-canvas section-y">
      <div className="container-ns">
        <h1 className="text-display-lg mb-4">Notes on wear</h1>
        <p className="measure mb-12 text-body text-taupe">
          Practical guides on notes, concentration, and gifting, written from the
          shopper’s side of the screen.
        </p>
        <div className="grid gap-8 md:grid-cols-2">
          {journalPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/journal/${post.slug}`}
              className="group flex flex-col border-b border-hairline pb-8"
            >
              <div
                className="mb-4 aspect-[16/9] rounded-md"
                style={{ backgroundColor: post.imageTone }}
              />
              <p className="mb-2 font-mono text-caption text-taupe">
                {post.date} · {post.readTime}
              </p>
              <h2 className="text-display-md group-hover:text-brass">{post.title}</h2>
              <p className="mt-3 text-body text-taupe">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
