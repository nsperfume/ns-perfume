import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ProductCarousel } from "@/components/commerce/product-carousel";
import {
  TestimonialsCarousel,
  type TestimonialItem,
} from "@/components/home/testimonials-carousel";
import type { StoreProduct } from "@/lib/mappers";
import { pageCopy } from "@/data/copy";
import { siteImages, wornInWildAlts } from "@/data/images";
import { cn } from "@/lib/cn";

export type { TestimonialItem };

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
] as const;

function SectionLead({
  eyebrow,
  title,
  description,
  action,
  light = false,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between md:mb-10",
        className,
      )}
    >
      <div className="max-w-xl">
        <p
          className={cn(
            "mb-2 font-display text-[11px] font-medium uppercase tracking-[0.16em]",
            light ? "text-paper/65" : "text-taupe",
          )}
        >
          {eyebrow}
        </p>
        <h2
          className={cn(
            "text-display-lg text-balance",
            light ? "text-paper" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-2 text-pretty font-serif text-[1.05rem] leading-relaxed",
              light ? "text-white/85" : "text-taupe",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="shrink-0 self-start sm:self-auto">{action}</div>
      ) : null}
    </div>
  );
}

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
              className="border-paper/75 bg-transparent text-paper hover:border-brass focus-visible:ring-offset-ink"
            >
              Shop All
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeTrustBanner() {
  return (
    <section className="border-b border-hairline bg-muted">
      <div className="container-ns">
        <ul className="grid divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            {
              title: "Cash on delivery",
              body: "Pay when the parcel arrives in major cities.",
            },
            {
              title: "Free shipping",
              body: "Complimentary standard on orders over Rs 8,000.",
            },
            {
              title: "Track anytime",
              body: "Status page with map after you place an order.",
            },
          ].map((item) => (
            <li
              key={item.title}
              className="px-1 py-5 text-center sm:px-6 sm:py-6"
            >
              <p className="font-display text-[0.95rem] font-medium text-ink">
                {item.title}
              </p>
              <p className="mt-1 font-serif text-[0.95rem] text-taupe">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Equal 2×2 collection grid — stable heights, no clipped rows.
 * Desktop fills viewport content area without max-height clipping.
 */
export function ShopByCollection() {
  return (
    <section className="border-b border-hairline bg-canvas section-y md:section-viewport">
      <div className="container-ns flex flex-col justify-center">
        <SectionLead
          eyebrow="Start here"
          title="Shop by collection"
          description={pageCopy.shopByCollection}
          action={
            <Button href="/collections" variant="ghost">
              All collections
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3 lg:gap-4">
          {collectionTiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="group relative aspect-[5/4] overflow-hidden bg-muted sm:aspect-[4/3] lg:aspect-[16/11]"
            >
              <Image
                src={tile.image}
                alt={tile.alt}
                fill
                loading="lazy"
                quality={80}
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 md:p-6">
                <span className="font-display text-[1.2rem] font-medium tracking-wide text-paper md:text-[1.35rem]">
                  {tile.title}
                </span>
                <span className="font-display text-[11px] uppercase tracking-[0.14em] text-paper/70 transition-colors group-hover:text-brass">
                  Shop
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
  const items = products.slice(0, 8);
  return (
    <section className="border-b border-hairline bg-muted/50 section-y md:section-viewport">
      <div className="container-ns flex flex-col justify-center">
        <SectionLead
          eyebrow="Most reached for"
          title="Bestsellers"
          description={pageCopy.bestsellers}
          action={
            <Button href="/collections/bestsellers" variant="ghost">
              View all
            </Button>
          }
        />
        <ProductCarousel products={items} showMeter />
      </div>
    </section>
  );
}

/**
 * House note: full-bleed image + readable paper panel (not floating left
 * text that competes with busy photography).
 */
export function HomePromoBanner() {
  return (
    <section className="border-b border-hairline bg-canvas">
      <div className="relative min-h-[min(72dvh,36rem)] md:min-h-[min(70dvh,40rem)]">
        <Image
          src={siteImages.storyBand}
          alt="Brass trays of citrus, rose, and wood notes"
          fill
          loading="lazy"
          quality={85}
          className="object-cover object-[center_40%]"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20 sm:via-black/40 sm:to-transparent"
          aria-hidden
        />
        <div className="container-ns relative z-10 flex min-h-[min(72dvh,36rem)] items-center py-14 md:min-h-[min(70dvh,40rem)] md:py-16">
          <div className="w-full max-w-xl bg-canvas/95 p-7 backdrop-blur-sm sm:p-9 md:p-10">
            <p className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
              House note
            </p>
            <h2 className="text-display-lg text-balance text-ink">
              Real pyramids. Real sillage. Less guessing on skin.
            </h2>
            <p className="mt-4 max-w-md text-pretty font-serif text-[1.1rem] leading-relaxed text-taupe">
              We list top, heart, and base plus wear data so you can match a
              bottle to heat, office air, or a late table.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/about">Read our story</Button>
              <Button href="/products" variant="secondary">
                Shop bottles
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Brand / house band: image + editorial column with note bands.
 * Avoid forced full-viewport clip on content.
 */
export function BrandStoryBand() {
  return (
    <section className="border-b border-hairline bg-canvas">
      <div className="grid lg:min-h-[min(85dvh,42rem)] lg:grid-cols-2">
        <div className="relative order-1 min-h-[min(48dvh,22rem)] w-full sm:min-h-[min(52dvh,26rem)] lg:min-h-full">
          <Image
            src={siteImages.about}
            alt="Hands composing perfume materials on a brass dish"
            fill
            loading="lazy"
            quality={85}
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        <div className="order-2 flex flex-col justify-center bg-muted/50">
          <div className="mx-auto flex w-full max-w-lg flex-col px-6 py-12 sm:px-10 sm:py-14 lg:mx-0 lg:max-w-none lg:px-12 lg:py-16 xl:px-16">
            <p className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
              The house
            </p>
            <h2 className="text-display-lg max-w-[18ch] text-balance text-ink">
              Composed like labels. Worn like daily architecture.
            </h2>
            <p className="mt-5 max-w-md text-pretty font-serif text-[1.1rem] leading-relaxed text-taupe">
              {pageCopy.brandStory}
            </p>

            <div className="mt-10 grid gap-0 sm:grid-cols-3 sm:gap-0">
              {[
                {
                  label: "Top",
                  notes: "Bergamot · Pink pepper",
                  hint: "First fifteen minutes",
                },
                {
                  label: "Heart",
                  notes: "Iris · Oud · Rose",
                  hint: "The body of the scent",
                },
                {
                  label: "Base",
                  notes: "Amber · Cedar · Musk",
                  hint: "What stays on fabric",
                },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className={cn(
                    "border-t border-hairline py-5 sm:border-t-0 sm:px-4 sm:py-0",
                    i === 0 && "sm:pl-0 sm:pr-5",
                    i === 1 && "sm:border-x sm:border-hairline sm:px-5",
                    i === 2 && "sm:pl-5 sm:pr-0",
                    i > 0 && "sm:border-t-0",
                  )}
                >
                  <p className="font-display text-[10px] font-medium uppercase tracking-[0.16em] text-ink/45">
                    {row.label}
                  </p>
                  <p className="mt-2 font-serif text-[1.05rem] leading-snug text-ink">
                    {row.notes}
                  </p>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-taupe">
                    {row.hint}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Button href="/about">Read our story</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FindYourScentTeaser() {
  return (
    <section className="relative min-h-[min(70dvh,34rem)] overflow-hidden border-b border-hairline md:min-h-[min(75dvh,38rem)]">
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
        className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20"
        aria-hidden
      />
      <div className="container-ns relative z-10 flex min-h-[min(70dvh,34rem)] flex-col justify-center py-14 md:min-h-[min(75dvh,38rem)]">
        <div className="max-w-lg">
          <SectionLead
            light
            eyebrow="Guided match"
            title="Find your scent"
            description={pageCopy.findYourScentHome}
            className="mb-0"
          />
          <div className="mt-8">
            <Button href="/find-your-scent">Start the guide</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection({
  items,
}: {
  items: TestimonialItem[];
}) {
  const shown = items.slice(0, 8);
  return (
    <section className="border-b border-hairline bg-canvas section-y md:section-viewport">
      <div className="container-ns flex flex-col justify-center">
        <SectionLead
          eyebrow="From wearers"
          title="Loved across cities"
          description={pageCopy.testimonials}
        />
        <TestimonialsCarousel items={shown.length ? shown : items} />
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
  if (!shown.length) return null;

  return (
    <section className="border-b border-hairline bg-muted/40 section-y">
      <div className="container-ns">
        <SectionLead
          eyebrow="Journal"
          title="Recent notes"
          action={
            <Button href="/journal" variant="ghost">
              Read more
            </Button>
          }
        />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {shown.map((post, i) => (
            <Link
              key={post.slug}
              href={`/journal/${post.slug}`}
              className="group flex flex-col"
            >
              <div
                className="relative mb-4 aspect-[16/10]"
                style={{ backgroundColor: post.imageTone || "#F3EDE3" }}
              >
                <span className="absolute left-3 top-3 font-mono text-[11px] text-ink/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-taupe">
                {post.date} · {post.readTime}
              </p>
              <h3 className="font-display text-[1.2rem] font-medium leading-snug text-ink transition-colors group-hover:text-brass">
                {post.title}
              </h3>
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

/**
 * Worn in the wild: equal columns, object-contain so full imagery is visible.
 */
export function UgcGrid() {
  const shots = siteImages.wornInWild;
  return (
    <section className="border-b border-hairline bg-canvas section-y">
      <div className="container-ns">
        <SectionLead
          eyebrow="In life"
          title="Worn in the wild"
          description={pageCopy.wornInWild}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {shots.map((src, i) => (
            <figure key={src} className="group">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                <Image
                  src={src}
                  alt={wornInWildAlts[i] ?? "Fragrance worn in everyday light"}
                  fill
                  loading="lazy"
                  quality={85}
                  className="object-contain p-2 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.02] sm:p-3"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <figcaption className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-taupe">
                {String(i + 1).padStart(2, "0")} · In wear
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
