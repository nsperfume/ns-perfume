import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { faqItems } from "@/data/site";
import { OpenFromHash } from "@/components/faq/open-from-hash";
import { fillCheckoutCopy } from "@/lib/checkout-config";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "FAQ on shipping, notes, authenticity",
  description:
    "Answers on shipping, returns, authenticity, ingredients, concentration, and how to store perfume.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  // Shipping answers quote the live rates from Admin > Settings.
  const { checkout } = await getSiteSettings();
  const items = faqItems.map((item) => ({ ...item, answer: fillCheckoutCopy(item.answer, checkout) }));
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className="bg-canvas section-y">
      <JsonLd data={faqLd} />
      <div className="container-ns max-w-[52rem]">
        <p className="mb-3 text-eyebrow text-taupe">Help</p>
        <h1 className="mb-5 text-display-xl">Frequently asked questions</h1>
        <p className="mb-12 max-w-[38rem] text-body-lg text-taupe md:mb-16">
          Delivery, returns, authenticity, ingredients and how concentration changes the way a perfume wears.
        </p>
        <OpenFromHash />
        <div className="flex flex-col border-t border-hairline">
          {items.map((item) => (
            <details
              key={item.question}
              id={item.id}
              className="group scroll-mt-[calc(var(--spacing-chrome-height)+1rem)] border-b border-hairline"
            >
              <summary className="flex min-h-16 cursor-pointer list-none items-center py-5 text-heading-sm marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex w-full items-center justify-between gap-6">
                  {item.question}
                  <span className="text-2xl font-light leading-none text-brass-ink group-open:hidden" aria-hidden>+</span>
                  <span className="hidden text-2xl font-light leading-none text-brass-ink group-open:inline" aria-hidden>
                    −
                  </span>
                </span>
              </summary>
              <p className="max-w-[44rem] pb-7 text-body-lg text-taupe">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
