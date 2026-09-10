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
        "flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-3",
        className ?? "mb-4 sm:mb-8 md:mb-10",
      )}
    >
      <div className="max-w-xl">
        <p
          className={cn(
            "mb-1.5 font-display text-[11px] font-medium uppercase tracking-[0.16em] sm:mb-2",
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
              "mt-1.5 text-pretty font-serif text-[0.95rem] leading-relaxed sm:mt-2 sm:text-[1.05rem]",
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
    <section className="section-hero relative -mt-chrome-height overflow-hidden border-b border-hairline">
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
        className="absolute inset-0 bg-linear-to-r from-black/70 via-black/45 to-black/15 sm:via-black/40 sm:to-transparent"
        aria-hidden
      />
      <div className="container-ns relative z-10 flex flex-1 flex-col justify-end pb-10 pt-[calc(var(--spacing-chrome-height)+1rem)] sm:justify-center sm:pb-16 sm:pt-[calc(var(--spacing-chrome-height)+1.5rem)] lg:pb-20">
        <div className="max-w-xl fade-up lg:max-w-2xl">
          <p className="mb-2 font-display text-[10px] font-medium uppercase tracking-[0.16em] text-paper/70 sm:mb-4 sm:text-[11px] sm:tracking-[0.18em]">
            NS Perfume
          </p>
          <h1 className="text-display-lg text-balance text-paper sm:text-display-xl">
            Written for heat, stillness, and the hours after work
          </h1>
          <p className="mt-3 max-w-lg text-pretty font-serif text-[0.98rem] leading-snug text-white/90 sm:mt-5 sm:text-body-lg sm:leading-relaxed">
            <span className="sm:hidden">
              Amber Noir opens with bergamot and pink pepper, then settles into
              oud and amber that stay close through dinner.
            </span>
            <span className="hidden sm:inline">{pageCopy.homeHero}</span>
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            <Button
              href="/products/amber-noir-edp"
              className="min-h-11 w-full justify-center py-2.5 sm:min-h-12 sm:w-auto"
            >
              Shop Amber Noir
            </Button>
            <Button
              href="/products"
              variant="secondary"
              className="min-h-11 w-full justify-center border-paper/75 bg-transparent py-2.5 text-paper hover:border-brass focus-visible:ring-offset-ink sm:min-h-12 sm:w-auto"
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
    <section className="border-b border-hairline bg-muted/60 section-y lg:section-viewport">
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
    <section className="border-b border-hairline bg-canvas py-10 sm:section-y lg:section-viewport">
      <div className="container-ns flex flex-col justify-center">
        <SectionLead
          eyebrow="Start here"
          title="Shop by collection"
          description={pageCopy.shopByCollection}
          action={
            <Button
              href="/collections"
              variant="ghost"
              className="min-h-0! px-0! py-1!"
            >
              All collections
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4">
          {collectionTiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="group relative aspect-4/5 overflow-hidden bg-muted sm:aspect-4/3 lg:aspect-16/11"
            >
              <Image
                src={tile.image}
                alt={tile.alt}
                fill
                loading="lazy"
                quality={80}
                className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 50vw"
              />
              <div
                className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/85"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:gap-3 sm:p-5 md:p-6">
                <span className="font-display text-[0.95rem] font-medium tracking-wide text-paper transition-transform duration-500 group-hover:-translate-y-0.5 sm:text-[1.2rem] md:text-[1.35rem]">
                  {tile.title}
                </span>
                <span className="hidden font-display text-[11px] uppercase tracking-[0.14em] text-paper/70 transition-colors duration-300 group-hover:text-brass min-[380px]:inline">
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
    <section className="border-b border-hairline bg-muted/50 py-8 sm:section-y lg:section-viewport">
      <div className="container-ns flex flex-col justify-center gap-0">
        <SectionLead
          className="mb-3 sm:mb-8 md:mb-10"
          eyebrow="Most reached for"
          title="Bestsellers"
          description={pageCopy.bestsellers}
          action={
            <Button
              href="/collections/bestsellers"
              variant="ghost"
              className="min-h-0! px-0! py-1!"
            >
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
          className="absolute inset-0 bg-linear-to-r from-black/75 via-black/45 to-black/20 sm:via-black/40 sm:to-transparent"
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

            <div className="mt-10 grid gap-0 lg:grid-cols-3 lg:gap-0">
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
                    "border-t border-hairline py-5 lg:border-t-0 lg:px-4 lg:py-0",
                    i === 0 && "lg:pl-0 lg:pr-5",
                    i === 1 && "lg:border-x lg:border-hairline lg:px-5",
                    i === 2 && "lg:pl-5 lg:pr-0",
                    i > 0 && "lg:border-t-0",
                  )}
                >
                  <p className="font-display text-[10px] font-medium uppercase tracking-[0.16em] text-ink/45">
                    {row.label}
                  </p>
                  <p className="mt-2 font-serif text-[1.05rem] leading-snug text-ink">
                    {row.notes}
                  </p>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-taupe">
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
        className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/20"
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
    <section className="border-b border-hairline bg-canvas section-y lg:section-viewport">
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
    <section className="border-b border-hairline bg-muted/40 section-y lg:section-viewport">
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

        <div className="grid gap-x-8 gap-y-5 lg:grid-cols-12 lg:items-stretch">
          <Link
            href={`/journal/${feature.slug}`}
            className="group relative order-1 aspect-16/11 overflow-hidden bg-muted lg:col-span-7 lg:row-start-1"
          >
            {feature.imageUrl ? (
              <Image
                src={feature.imageUrl}
                alt={`Cover for ${feature.title}`}
                fill
                loading="lazy"
                quality={85}
                className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
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
              className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-500 group-hover:from-black/70"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
              {feature.category ? (
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-paper/70">
                  {feature.category}
                </p>
              ) : null}
              <h3 className="font-display text-[1.35rem] font-medium leading-snug text-paper transition-transform duration-500 group-hover:-translate-y-0.5 md:text-[1.55rem]">
                {feature.title}
              </h3>
            </div>
          </Link>

          <div className="order-3 flex min-h-0 flex-col divide-y divide-hairline lg:order-0 lg:col-span-5 lg:row-start-1 lg:border-l lg:border-hairline lg:pl-8">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/journal/${post.slug}`}
                className="group grid min-h-0 flex-1 grid-cols-[5.5rem_1fr] items-center gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[7.5rem_1fr] sm:py-5"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {post.imageUrl ? (
                    <Image
                      src={post.imageUrl}
                      alt={`Cover for ${post.title}`}
                      fill
                      loading="lazy"
                      quality={80}
                      className="object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-110"
                      sizes="120px"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: post.imageTone || "#F3EDE3",
                      }}
                    />
                  )}
                  <div
                    className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/10"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-taupe">
                    {formatDate(post.date)} · {post.readTime}
                  </p>
                  <h3 className="font-display text-[1.05rem] font-medium leading-snug text-ink transition-colors duration-300 group-hover:text-brass sm:text-[1.15rem]">
                    {post.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 font-serif text-[0.95rem] text-taupe">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="order-2 lg:order-0 lg:col-span-7 lg:row-start-2">
            <Link
              href={`/journal/${feature.slug}`}
              className="group block max-w-xl"
            >
              <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-taupe">
                {formatDate(feature.date)} · {feature.readTime}
              </p>
              <p className="font-serif text-[1.05rem] leading-relaxed text-taupe">
                {feature.excerpt}
              </p>
              <span className="mt-4 inline-block font-display text-[12px] font-medium uppercase tracking-[0.12em] text-ink transition-colors duration-300 group-hover:text-brass">
                Read article
              </span>
            </Link>
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
