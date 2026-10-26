import type { StoreProduct } from "@/lib/mappers";
import { isSetProduct } from "@/lib/search";

/** Product fields the guide scores on (full products and search rows both fit). */
export type ScentCandidate = Pick<
  StoreProduct,
  | "handle"
  | "name"
  | "tags"
  | "gender"
  | "family"
  | "concentration"
  | "sillage"
  | "longevity"
  | "badges"
  | "rating"
  | "reviewCount"
  | "inStock"
>;

export type ScentGuideAnswers = {
  wearer?: string;
  climate?: string;
  family?: string;
  trail?: string;
  stay?: string;
};

export type ScentGuideOption = {
  id: string;
  label: string;
  hint: string;
};

export type ScentGuideStep = {
  id: keyof ScentGuideAnswers;
  question: string;
  help: string;
  options: ScentGuideOption[];
};

export type ScentMatch<T extends ScentCandidate = StoreProduct> = {
  product: T;
  score: number;
  maxScore: number;
  rankLabel: "Best match" | "Strong match" | "Also try";
  reasons: string[];
};

export type ScentResults<T extends ScentCandidate = StoreProduct> = {
  matches: ScentMatch<T>[];
  /** Plain note shown above the matches, e.g. when no men's florals exist yet. */
  note: string | null;
};

/** Fixed quiz steps. Matching uses catalog fields only (no AI). */
export const SCENT_GUIDE_STEPS: ScentGuideStep[] = [
  {
    id: "wearer",
    question: "Who is this bottle for?",
    help: "Pick who will wear it. Unisex perfumes suit anyone.",
    options: [
      {
        id: "her",
        label: "For her",
        hint: "Women’s perfumes, plus unisex ones",
      },
      {
        id: "him",
        label: "For him",
        hint: "Men’s perfumes, plus unisex ones",
      },
      {
        id: "unisex",
        label: "Unisex",
        hint: "Perfumes made to suit anyone",
      },
      {
        id: "open",
        label: "Open to anything",
        hint: "No preference. We match on your other answers",
      },
    ],
  },
  {
    id: "climate",
    question: "Where will you wear it most?",
    help: "Heat, AC and evening air change how a perfume smells. We match the strength and scent type to it.",
    options: [
      {
        id: "heat",
        label: "Outdoor heat",
        hint: "Lighter, fresher profiles that do not thicken in sun",
      },
      {
        id: "office",
        label: "Office and AC",
        hint: "Clean presence that stays polite in close rooms",
      },
      {
        id: "evening",
        label: "Dinner and nights out",
        hint: "Richer bases that hold through fabric and late hours",
      },
      {
        id: "daily",
        label: "All-day city wear",
        hint: "Balanced bottles for commute, meetings, and the walk home",
      },
    ],
  },
  {
    id: "family",
    question: "Which direction smells right?",
    help: "Pick the type of scent you already like.",
    options: [
      {
        id: "fresh",
        label: "Fresh and citrus",
        hint: "Bergamot, green leaves, clean air",
      },
      {
        id: "floral",
        label: "Floral",
        hint: "Rose, jasmine, soft petal polish",
      },
      {
        id: "woody",
        label: "Woody",
        hint: "Cedar, vetiver, dry woods",
      },
      {
        id: "oriental",
        label: "Oriental and amber",
        hint: "Amber, spice, resin, warmth",
      },
      {
        id: "gourmand",
        label: "Gourmand",
        hint: "Vanilla, tonka, edible sweetness",
      },
    ],
  },
  {
    id: "trail",
    question: "How far should the trail travel?",
    help: "Matched to each perfume’s projection, how far it reaches from your skin, from 1 close to skin to 5 filling the room.",
    options: [
      {
        id: "soft",
        label: "Close to skin",
        hint: "Projection 1 to 2. Noticed when someone leans in",
      },
      {
        id: "moderate",
        label: "Present in the room",
        hint: "Projection 3. Clear without filling the whole floor",
      },
      {
        id: "strong",
        label: "Fills the space",
        hint: "Projection 4 to 5. Leaves a trail in hallways and cars",
      },
    ],
  },
  {
    id: "stay",
    question: "How long should it last on skin?",
    help: "Matched to how long each perfume lasts on skin, rated 1 to 5.",
    options: [
      {
        id: "short",
        label: "A few hours",
        hint: "Longevity 1 to 2. Fine for a short outing or EDT refresh",
      },
      {
        id: "day",
        label: "A full workday",
        hint: "Longevity 3. Holds from morning into late afternoon",
      },
      {
        id: "long",
        label: "Into the night",
        hint: "Longevity 4 to 5. EDP and Parfum that stay after dinner",
      },
    ],
  },
];

