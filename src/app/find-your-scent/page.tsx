"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/commerce/product-card";
import { PageHero } from "@/components/layout/page-hero";
import { pageCopy } from "@/data/copy";
import { siteImages } from "@/data/images";
import type { StoreProduct } from "@/lib/mappers";

const steps = [
  {
    id: "mood",
    question: "What kind of day are you dressing for?",
    options: [
      { id: "bright", label: "Bright mornings" },
      { id: "soft", label: "Soft daytime polish" },
      { id: "evening", label: "Long evenings" },
      { id: "daily", label: "Reliable daily wear" },
    ],
  },
  {
    id: "family",
    question: "Which scent family feels right?",
    options: [
      { id: "fresh", label: "Fresh & Citrus" },
      { id: "floral", label: "Floral" },
      { id: "woody", label: "Woody" },
      { id: "oriental", label: "Oriental & Amber" },
      { id: "gourmand", label: "Gourmand" },
    ],
  },
  {
    id: "trail",
    question: "How strong should the trail be?",
    options: [
      { id: "soft", label: "Soft, Intimate" },
      { id: "moderate", label: "Moderate, Present" },
      { id: "strong", label: "Strong, Fills A Room" },
    ],
  },
] as const;

function rankProducts(
  catalog: StoreProduct[],
  answers: Record<string, string>,
): StoreProduct[] {
  return [...catalog]
    .map((p) => {
      let score = 0;
      const family = answers.family;
      if (family && p.family === family) score += 3;
      const trail = answers.trail;
      if (trail === "soft" && p.sillage <= 2) score += 2;
      if (trail === "moderate" && p.sillage === 3) score += 2;
      if (trail === "strong" && p.sillage >= 4) score += 2;
      const mood = answers.mood;
      if (mood === "bright" && p.family === "fresh") score += 2;
      if (mood === "soft" && (p.family === "floral" || p.family === "fresh"))
        score += 2;
      if (
        mood === "evening" &&
        (p.family === "oriental" || p.family === "gourmand")
      )
        score += 2;
      if (mood === "daily" && p.concentration === "EDT") score += 1;
      if (p.handle === "discovery-set-six") score += 1;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.p);
}

export default function FindYourScentPage() {
  const [catalog, setCatalog] = useState<StoreProduct[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setCatalog(j.data);
      })
      .catch(() => {});
  }, []);

  const recommendations = useMemo(
    () => (done ? rankProducts(catalog, answers) : []),
    [done, answers, catalog],
  );

  const current = steps[step];

  return (
    <>
      <PageHero
        title={pageCopy.findYourScent.title}
        description={pageCopy.findYourScent.description}
        image={siteImages.findYourScent}
        alt="Fragrance bottles arranged as paths for finding your scent"
        objectPosition="center 42%"
      />

      <section className="bg-canvas section-y">
        <div className="container-ns max-w-2xl">
          {!done ? (
            <>
              <p className="mb-2 font-mono text-caption text-taupe">
                Step {step + 1} of {steps.length}
              </p>
              <h2 className="text-display-md mb-6">{current.question}</h2>
              <ul className="flex flex-col gap-3">
                {current.options.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      className="w-full min-h-12 cursor-pointer border border-hairline bg-paper px-4 py-3 text-left font-serif text-body text-ink transition-colors hover:border-ink/30 hover:bg-muted"
                      onClick={() => {
                        const next = { ...answers, [current.id]: opt.id };
                        setAnswers(next);
                        if (step < steps.length - 1) setStep(step + 1);
                        else setDone(true);
                      }}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2 className="text-display-md mb-2">Your Starting Three</h2>
              <p className="mb-8 text-body text-taupe">
                Based on your answers. Open a product page to compare notes and
                sizes.
              </p>
              {recommendations.length ? (
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                  {recommendations.map((p) => (
                    <ProductCard key={p.handle} product={p} showMeter />
                  ))}
                </div>
              ) : (
                <p className="mb-8 text-body text-taupe">
                  Load products from the catalog, then run the guide again.
                </p>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  setStep(0);
                  setAnswers({});
                  setDone(false);
                }}
              >
                Start Over
              </Button>
            </>
          )}
        </div>
      </section>
    </>
  );
}
