"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/commerce/product-card";
import { PerformanceMeter } from "@/components/commerce/performance-meter";
import {
  SCENT_GUIDE_STEPS,
  rankScentMatches,
  summarizeAnswers,
  type ScentGuideAnswers,
} from "@/lib/scent-guide";
import type { StoreProduct } from "@/lib/mappers";
import { cn } from "@/lib/cn";
import { formatSize } from "@/lib/format";

export function FindYourScentGuide() {
  const [catalog, setCatalog] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<ScentGuideAnswers>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) setCatalog(j.data as StoreProduct[]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const matches = useMemo(
    () => (done ? rankScentMatches(catalog, answers, 3) : []),
    [done, answers, catalog],
  );

  const current = SCENT_GUIDE_STEPS[step];
  const progress = done
    ? 100
    : Math.round(((step + (answers[current.id] ? 0.35 : 0)) / SCENT_GUIDE_STEPS.length) * 100);
  const answerSummary = summarizeAnswers(answers);

  function choose(optionId: string) {
    const next = { ...answers, [current.id]: optionId };
    setAnswers(next);
    if (step < SCENT_GUIDE_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  }

  function goBack() {
    if (done) {
      setDone(false);
      setStep(SCENT_GUIDE_STEPS.length - 1);
      return;
    }
    if (step === 0) return;
    setStep(step - 1);
  }

  function restart() {
    setStep(0);
    setAnswers({});
    setDone(false);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.7fr)] lg:items-start lg:gap-14">
      <div className="min-w-0">
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-taupe">
              {done
                ? "Your matches"
                : `Question ${step + 1} of ${SCENT_GUIDE_STEPS.length}`}
            </p>
            <p className="font-mono text-[11px] tabular-nums text-taupe">
              {Math.min(100, progress)}%
            </p>
          </div>
          <div
            className="h-1 w-full overflow-hidden bg-hairline"
            role="progressbar"
            aria-valuenow={Math.min(100, progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Guide progress"
          >
            <div
              className="h-full bg-ink transition-[width] duration-500 ease-out"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {!done ? (
          <>
            <h2 className="text-display-md text-balance">{current.question}</h2>
            <p className="mt-3 max-w-xl font-serif text-[1.05rem] leading-relaxed text-taupe">
              {current.help}
            </p>

            <ul className="mt-8 flex flex-col gap-3">
              {current.options.map((opt) => {
                const selected = answers[current.id] === opt.id;
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => choose(opt.id)}
                      className={cn(
                        "group flex w-full cursor-pointer items-start gap-4 border px-4 py-4 text-left transition-colors sm:px-5 sm:py-5",
                        selected
                          ? "border-ink bg-ink text-paper"
                          : "border-hairline bg-paper text-ink hover:border-ink/35 hover:bg-muted/60",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border transition-colors",
                          selected
                            ? "border-brass bg-brass"
                            : "border-taupe/50 group-hover:border-ink",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block font-display text-[1.05rem] font-medium tracking-wide sm:text-[1.125rem]">
                          {opt.label}
                        </span>
                        <span
                          className={cn(
                            "mt-1 block font-serif text-[0.98rem] leading-snug",
                            selected ? "text-paper/75" : "text-taupe",
                          )}
                        >
                          {opt.hint}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="w-auto!"
                disabled={step === 0}
                onClick={goBack}
              >
                Back
              </Button>
              {answers[current.id] ? (
                <Button
                  type="button"
                  className="w-auto!"
                  onClick={() => {
                    if (step < SCENT_GUIDE_STEPS.length - 1) setStep(step + 1);
                    else setDone(true);
                  }}
                >
                  {step < SCENT_GUIDE_STEPS.length - 1
                    ? "Continue"
                    : "See matches"}
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-display-md">Three bottles to try first</h2>
            <p className="mt-3 max-w-xl font-serif text-[1.05rem] leading-relaxed text-taupe">
              Ranked from your answers against real catalog fields: gender,
              family, sillage, longevity, and concentration. No generated copy
              and no black-box model.
            </p>

            {loading ? (
              <p className="mt-8 font-serif text-taupe">Loading the line…</p>
            ) : matches.length === 0 ? (
              <p className="mt-8 font-serif text-taupe">
                No bottles matched closely enough. Soften a filter by starting
                again, or browse the full shop.
              </p>
            ) : (
              <ol className="mt-10 space-y-10">
                {matches.map((match, index) => {
                  const p = match.product;
                  const price = p.prices[0];
                  return (
                    <li
                      key={p.handle}
                      className="border-t border-hairline pt-8 first:border-t-0 first:pt-0"
                    >
                      <div className="grid gap-6 md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
                        <div className="max-w-52">
                          <ProductCard product={p} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-ink px-2.5 py-1 font-display text-[10px] font-medium uppercase tracking-[0.14em] text-paper">
                              {match.rankLabel}
                            </span>
                            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-taupe">
                              Match {index + 1} of {matches.length}
                            </span>
                          </div>
                          <h3 className="mt-3 font-display text-[1.45rem] font-medium text-ink">
                            <Link
                              href={`/products/${p.handle}`}
                              className="transition-colors hover:text-brass"
                            >
                              {p.name}
                            </Link>
                          </h3>
                          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-taupe">
                            {p.concentration}
                            {price?.ml ? ` · ${formatSize(price.ml)}` : ""}
                            {` · ${p.family}`}
                          </p>
                          <p className="mt-3 max-w-xl font-serif text-[1.05rem] leading-relaxed text-ink/80">
                            {p.descriptor}
                          </p>

                          <div className="mt-5">
                            <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
                              Why this bottle
                            </p>
                            <ul className="space-y-1.5">
                              {match.reasons.map((reason) => (
                                <li
                                  key={reason}
                                  className="flex gap-2 font-serif text-[1rem] text-ink/85"
                                >
                                  <span
                                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brass"
                                    aria-hidden
                                  />
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-6 max-w-md">
                            <PerformanceMeter
                              sillage={p.sillage}
                              longevity={p.longevity}
                              compact
                            />
                          </div>

                          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
                            <Button
                              href={`/products/${p.handle}`}
                              className="w-full! justify-center sm:w-auto!"
                            >
                              View {p.name}
                            </Button>
                            <Button
                              href={`/collections/${encodeURIComponent(p.family)}`}
                              variant="secondary"
                              className="w-full! justify-center sm:w-auto!"
                            >
                              More {p.family}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="mt-12 flex flex-wrap gap-3 border-t border-hairline pt-8">
              <Button
                type="button"
                variant="secondary"
                className="w-auto!"
                onClick={restart}
              >
                Start over
              </Button>
              <Button href="/products" variant="secondary" className="w-auto!">
                Shop all bottles
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-auto!"
                onClick={goBack}
              >
                Change last answer
              </Button>
            </div>
          </>
        )}
      </div>

      <aside className="border border-hairline bg-muted/40 p-5 sm:p-6 lg:sticky lg:top-[calc(var(--spacing-chrome-height)+1.25rem)]">
        <p className="font-display text-[11px] font-medium uppercase tracking-[0.16em] text-taupe">
          How matching works
        </p>
        <p className="mt-3 font-serif text-[1.05rem] leading-relaxed text-ink/85">
          Each answer scores bottles already in the catalog. We use gender,
          scent family, sillage, longevity, and concentration. Sets and
          discovery kits are left out so you get single bottles first.
        </p>
        <ul className="mt-5 space-y-2 border-t border-hairline pt-5">
          {[
            "No AI text or mystery ranking",
            "Built for Pakistani heat and AC rooms",
            "Reasons shown next to every match",
          ].map((line) => (
            <li
              key={line}
              className="flex gap-2 font-serif text-[0.98rem] text-taupe"
            >
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink/40" />
              {line}
            </li>
          ))}
        </ul>

        {answerSummary.length ? (
          <div className="mt-6 border-t border-hairline pt-5">
            <p className="font-display text-[11px] font-medium uppercase tracking-[0.14em] text-taupe">
              Your path
            </p>
            <ol className="mt-3 space-y-2">
              {answerSummary.map((line, i) => (
                <li
                  key={`${line}-${i}`}
                  className="font-serif text-[0.98rem] text-ink"
                >
                  <span className="font-mono text-[10px] text-taupe">
                    {String(i + 1).padStart(2, "0")}
                  </span>{" "}
                  {line}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="mt-6 border-t border-hairline pt-5 font-serif text-[0.98rem] text-taupe">
            Your choices will collect here as you move through the guide.
          </p>
        )}
      </aside>
    </div>
  );
}
