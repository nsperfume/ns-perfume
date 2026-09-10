import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { FindYourScentGuide } from "@/components/commerce/find-your-scent-guide";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";

export const metadata: Metadata = {
  title: "Find Your Scent",
  description: pageCopy.findYourScent.metaDescription,
  alternates: { canonical: "/find-your-scent" },
};

export default function FindYourScentPage() {
  return (
    <>
      <PageHero
        title={pageCopy.findYourScent.title}
        description={pageCopy.findYourScent.description}
        image={siteImages.findYourScent}
        alt="Fragrance bottles arranged as paths for finding your scent"
        objectPosition="center 42%"
      />

      <section className="border-b border-hairline bg-canvas section-y">
        <div className="container-ns">
          <FindYourScentGuide />
        </div>
      </section>

      <section className="bg-paper section-y">
        <div className="container-ns grid gap-8 lg:grid-cols-3 lg:gap-10">
          {[
            {
              title: "Five clear questions",
              body: "Wearer, climate, family, trail, and stay time. Each maps to a field already on the bottle page.",
            },
            {
              title: "Scored on the catalog",
              body: "Matches come from gender, family, sillage, longevity, and concentration. You see the reasons beside each pick.",
            },
            {
              title: "Then try on skin",
              body: "Open the product page for notes and sizes. The guide is a shortlist, not a substitute for a full wear.",
            },
          ].map((item) => (
            <div key={item.title} className="border-t border-hairline pt-5">
              <h2 className="font-display text-[1.05rem] font-medium text-ink">
                {item.title}
              </h2>
              <p className="mt-2 font-serif text-[1.05rem] leading-relaxed text-taupe">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
