import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { FeaturePanel } from "@/components/commerce/feature-panel";
import { QuoteBlock } from "@/components/commerce/feature-panel";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import { testimonials } from "@/data/site";

export const metadata: Metadata = {
  title: "Our Story - NS Perfume",
  description: pageCopy.about.description,
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        title={pageCopy.about.title}
        description={pageCopy.about.description}
        image={siteImages.about}
        alt="NS Perfume atelier atmosphere for Our Story"
        objectPosition="center 42%"
      />

      <section className="bg-muted section-y">
        <div className="container-ns grid gap-6 lg:grid-cols-2">
          <FeaturePanel
            title="Formulas First"
            body="Each composition is structured as a real pyramid. Top materials introduce the scent. Heart materials define most of the wear. Bases linger. We name bergamot, iris butter, oud, and tonka because placeholder labels break trust."
          />
          <FeaturePanel
            title="Ivory, Charcoal, Brass"
            body="The storefront uses the Ivory and Brass system. Soft ivory canvas, warm white cards, warm charcoal type, one flat brass accent. No dark full-page bands. No glitter. Restraint is the signal."
            muted
          />
        </div>
      </section>

      <section id="sourcing" className="bg-canvas section-y">
        <div className="container-ns max-w-2xl">
          <h2 className="text-display-md mb-4">Ingredients And Sourcing</h2>
          <p className="measure text-body text-taupe">
            We work with registered fragrance houses and list core materials plus
            country of origin on every product page. Allergen disclosures required by
            labeling rules ship on the packing insert. Bottle photography is checked
            against ivory canvas before hero treatments lock.
          </p>
        </div>
      </section>

      <section id="press" className="border-t border-hairline bg-muted section-y">
        <div className="container-ns">
          <h2 className="text-display-md mb-8">Press</h2>
          <div className="grid gap-12 md:grid-cols-3">
            {testimonials.map((t) => (
              <QuoteBlock
                key={t.attribution}
                quote={t.quote}
                attribution={t.attribution}
              />
            ))}
          </div>
          <div className="mt-12">
            <Button href="/products">Explore The Line</Button>
          </div>
        </div>
      </section>
    </>
  );
}
