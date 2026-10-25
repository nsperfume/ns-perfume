import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: "Gift Cards",
  description:
    "Digital NS Perfume gift cards are coming soon. Until then, give the Discovery Set or a gift set, or ask care to help you choose.",
  alternates: { canonical: "/gift-cards" },
};

/**
 * Informational until gift card codes can be issued and redeemed at checkout.
 * Nothing on this page adds to the bag.
 */
export default function GiftCardsPage() {
  return (
    <>
      <PageHero
        title={pageCopy.giftCards.title}
        description="Digital gift cards are on the way. Until then, a Discovery Set or gift set lets them find a scent that fits their climate and wardrobe."
        image={siteImages.giftCards}
        alt="NS Perfume gift card presentation with bottles in soft light"
        objectPosition="center 45%"
      />
      <section className="bg-canvas section-y">
        <div className="container-ns grid gap-12 lg:grid-cols-2">
          <div className="flex min-h-80 items-center justify-center rounded-lg border border-hairline bg-paper p-12">
            <div className="text-center">
              <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-brass">
                Coming soon
              </p>
              <h2 className="text-display-md mt-3">Digital Gift Cards</h2>
              <p className="mx-auto mt-4 max-w-sm font-serif text-body text-taupe">
                We are not selling gift cards yet. Check back soon, or choose
                one of the gifting options on this page.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-heading-sm text-ink">Gifting today</h2>
            <p className="mt-3 measure font-serif text-body text-taupe">
              The Discovery Set is the easy choice when you do not know their
              signature yet. Several formulas to wear for a few days each, so
              they can settle on a full bottle later. Gift sets pair discovery
              formats with signature bottles. You can add gift wrap and a short
              note on any product page.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/products/discovery-set-six">
                Shop the Discovery Set
              </Button>
              <Button href="/collections/gift-sets" variant="secondary">
                Browse gift sets
              </Button>
            </div>
            <p className="mt-8 font-serif text-body text-taupe">
              Buying for a team or an occasion?{" "}
              <Link
                href="/contact"
                className="text-brass underline-offset-4 hover:underline"
              >
                Contact care
              </Link>{" "}
              or call{" "}
              <a
                href={`tel:${siteConfig.phone}`}
                className="text-brass underline-offset-4 hover:underline"
              >
                {siteConfig.phone}
              </a>{" "}
              and we will help you choose.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
