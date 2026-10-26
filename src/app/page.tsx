import type { Metadata } from "next";
import {
  HomeHero,
  HomeTrustSection,
  ShopByCollection,
  BestsellersSection,
  BrandStoryBand,
  FindYourScentTeaser,
  TestimonialsSection,
  JournalPreview,
} from "@/components/home/sections";
import { PerfumeMarquee } from "@/components/home/perfume-marquee";
import { WornInWild } from "@/components/home/worn-in-wild";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getBestsellers,
  getJournalPosts,
  getStoreProducts,
  getTestimonials,
} from "@/lib/store-data";
import { siteConfig, socialLinks } from "@/data/site";
import { getSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const [products, { checkout }] = await Promise.all([getStoreProducts(), getSiteSettings()]);
  const prices = products.flatMap((p) => p.prices.map((s) => s.price)).filter((n) => n > 0);
  const from = prices.length ? `From Rs ${Math.min(...prices).toLocaleString("en-US")}. ` : "";
  const free =
    checkout.freeShippingThresholdPkr > 0
      ? ` Free delivery over Rs ${checkout.freeShippingThresholdPkr.toLocaleString("en-US")}.`
      : "";
  return {
    title: { absolute: `${siteConfig.name} | Long Lasting Perfumes in Pakistan` },
    description: `Shop long lasting perfumes for men and women in Pakistan. ${from}Cash on delivery nationwide.${free}`,
    alternates: { canonical: "/" },
  };
}

/** Cached for speed; admin edits refresh it at once via revalidateStorefront(). */
export const revalidate = 300;

export default async function HomePage() {
  const [bestsellers, products, testimonials, posts, { checkout }] = await Promise.all([
    getBestsellers(),
    getStoreProducts(),
    getTestimonials(),
    getJournalPosts(),
    getSiteSettings(),
  ]);
  const freeDeliveryLine =
    checkout.freeShippingThresholdPkr > 0 && checkout.shipping.standard.enabled
      ? `Standard delivery is free on orders over Rs ${checkout.freeShippingThresholdPkr.toLocaleString("en-US")}. You see the delivery cost before you place the order.`
      : "You see the delivery cost before you place the order, with no surprises at the door.";

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/ns-perfume-logo.svg`,
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: `+92${siteConfig.phone.replace(/^0/, "")}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Qila Didar Singh",
      addressRegion: "Punjab",
      addressCountry: "PK",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: `+92${siteConfig.phone.replace(/^0/, "")}`,
      email: siteConfig.email,
      areaServed: "PK",
      availableLanguage: ["en", "ur"],
    },
    sameAs: socialLinks.map((s) => s.href),
  };
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: "en-PK",
  };

  const bestsellerList =
    bestsellers.length >= 4
      ? bestsellers
      : [...bestsellers, ...products].filter(
          (p, i, arr) => arr.findIndex((x) => x.handle === p.handle) === i,
        );

  return (
    <>
      <JsonLd data={[orgLd, websiteLd]} />
      <HomeHero />
      <PerfumeMarquee />
      <ShopByCollection />
      <BestsellersSection products={bestsellerList} />
      <HomeTrustSection freeDeliveryLine={freeDeliveryLine} />
      <BrandStoryBand />
      <FindYourScentTeaser />
      <TestimonialsSection
        items={testimonials.map((t) => ({
          author: t.author,
          city: "city" in t ? (t as { city?: string }).city : undefined,
          quote: t.quote,
          productName:
            "productName" in t
              ? (t as { productName?: string }).productName
              : undefined,
          rating: "rating" in t ? (t as { rating?: number }).rating : undefined,
        }))}
      />
      <JournalPreview
        posts={posts.map((p) => ({
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          date: p.date,
          readTime: p.readTime,
          category: p.category,
          imageUrl: p.imageUrl,
          imageTone: p.imageTone,
        }))}
      />
      <WornInWild />
    </>
  );
}
