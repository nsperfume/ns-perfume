import type { Metadata } from "next";
import { PageHero } from "@/components/layout/page-hero";
import { FindYourScentGuide } from "@/components/commerce/find-your-scent-guide";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";

/** Plain copy kept here until src/data/copy.ts drops "No AI ranking" and similar wording. */
const HERO_DESCRIPTION =
  "Five short questions. Three perfumes picked for who will wear them, the scent you like and how long it should last.";

export const metadata: Metadata = {
  title: "Find your scent",
  description:
    "Answer five short questions and get three NS Perfume picks matched to who will wear it, the scent you like, the trail and how long it lasts.",
  alternates: { canonical: "/find-your-scent" },
};

export default function FindYourScentPage() {
  return (
    <>
      <PageHero
        title={pageCopy.findYourScent.title}
        description={HERO_DESCRIPTION}
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
        <div className="container-ns grid gap-10 lg:grid-cols-3 lg:gap-12">
          {[
            {
              title: "Five clear questions",
              body: "Who it is for, where you will wear it, the scent you like, the trail and how long it lasts. Each one matches details shown on the product page.",
            },
            {
              title: "Scored on real details",
              body: "Picks come from who it is for, the scent type, the trail, how long it lasts and its strength. You see the reasons beside each pick.",
            },
            {
              title: "Then try on skin",
              body: "Open the product page for notes and sizes. The guide is a shortlist, not a substitute for a full wear.",
            },
          ].map((item) => (
            <div key={item.title} className="border-t border-hairline pt-6">
              <h2 className="text-heading-sm text-ink">
                {item.title}
              </h2>
              <p className="mt-2 max-w-md text-body text-taupe">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
