import type { Metadata } from "next";
import {
  HomeHero,
  HomeTrustSection,
  ShopByCollection,
  BestsellersSection,
  HomePromoBanner,
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
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "Perfume for heat, stillness, and evening",
  description:
    "NS Perfume with honest note pyramids and sillage ratings. Shop bottles you can match to work, heat, and the hours after dinner.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [bestsellers, products, testimonials, posts] = await Promise.all([
    getBestsellers(),
    getStoreProducts(),
    getTestimonials(),
    getJournalPosts(),
  ]);

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  };

  const bestsellerList =
    bestsellers.length >= 4
      ? bestsellers
      : [...bestsellers, ...products].filter(
          (p, i, arr) => arr.findIndex((x) => x.handle === p.handle) === i,
        );

  return (
    <>
      <JsonLd data={orgLd} />
      <HomeHero />
      <PerfumeMarquee />
      <ShopByCollection />
      <BestsellersSection products={bestsellerList} />
      <HomeTrustSection />
      <HomePromoBanner />
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
