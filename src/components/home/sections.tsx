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
import { siteImages } from "@/data/images";
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

const trustPromises = [
  {
    title: "Cash on delivery",
    body: "In major cities you can pay when the parcel is in your hands. No card required at checkout if COD is offered for your address. The courier confirms the amount before you hand over cash.",
  },
  {
    title: "Free shipping",
    body: "Orders over Rs 8,000 ship on complimentary standard delivery where we operate. Threshold and timing show at checkout so you know the cost before you place the order.",
  },
  {
    title: "Track anytime",
    body: "After you order, open the track page with your order number. You get status updates and a map view while the parcel moves, without waiting on a phone queue.",
  },
  {
    title: "Packed for transit",
    body: "Bottles leave in fitted inserts so glass is less likely to shift in heat or rough handling. Outer cartons stay plain for privacy when someone else receives the box.",
  },
  {
    title: "Returns on sealed bottles",
    body: "Unopened bottles in original packaging may be returned within 30 days. If something arrives damaged, write to care with your order number and photos of the parcel.",
  },
  {
    title: "Honest wear notes",
    body: "Each product lists top, heart, and base plus sillage and longevity so you can match a bottle to office air, outdoor heat, or a late table before you buy.",
  },
] as const;

/**
 * Full trust band — shipping, payment, and aftercare with real detail.
 * Lives below the fold so the hero stays one clear composition.
 */
export function HomeTrustSection() {
  return (
    <section className="border-b border-hairline bg-muted/60 section-y md:section-viewport">
      <div className="container-ns flex flex-col justify-center">
        <SectionLead
          eyebrow="Ordering with us"
          title="Payment, shipping, and what happens after"
          description="Clear terms for cash on delivery, free shipping thresholds, tracking, and returns. Read the full story once, then shop without guessing."
        />

        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-12">
          {trustPromises.map((item, index) => (
            <li key={item.title} className="border-t border-hairline pt-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-taupe">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 font-display text-[1.15rem] font-medium tracking-wide text-ink md:text-[1.25rem]">
                {item.title}
              </h3>
              <p className="mt-3 max-w-sm font-serif text-[1.05rem] leading-relaxed text-taupe">
                {item.body}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-3 sm:mt-12">
          <Button href="/shipping-returns">Shipping and returns</Button>
          <Button href="/track-order" variant="secondary">
            Track an order
          </Button>
        </div>
      </div>
    </section>
  );
}

/** @deprecated Prefer HomeTrustSection */
export const HomeTrustBanner = HomeTrustSection;

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
    category?: string;
    imageUrl?: string;
    imageTone?: string;
  }[];
}) {
  const shown = posts.slice(0, 4);
  if (!shown.length) return null;

  function formatDate(value: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const [feature, ...rest] = shown;

  return (
    <section className="border-b border-hairline bg-muted/40 section-y md:section-viewport">
      <div className="container-ns flex flex-col justify-center">
        <SectionLead
          eyebrow="Journal"
          title="Recent notes"
          description="Guides on heat, office wear, notes, and gifting. Written for how perfume actually sits on skin."
          action={
            <Button href="/journal" variant="secondary">
              Read the journal
            </Button>
          }
        />

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-8">
          <Link
            href={`/journal/${feature.slug}`}
            className="group flex flex-col lg:col-span-7"
          >
            <div className="relative mb-5 aspect-[16/11] overflow-hidden bg-muted">
              {feature.imageUrl ? (
                <Image
                  src={feature.imageUrl}
                  alt={`Cover for ${feature.title}`}
                  fill
                  loading="lazy"
                  quality={85}
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: feature.imageTone || "#F3EDE3",
                  }}
                />
              )}
              <div
                className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent opacity-80"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                {feature.category ? (
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper/70">
                    {feature.category}
                  </p>
                ) : null}
                <h3 className="font-display text-[1.35rem] font-medium leading-snug text-paper md:text-[1.55rem]">
                  {feature.title}
                </h3>
              </div>
            </div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.1em] text-taupe">
              {formatDate(feature.date)} · {feature.readTime}
            </p>
            <p className="max-w-xl font-serif text-[1.05rem] leading-relaxed text-taupe">
              {feature.excerpt}
            </p>
            <span className="mt-4 font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink transition-colors group-hover:text-brass">
              Read article
            </span>
          </Link>

          <div className="flex flex-col divide-y divide-hairline lg:col-span-5 lg:border-l lg:border-hairline lg:pl-8">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/journal/${post.slug}`}
                className="group grid grid-cols-[5.5rem_1fr] gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[7rem_1fr] sm:py-6"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt={`Cover for ${post.title}`}
                      fill
                      loading="lazy"
                      quality={80}
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                      sizes="112px"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: post.imageTone || "#F3EDE3",
                      }}
                    />
                  )}
                </div>
                <div className="min-w-0 self-center">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-taupe">
                    {formatDate(post.date)} · {post.readTime}
                  </p>
                  <h3 className="font-display text-[1.05rem] font-medium leading-snug text-ink transition-colors group-hover:text-brass sm:text-[1.15rem]">
                    {post.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 font-serif text-[0.95rem] text-taupe">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Worn in the wild — see `@/components/home/worn-in-wild`.
 */
export { WornInWild as UgcGrid } from "@/components/home/worn-in-wild";
