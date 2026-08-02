import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/commerce/product-card";
import type { StoreProduct } from "@/lib/mappers";
import { pageCopy } from "@/data/copy";
import { siteImages, wornInWildAlts } from "@/data/images";

const collectionTiles = [
  {
    title: "For Her",
    href: "/collections/for-her",
    image: siteImages.shopByCollection.forHer,
    alt: "Glass perfume bottle with rose-gold liquid on linen with a pale rose",
  },
  {
    title: "For Him",
    href: "/collections/for-him",
    image: siteImages.shopByCollection.forHim,
    alt: "Dark amber perfume bottle on stone with cedar and leather tones",
  },
  {
    title: "Unisex",
    href: "/collections/unisex",
    image: siteImages.shopByCollection.unisex,
    alt: "Clear perfume bottle balanced with citrus leaf and warm resin",
  },
  {
    title: "Gift Sets",
    href: "/collections/gift-sets",
    image: siteImages.shopByCollection.giftSets,
    alt: "Gift tray of mini perfume vials on ivory tissue with a brass ribbon",
  },
];

export function HomeHero() {
  return (
    <section className="section-hero relative -mt-[var(--chrome-height)] overflow-hidden border-b border-hairline">
      <Image
        src={siteImages.homeHero}
        alt="Amber perfume bottle on travertine stone with dried citrus and evening light"
        fill
        priority
        fetchPriority="high"
        quality={80}
        className="object-cover object-[72%_center] sm:object-center"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/15 sm:via-black/40 sm:to-transparent"
        aria-hidden
      />
      <div className="container-ns relative z-10 flex flex-1 flex-col justify-end pb-12 pt-[calc(var(--chrome-height)+1.5rem)] sm:justify-center sm:pb-16 lg:pb-20">
        <div className="max-w-xl fade-up lg:max-w-2xl">
          <p className="mb-4 font-display text-[11px] font-medium uppercase tracking-[0.18em] text-paper/70">
            NS Perfume
          </p>
          <h1 className="text-display-xl text-paper">
            Written for heat, stillness, and the hours after work
          </h1>
          <p className="mt-5 max-w-lg font-serif text-body-lg text-white/90">
            {pageCopy.homeHero}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/products/amber-noir-edp">Shop Amber Noir</Button>
            <Button
              href="/products"
              variant="secondary"
              className="!border-paper/50 !bg-transparent !text-paper hover:!border-brass"
            >
              Shop All
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ShopByCollection() {
  return (
    <section className="border-b border-hairline bg-canvas section-y">
      <div className="container-ns">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
              Start Here
            </p>
            <h2 className="text-display-lg">Shop By Collection</h2>
            <p className="mt-2 text-body text-taupe">{pageCopy.shopByCollection}</p>
          </div>
          <Button href="/collections" variant="ghost" className="self-start sm:self-auto">
            All Collections
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {collectionTiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="group relative block aspect-[4/5] overflow-hidden bg-muted"
            >
              <Image
                src={tile.image}
                alt={tile.alt}
                fill
                loading="lazy"
                quality={80}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 md:p-6">
                <span className="font-display text-[1.15rem] font-medium tracking-wide text-paper md:text-[1.25rem]">
                  {tile.title}
                </span>
                <span
                  className="font-display text-[11px] uppercase tracking-[0.14em] text-paper/70 transition-colors group-hover:text-brass"
                  aria-hidden
                >
                  Shop →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BestsellersSection({ products }: { products: StoreProduct[] }) {
  const items = products.slice(0, 4);
  return (
    <section className="border-b border-hairline bg-muted section-y">
      <div className="container-ns">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
          <div className="max-w-xl">
            <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
              Most Reached For
            </p>
            <h2 className="text-display-lg">Bestsellers</h2>
            <p className="mt-2 text-body text-taupe">{pageCopy.bestsellers}</p>
          </div>
          <Button href="/collections/bestsellers" variant="ghost">
            View All
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.handle} product={product} showMeter />
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrandStoryBand() {
  return (
    <section className="border-b border-hairline bg-canvas">
      <div className="grid lg:min-h-[min(100dvh-var(--chrome-height),44rem)] lg:grid-cols-2">
        <div className="relative min-h-[18rem] w-full sm:min-h-[22rem] lg:min-h-full">
          <Image
            src={siteImages.storyBand}
            alt="Stacked brass trays of citrus, rose petals, and wood notes on warm stone"
            fill
            loading="lazy"
            quality={80}
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-14 xl:px-16">
          <p className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
            The House
          </p>
          <h2 className="text-display-lg max-w-md text-ink">
            Composed like labels. Worn like daily architecture.
          </h2>
          <p className="mt-5 max-w-md text-body-lg text-taupe">
            {pageCopy.brandStory}
          </p>

          <dl className="mt-8 max-w-md space-y-4 border-t border-hairline pt-6">
            {[
              { label: "Top", notes: "Bergamot · Pink pepper" },
              { label: "Heart", notes: "Iris · Oud · Rose" },
              { label: "Base", notes: "Amber · Cedar · Musk" },
            ].map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[4.5rem_1fr] items-baseline gap-3"
              >
                <dt className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-brass">
                  {row.label}
                </dt>
                <dd className="font-serif text-[1.05rem] text-ink/85">
                  {row.notes}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <Button href="/about">Read Our Story</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FindYourScentTeaser() {
  return (
    <section className="relative overflow-hidden border-b border-hairline">
      <div className="relative min-h-[20rem] w-full sm:min-h-[24rem] lg:min-h-[28rem]">
        <Image
          src={siteImages.findYourScent}
          alt="Three fragrance bottles arranged as choices for finding your scent"
          fill
          loading="lazy"
          quality={80}
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/25"
          aria-hidden
        />
        <div className="container-ns relative z-10 flex min-h-[20rem] flex-col justify-center py-12 sm:min-h-[24rem] lg:min-h-[28rem]">
          <div className="max-w-lg">
            <p className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-paper/65">
              Guided Match
            </p>
            <h2 className="text-display-lg text-paper">Find Your Scent</h2>
            <p className="mt-4 font-serif text-body-lg text-white/90">
              {pageCopy.findYourScentHome}
            </p>
            <div className="mt-8">
              <Button href="/find-your-scent">Start The Guide</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export type TestimonialItem = {
  author: string;
  city?: string;
  quote: string;
  productName?: string;
  rating?: number;
};

export function TestimonialsSection({
  items,
}: {
  items: TestimonialItem[];
}) {
  const shown = items.slice(0, 3);
  return (
    <section className="border-b border-hairline bg-canvas section-y">
      <div className="container-ns">
        <div className="mb-10 max-w-xl">
          <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
            From Wearers
          </p>
          <h2 className="text-display-lg">Loved Across Cities</h2>
          <p className="mt-2 text-body text-taupe">{pageCopy.testimonials}</p>
        </div>

        <div className="grid gap-0 md:grid-cols-3 md:divide-x md:divide-hairline">
          {shown.map((t, i) => (
            <figure
              key={`${t.author}-${t.quote.slice(0, 20)}`}
              className={`flex flex-col py-6 md:px-8 md:py-2 ${i === 0 ? "md:pl-0" : ""
                } ${i === shown.length - 1 ? "md:pr-0" : ""} border-b border-hairline md:border-b-0`}
            >
              {t.rating ? (
                <p className="mb-3 font-mono text-[12px] text-brass">
                  {t.rating}/5
                </p>
              ) : (
                <div className="mb-3 h-px w-8 bg-brass" aria-hidden />
              )}
              <blockquote className="flex-1 font-serif text-[1.15rem] leading-relaxed text-ink">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6">
                <p className="font-display text-[0.95rem] font-medium text-ink">
                  {t.author}
                </p>
                <p className="mt-0.5 font-serif text-[0.9rem] text-taupe">
                  {[t.city, t.productName].filter(Boolean).join(" · ")}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function JournalPreview({
  posts,
}: {
  posts: {
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    imageTone?: string;
  }[];
}) {
  const shown = posts.slice(0, 3);
  return (
    <section className="border-b border-hairline bg-muted section-y">
      <div className="container-ns">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
          <div>
            <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
              Journal
            </p>
            <h2 className="text-display-lg">Recent Notes</h2>
          </div>
          <Button href="/journal" variant="ghost">
            Read More
          </Button>
        </div>

        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {shown.map((post, i) => (
            <Link
              key={post.slug}
              href={`/journal/${post.slug}`}
              className="group flex flex-col"
            >
              <div
                className="relative mb-4 aspect-[16/10] overflow-hidden border border-hairline"
                style={{ backgroundColor: post.imageTone || "#F3EDE3" }}
              >
                <span className="absolute left-4 top-4 font-mono text-[11px] text-ink/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-taupe">
                {post.date} · {post.readTime}
              </p>
              <h3 className="font-display text-[1.2rem] font-medium leading-snug text-ink transition-colors group-hover:text-brass">
                {post.title}
              </h3>
              <p className="mt-2 line-clamp-2 font-serif text-[1rem] text-taupe">
                {post.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function UgcGrid() {
  const shots = siteImages.wornInWild;
  return (
    <section className="border-b border-hairline bg-canvas section-y">
      <div className="container-ns">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
              In Life
            </p>
            <h2 className="text-display-lg">Worn In The Wild</h2>
            <p className="mt-2 text-body text-taupe">{pageCopy.wornInWild}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:grid-rows-2 md:gap-4">
          {shots.map((src, i) => (
            <div
              key={src}
              className={`relative overflow-hidden bg-muted ${i === 0
                  ? "col-span-2 aspect-[16/10] md:row-span-2 md:aspect-auto md:min-h-[28rem]"
                  : "aspect-square md:aspect-auto"
                }`}
            >
              <Image
                src={src}
                alt={wornInWildAlts[i] ?? "Fragrance worn in everyday light"}
                fill
                loading="lazy"
                quality={80}
                className="object-cover"
                sizes={
                  i === 0
                    ? "(max-width: 768px) 100vw, 66vw"
                    : "(max-width: 768px) 50vw, 33vw"
                }
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
