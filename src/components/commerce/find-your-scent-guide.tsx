"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PerformanceMeter } from "@/components/commerce/performance-meter";
import { Price } from "@/components/commerce/price";
import {
  SCENT_GUIDE_STEPS,
  familyLabel,
  rankScentMatches,
  summarizeAnswers,
  type ScentGuideAnswers,
} from "@/lib/scent-guide";
import { fetchSearchCatalog, type SearchProduct } from "@/lib/search";
import { useCart } from "@/context/cart";
import { useUi } from "@/context/ui";
import { cn } from "@/lib/cn";
import { BrandLoader } from "@/components/brand/brand-loader";

export function FindYourScentGuide() {
  const { addItem } = useCart();
  const { showToast } = useUi();
  const [catalog, setCatalog] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<ScentGuideAnswers>({});
  const [done, setDone] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  /** Only move focus after the shopper has answered, never on first load. */
  const interacted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchSearchCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Each step: bring the progress bar and question back into view (phones scroll
  // past it while reading options) and move focus to the new heading.
  useEffect(() => {
    if (!interacted.current) return;
    const top = topRef.current;
    const heading = headingRef.current;
    if (!top || !heading) return;
    const chrome = document.querySelector("[data-site-chrome]");
    const chromeBottom = chrome ? chrome.getBoundingClientRect().bottom : 0;
    const headingTop = heading.getBoundingClientRect().top;
    if (headingTop < chromeBottom + 8 || headingTop > window.innerHeight * 0.6) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      top.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    }
    heading.focus({ preventScroll: true });
  }, [step, done]);

  const results = useMemo(
    () => (done ? rankScentMatches(catalog, answers, 3) : { matches: [], note: null }),
    [done, answers, catalog],
  );
  const matches = results.matches;

  const current = SCENT_GUIDE_STEPS[step];
  const progress = done
    ? 100
    : Math.round(((step + (answers[current.id] ? 0.35 : 0)) / SCENT_GUIDE_STEPS.length) * 100);
  const answerSummary = summarizeAnswers(answers);

  function goTo(nextStep: number, nextDone = false) {
    interacted.current = true;
    setStep(nextStep);
    setDone(nextDone);
  }

  function choose(optionId: string) {
    setAnswers({ ...answers, [current.id]: optionId });
    if (step < SCENT_GUIDE_STEPS.length - 1) goTo(step + 1);
    else goTo(step, true);
  }

  function goBack() {
    if (done) {
      goTo(SCENT_GUIDE_STEPS.length - 1);
      return;
    }
    if (step === 0) return;
    goTo(step - 1);
  }

  function restart() {
    setAnswers({});
    goTo(0);
  }

  function addToCart(p: SearchProduct) {
    const size = p.prices[0];
    if (!size) return;
    addItem({
      productHandle: p.handle,
      name: p.name,
      sizeMl: size.ml,
      price: size.price,
      sku: size.sku,
      image: p.imagePrimary,
    });
    showToast(`${p.name} added to your cart`, "cart");
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.7fr)] lg:items-start lg:gap-14">
      <div className="min-w-0">
        <div
          ref={topRef}
          className="mb-8 scroll-mt-[calc(var(--spacing-chrome-height)+1rem)]"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-eyebrow text-taupe">
              {done
                ? "Your matches"
                : `Question ${step + 1} of ${SCENT_GUIDE_STEPS.length}`}
            </p>
            <p className="font-sans tabular-nums text-sm text-taupe">
              {Math.min(100, progress)}%
            </p>
          </div>
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-hairline"
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
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-display-md text-balance outline-none"
            >
              {current.question}
            </h2>
            <p className="mt-4 max-w-[36rem] text-body-lg text-taupe">
              {current.help}
            </p>

            <ul className="mt-8 flex flex-col gap-3">
              {current.options.map((opt) => {
                const selected = answers[current.id] === opt.id;
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => choose(opt.id)}
                      className={cn(
                        "group flex w-full cursor-pointer items-start gap-4 rounded-xl border px-5 py-4 text-left transition-colors sm:px-6 sm:py-5",
                        selected
                          ? "border-ink bg-ink text-paper"
                          : "border-[#d6cfbf] bg-paper text-ink hover:border-ink/50 hover:bg-muted/60",
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
                        <span className="block font-sans text-lg font-semibold leading-snug">
                          {opt.label}
                        </span>
                        <span
                          className={cn(
                            "mt-1 block text-body-sm",
                            selected ? "text-paper/80" : "text-taupe",
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
                    if (step < SCENT_GUIDE_STEPS.length - 1) goTo(step + 1);
                    else goTo(step, true);
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
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-display-md outline-none"
            >
              Three perfumes to try first
            </h2>
            <p className="mt-4 max-w-[36rem] text-body-lg text-taupe">
              Picked from your answers on who it is for, the scent you like, the
              trail and how long it lasts. The reasons are listed under each
              perfume.
            </p>

            {loading ? (
              <div className="mt-8 flex justify-center">
                <BrandLoader size={72} label="Finding your matches" />
              </div>
            ) : matches.length === 0 ? (
              <p className="mt-8 text-body text-taupe">
                No perfumes matched closely enough. Start again with a softer
                choice, or shop all perfumes.
              </p>
            ) : (
              <>
                {results.note ? (
                  <p
                    role="status"
                    className="mt-8 border-l-2 border-brass bg-paper px-4 py-3 text-body text-ink"
                  >
                    {results.note}
                  </p>
                ) : null}
                <ol className="mt-10 space-y-10">
                  {matches.map((match, index) => {
                    const p = match.product;
                    const size = p.prices[0];
                    const family = familyLabel(p.family);
                    const href = `/products/${p.handle}`;
                    return (
                      <li
                        key={p.handle}
                        className="border-t border-hairline pt-8 first:border-t-0 first:pt-0"
                      >
                        <div className="grid gap-6 md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
                          {/* Photo only: the name sits once, beside it. */}
                          <Link
                            href={href}
                            tabIndex={-1}
                            aria-hidden
                            className="group relative block aspect-4/5 w-full max-w-44 overflow-hidden bg-muted md:max-w-52"
                          >
                            <Image
                              src={p.imagePrimary}
                              alt=""
                              fill
                              loading="lazy"
                              quality={80}
                              sizes="(max-width: 768px) 11rem, 13rem"
                              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                          </Link>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-ink px-2.5 py-1 text-eyebrow text-paper">
                                {match.rankLabel}
                              </span>
                              <span className="text-caption text-taupe">
                                Match <span className="font-sans tabular-nums">{index + 1}</span> of{" "}
                                <span className="font-sans tabular-nums">{matches.length}</span>
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                              <h3 className="text-display-sm text-ink">
                                <Link
                                  href={href}
                                  className="transition-colors hover:text-brass-ink"
                                >
                                  {p.name}
                                </Link>
                              </h3>
                              {size ? (
                                <Price amountPkr={size.price} className="text-lg" />
                              ) : null}
                            </div>
                            <p className="mt-2 font-sans tabular-nums text-xs text-taupe">
                              {p.concentration}
                              {size?.ml ? ` · ${size.ml} ml` : ""}
                              {` · ${family}`}
                            </p>
                            <p className="mt-3 max-w-xl text-body text-ink/80">
                              {p.descriptor}
                            </p>

                            <div className="mt-5">
                              <p className="mb-2 text-eyebrow text-taupe">
                                Why this perfume
                              </p>
                              <ul className="space-y-1.5">
                                {match.reasons.map((reason) => (
                                  <li
                                    key={reason}
                                    className="flex gap-2 text-body text-ink/85"
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

                            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                              {size ? (
                                <Button
                                  type="button"
                                  className="w-full! justify-center sm:w-auto!"
                                  onClick={() => addToCart(p)}
                                  aria-label={`Add ${p.name}, ${size.ml} ml, to cart`}
                                >
                                  Add to cart
                                </Button>
                              ) : null}
                              <Button
                                href={href}
                                variant="secondary"
                                className="w-full! justify-center sm:w-auto!"
                              >
                                View perfume
                              </Button>
                              <Button
                                href={`/collections/${encodeURIComponent(p.family)}`}
                                variant="ghost"
                                className="justify-center sm:px-1"
                              >
                                More {family.toLowerCase()} perfumes
                              </Button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </>
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
                Shop all
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

      <aside className="rounded-2xl border border-hairline bg-muted/40 p-6 sm:p-8 lg:sticky lg:top-[calc(var(--spacing-chrome-height)+1.5rem)]">
        <p className="text-eyebrow text-taupe">
          How matching works
        </p>
        <p className="mt-3 text-body text-ink/85">
          Each answer gives points to our perfumes for who it is for, the type of
          scent, the trail, how long it lasts and its strength. Sets and
          discovery kits are left out so you see single bottles first.
        </p>
        <ul className="mt-5 space-y-2 border-t border-hairline pt-5">
          {[
            "Same answers, same picks every time",
            "Built for Pakistani heat and AC rooms",
            "Reasons shown next to every match",
          ].map((line) => (
            <li
              key={line}
              className="flex gap-2 text-body-sm text-taupe"
            >
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink/40" />
              {line}
            </li>
          ))}
        </ul>

        {answerSummary.length ? (
          <div className="mt-6 border-t border-hairline pt-5">
            <p className="text-eyebrow text-taupe">
              Your answers
            </p>
            <ol className="mt-3 space-y-2">
              {answerSummary.map((line, i) => (
                <li
                  key={`${line}-${i}`}
                  className="text-body-sm text-ink"
                >
                  <span className="font-sans tabular-nums text-sm text-taupe">
                    {String(i + 1).padStart(2, "0")}
                  </span>{" "}
                  {line}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="mt-6 border-t border-hairline pt-5 text-body-sm text-taupe">
            Your answers will collect here as you go.
          </p>
        )}
      </aside>
    </div>
  );
}
