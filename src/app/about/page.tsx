import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { FeaturePanel } from "@/components/commerce/feature-panel";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";

export const metadata: Metadata = {
  title: "Our Story",
  description: pageCopy.about.description,
  alternates: { canonical: "/about" },
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
        <div className="container-ns grid gap-6 lg:grid-cols-2 lg:gap-8">
          <FeaturePanel
            title="Formulas first"
            body="Each composition is structured as a real pyramid. Top materials introduce the scent. Heart materials define most of the wear. Bases linger. We name bergamot, iris butter, oud, and tonka because placeholder labels break trust."
          />
          <FeaturePanel
            title="Made for Pakistani weather"
            body="Summer heat lifts top notes off the skin fast, and humidity makes heavy bases louder. That is why every bottle carries a sillage rating for how far it travels and a longevity rating for how long it stays. Choose for a crowded office, an outdoor wedding in June, or a cool December evening, not only for the name on the label."
            muted
          />
        </div>
      </section>

      <section id="sourcing" className="bg-canvas section-y">
        <div className="container-ns max-w-2xl">
          <p className="mb-3 text-eyebrow text-taupe">Sourcing</p>
          <h2 className="mb-5 text-display-lg">Ingredients and sourcing</h2>
          <p className="text-body-lg text-taupe">
            We work with registered fragrance houses and list core materials plus
            country of origin on every product page. Allergen disclosures required by
            labeling rules ship on the packing insert. Every bottle is checked for
            authenticity before dispatch.
          </p>
          <div className="mt-10">
            <Button href="/products">Explore the line</Button>
          </div>
        </div>
      </section>
    </>
  );
}