const MAX_SCORE = 14;

export function familyLabel(id: string) {
  const step = SCENT_GUIDE_STEPS.find((s) => s.id === "family");
  const label = step?.options.find((o) => o.id === id)?.label;
  if (label) return label;
  return id ? id.charAt(0).toUpperCase() + id.slice(1).toLowerCase() : id;
}

/** "florals", "woody scents": used in the plain note when a gender has none. */
const FAMILY_PLURAL: Record<string, string> = {
  fresh: "fresh scents",
  floral: "florals",
  woody: "woody scents",
  oriental: "amber scents",
  gourmand: "sweet scents",
};

/**
 * When the shopper picks For her or For him plus a family that has no bottle
 * for that gender, say so plainly instead of quietly showing something else.
 */
function familyGapNote(pool: ScentCandidate[], answers: ScentGuideAnswers): string | null {
  const { wearer, family } = answers;
  if (!family || (wearer !== "her" && wearer !== "him")) return null;
  if (pool.some((p) => p.gender === wearer && p.family === family)) return null;
  const who = wearer === "him" ? "men’s" : "women’s";
  const plural = FAMILY_PLURAL[family] ?? `${familyLabel(family).toLowerCase()} scents`;
  const unisex = pool.filter((p) => p.gender === "unisex" && p.family === family).length;
  if (unisex >= 3) return `No ${who} ${plural} yet, here are unisex ${plural}.`;
  if (unisex > 0) return `No ${who} ${plural} yet, here are unisex ${plural} and the closest matches.`;
  return `No ${plural} for ${wearer === "him" ? "men" : "women"} yet, here are the closest matches.`;
}

/**
 * Deterministic ranking from quiz answers against product details.
 * For her / For him never recommends the other gender; unisex stays in.
 * Returns top matches with plain-language reasons.
 */
