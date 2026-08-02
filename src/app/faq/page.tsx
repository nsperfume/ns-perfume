import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { faqItems } from "@/data/site";

export const metadata: Metadata = {
  title: "FAQ on shipping, notes, authenticity",
  description:
    "Answers on shipping, returns, authenticity, ingredients, concentration, and how to store perfume.",
};

export default function FaqPage() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
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
      <div className="container-ns max-w-2xl">
        <h1 className="text-display-lg mb-4">FAQ</h1>
        <p className="measure mb-12 text-body text-taupe">
          Shipping, ingredients, authenticity, and how concentration shapes wear.
        </p>
        <div className="flex flex-col gap-6" id="concentration">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group border-b border-hairline pb-6"
            >
              <summary className="cursor-pointer list-none text-heading-sm marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="text-eyebrow text-brass group-open:hidden">+</span>
                  <span className="hidden text-eyebrow text-brass group-open:inline">
                    −
                  </span>
                </span>
              </summary>
              <p className="mt-4 measure text-body text-taupe">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
