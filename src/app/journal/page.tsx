import type { Metadata } from "next";
import Link from "next/link";
import { journalPosts } from "@/data/journal";

export const metadata: Metadata = {
  title: "Journal - scent guides and notes",
  description:
    "NS Perfume journal on scent pyramids, layering, gifting, and EDP versus EDT in plain language.",
};

export default function JournalIndexPage() {
  const [feature, ...rest] = journalPosts;

  return (
    <section className="bg-canvas section-y">
      <div className="container-ns">
        <header className="mb-12 max-w-2xl md:mb-16">
          <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
            Journal
          </p>
          <h1 className="text-display-lg text-balance">Notes on wear</h1>
          <p className="mt-4 text-pretty font-serif text-[1.15rem] leading-relaxed text-taupe">
            Practical guides on notes, concentration, and gifting, written from
            the shopper&apos;s side of the screen.
          </p>
        </header>

        {feature ? (
          <Link
            href={`/journal/${feature.slug}`}
            className="group mb-14 grid gap-6 border-b border-hairline pb-12 md:mb-16 md:grid-cols-2 md:gap-12 md:pb-16"
          >
            <div
              className="aspect-[16/10] w-full"
              style={{ backgroundColor: feature.imageTone }}
            />
            <div className="flex flex-col justify-center">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-taupe">
                {feature.date} · {feature.readTime}
              </p>
              <h2 className="text-display-md text-balance transition-colors group-hover:text-brass">
                {feature.title}
              </h2>
              <p className="mt-4 max-w-md font-serif text-[1.1rem] leading-relaxed text-taupe">
                {feature.excerpt}
              </p>
              <span className="mt-6 font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink">
                Read article
              </span>
            </div>
          </Link>
        ) : null}

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post, i) => (
            <Link
              key={post.slug}
              href={`/journal/${post.slug}`}
              className="group flex flex-col"
            >
              <div
                className="relative mb-4 aspect-[16/10]"
                style={{ backgroundColor: post.imageTone }}
              >
                <span className="absolute left-3 top-3 font-mono text-[11px] text-ink/40">
                  {String(i + 2).padStart(2, "0")}
                </span>
              </div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-taupe">
                {post.date} · {post.readTime}
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
  );
}