export function rankScentMatches<T extends ScentCandidate>(
  catalog: T[],
  answers: ScentGuideAnswers,
  limit = 3,
): ScentResults<T> {
  const wearer = answers.wearer;
  const gendered = wearer === "her" || wearer === "him";
  const pool = catalog
    .filter((p) => p.inStock !== false)
    .filter((p) => !isSetProduct(p))
    .filter((p) => !gendered || p.gender === wearer || p.gender === "unisex");

  const scored = pool
    .map((p) => {
      let score = 0;
      const reasons: string[] = [];

      // Wearer / gender (the other gender is already filtered out)
      if (wearer && wearer !== "open") {
        if (wearer === "unisex") {
          if (p.gender === "unisex") {
            score += 3;
            reasons.push("A unisex perfume");
          } else {
            score += 1;
            reasons.push("Can still be shared");
          }
        } else if (p.gender === wearer) {
          score += 3;
          reasons.push(wearer === "her" ? "Made for women" : "Made for men");
        } else if (p.gender === "unisex") {
          score += 2;
          reasons.push("Unisex, suits men and women");
        }
      }

      // Family
      const family = answers.family;
      if (family && p.family === family) {
        score += 4;
        reasons.push(`${familyLabel(family)}, as you picked`);
      } else if (family) {
        // Soft adjacent matches
        if (
          (family === "fresh" && p.family === "floral") ||
          (family === "floral" && p.family === "fresh")
        ) {
          score += 1;
          reasons.push("Close to your pick and still clean");
        }
        if (
          (family === "oriental" && p.family === "gourmand") ||
          (family === "gourmand" && p.family === "oriental")
        ) {
          score += 1;
          reasons.push("Close to your pick and also warm");
        }
        if (
          (family === "woody" && p.family === "oriental") ||
          (family === "oriental" && p.family === "woody")
        ) {
          score += 1;
          reasons.push("Close to your pick, dry and warm");
        }
      }

      // Climate → concentration + family bias
      const climate = answers.climate;
      if (climate === "heat") {
        if (p.family === "fresh" || p.family === "floral") {
          score += 2;
          reasons.push("Light scent for outdoor heat");
        }
        if (p.concentration === "EDT") {
          score += 1;
          reasons.push("Lighter EDT strength for warm days");
        }
        if (p.sillage <= 3) score += 1;
      } else if (climate === "office") {
        if (p.sillage <= 3) {
          score += 2;
          reasons.push("Soft trail for shared rooms");
        }
        if (p.family === "fresh" || p.family === "floral" || p.family === "woody") {
          score += 1;
          reasons.push("Easy to wear at the office");
        }
      } else if (climate === "evening") {
        if (p.family === "oriental" || p.family === "gourmand" || p.family === "woody") {
          score += 2;
          reasons.push("Richer scent for evenings");
        }
        if (p.concentration === "EDP" || p.concentration === "PARFUM") {
          score += 1;
          reasons.push(
            p.concentration === "PARFUM"
              ? "Parfum strength for nights out"
              : "EDP strength for nights out",
          );
        }
        if (p.longevity >= 4) score += 1;
      } else if (climate === "daily") {
        if (p.longevity >= 3 && p.sillage >= 2 && p.sillage <= 4) {
          score += 2;
          reasons.push("Balanced for all-day city wear");
        }
        if (p.badges?.includes("bestseller")) {
          score += 1;
          reasons.push("A bestseller for daily wear");
        }
      }

      // Trail / sillage
      const trail = answers.trail;
      if (trail === "soft" && p.sillage <= 2) {
        score += 3;
        reasons.push(`Projection ${p.sillage}/5, close to skin`);
      } else if (trail === "moderate" && p.sillage === 3) {
        score += 3;
        reasons.push(`Projection ${p.sillage}/5, present without shouting`);
      } else if (trail === "strong" && p.sillage >= 4) {
        score += 3;
        reasons.push(`Projection ${p.sillage}/5, fills the room`);
      } else if (trail === "soft" && p.sillage === 3) {
        score += 1;
      } else if (trail === "strong" && p.sillage === 3) {
        score += 1;
      } else if (trail === "moderate" && (p.sillage === 2 || p.sillage === 4)) {
        score += 1;
      }

      // Stay / longevity
      const stay = answers.stay;
      if (stay === "short" && p.longevity <= 2) {
        score += 2;
        reasons.push(`Longevity ${p.longevity}/5, shorter wear`);
      } else if (stay === "day" && p.longevity === 3) {
        score += 2;
        reasons.push(`Longevity ${p.longevity}/5, workday hold`);
      } else if (stay === "long" && p.longevity >= 4) {
        score += 2;
        reasons.push(`Longevity ${p.longevity}/5, holds into the night`);
      } else if (stay === "day" && (p.longevity === 2 || p.longevity === 4)) {
        score += 1;
      } else if (stay === "long" && p.longevity === 3) {
        score += 1;
      }

      // Light quality signal
      if (p.rating >= 4.5 && p.reviewCount >= 3) {
        score += 1;
        reasons.push(`Rated ${p.rating.toFixed(1)} by customers`);
      }

      // Deduplicate reasons while keeping order
      const uniqueReasons = [...new Set(reasons)].slice(0, 4);

      return { product: p, score, reasons: uniqueReasons };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.product.rating !== a.product.rating)
        return b.product.rating - a.product.rating;
      return a.product.name.localeCompare(b.product.name);
    });

  // If nothing scored (empty answers edge case), fall back to bestsellers
  const ranked =
    scored.length > 0
      ? scored
      : pool
          .map((p) => ({
            product: p,
            score: p.badges?.includes("bestseller") ? 2 : 1,
            reasons: ["A popular pick"] as string[],
          }))
          .sort((a, b) => b.score - a.score);

  // Said "here are unisex florals": put those first, then the closest matches.
  const note = familyGapNote(pool, answers);
  const ordered = note
    ? [
        ...ranked.filter((r) => r.product.family === answers.family),
        ...ranked.filter((r) => r.product.family !== answers.family),
      ]
    : ranked;

  const matches = ordered.slice(0, limit).map((item, index) => ({
    product: item.product,
    score: item.score,
    maxScore: MAX_SCORE,
    rankLabel: (index === 0
      ? "Best match"
      : index === 1
        ? "Strong match"
        : "Also try") as ScentMatch["rankLabel"],
    reasons:
      item.reasons.length > 0
        ? item.reasons
        : ["Fits your answers on scent type and wear"],
  }));

  return { matches, note: matches.length ? note : null };
}

export function summarizeAnswers(answers: ScentGuideAnswers): string[] {
  const lines: string[] = [];
  for (const step of SCENT_GUIDE_STEPS) {
    const value = answers[step.id];
    if (!value) continue;
    const opt = step.options.find((o) => o.id === value);
    if (opt) lines.push(opt.label);
  }
  return lines;
}
