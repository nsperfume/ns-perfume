import type { StoreProduct } from "@/lib/mappers";

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

export type ScentMatch = {
  product: StoreProduct;
  score: number;
  maxScore: number;
  rankLabel: "Best match" | "Strong match" | "Also try";
  reasons: string[];
};

/** Fixed quiz steps. Matching uses catalog fields only (no AI). */
export const SCENT_GUIDE_STEPS: ScentGuideStep[] = [
  {
    id: "wearer",
    question: "Who is this bottle for?",
    help: "We weight gender tags on each formula. Unisex stays open to either side.",
    options: [
      {
        id: "her",
        label: "For her",
        hint: "Formulas filed under her, plus unisex options",
      },
      {
        id: "him",
        label: "For him",
        hint: "Formulas filed under him, plus unisex options",
      },
      {
        id: "unisex",
        label: "Unisex",
        hint: "Shared bottles that sit between both wardrobes",
      },
      {
        id: "open",
        label: "Open to anything",
        hint: "No gender filter. We score on climate and trail only",
      },
    ],
  },
  {
    id: "climate",
    question: "Where will you wear it most?",
    help: "Heat, AC, and evening air change how notes open. We match concentration and family to that.",
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
    help: "Pick the family you already lean toward. We match the catalog family field exactly.",
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
    help: "Matched to each bottle’s sillage rating (1 soft to 5 room-filling).",
    options: [
      {
        id: "soft",
        label: "Close to skin",
        hint: "Sillage 1 to 2. Noticeable when someone leans in",
      },
      {
        id: "moderate",
        label: "Present in the room",
        hint: "Sillage 3. Clear without filling the whole floor",
      },
      {
        id: "strong",
        label: "Fills the space",
        hint: "Sillage 4 to 5. Leaves a trail in hallways and cars",
      },
    ],
  },
  {
    id: "stay",
    question: "How long should it last on skin?",
    help: "Matched to each bottle’s longevity rating and concentration.",
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

function isDiscoveryOrSet(p: StoreProduct) {
  const h = p.handle.toLowerCase();
  const n = p.name.toLowerCase();
  return (
    h.includes("discovery") ||
    h.includes("set") ||
    n.includes("discovery") ||
    n.includes("set of")
  );
}

function familyLabel(id: string) {
  const step = SCENT_GUIDE_STEPS.find((s) => s.id === "family");
  return step?.options.find((o) => o.id === id)?.label || id;
}

/**
 * Deterministic ranking from quiz answers against catalog fields.
 * Returns top matches with plain-language reasons (no AI).
 */
export function rankScentMatches(
  catalog: StoreProduct[],
  answers: ScentGuideAnswers,
  limit = 3,
): ScentMatch[] {
  const scored = catalog
    .filter((p) => p.inStock !== false)
    .filter((p) => !isDiscoveryOrSet(p))
    .map((p) => {
      let score = 0;
      const reasons: string[] = [];

      // Wearer / gender
      const wearer = answers.wearer;
      if (wearer && wearer !== "open") {
        if (wearer === "unisex") {
          if (p.gender === "unisex") {
            score += 3;
            reasons.push("Filed as unisex in the catalog");
          } else {
            score += 1;
            reasons.push("Can still work as a shared bottle");
          }
        } else if (p.gender === wearer) {
          score += 3;
          reasons.push(
            wearer === "her" ? "Matched to her formulas" : "Matched to him formulas",
          );
        } else if (p.gender === "unisex") {
          score += 2;
          reasons.push("Unisex option that fits either wardrobe");
        }
      }

      // Family
      const family = answers.family;
      if (family && p.family === family) {
        score += 4;
        reasons.push(`Scent family: ${familyLabel(family)}`);
      } else if (family) {
        // Soft adjacent matches
        if (
          (family === "fresh" && p.family === "floral") ||
          (family === "floral" && p.family === "fresh")
        ) {
          score += 1;
          reasons.push("Nearby family that still leans clean");
        }
        if (
          (family === "oriental" && p.family === "gourmand") ||
          (family === "gourmand" && p.family === "oriental")
        ) {
          score += 1;
          reasons.push("Nearby warm family");
        }
        if (
          (family === "woody" && p.family === "oriental") ||
          (family === "oriental" && p.family === "woody")
        ) {
          score += 1;
          reasons.push("Nearby dry-warm family");
        }
      }

      // Climate → concentration + family bias
      const climate = answers.climate;
      if (climate === "heat") {
        if (p.family === "fresh" || p.family === "floral") {
          score += 2;
          reasons.push("Lighter family for outdoor heat");
        }
        if (p.concentration === "EDT") {
          score += 1;
          reasons.push("EDT concentration for warmer air");
        }
        if (p.sillage <= 3) score += 1;
      } else if (climate === "office") {
        if (p.sillage <= 3) {
          score += 2;
          reasons.push("Controlled trail for shared rooms");
        }
        if (p.family === "fresh" || p.family === "floral" || p.family === "woody") {
          score += 1;
          reasons.push("Office-friendly family");
        }
      } else if (climate === "evening") {
        if (p.family === "oriental" || p.family === "gourmand" || p.family === "woody") {
          score += 2;
          reasons.push("Richer family for evening air");
        }
        if (p.concentration === "EDP" || p.concentration === "PARFUM") {
          score += 1;
          reasons.push(`${p.concentration} weight for night wear`);
        }
        if (p.longevity >= 4) score += 1;
      } else if (climate === "daily") {
        if (p.longevity >= 3 && p.sillage >= 2 && p.sillage <= 4) {
          score += 2;
          reasons.push("Balanced for all-day city wear");
        }
        if (p.badges?.includes("bestseller")) {
          score += 1;
          reasons.push("Often reordered for daily use");
        }
      }

      // Trail / sillage
      const trail = answers.trail;
      if (trail === "soft" && p.sillage <= 2) {
        score += 3;
        reasons.push(`Sillage ${p.sillage}/5, close to skin`);
      } else if (trail === "moderate" && p.sillage === 3) {
        score += 3;
        reasons.push(`Sillage ${p.sillage}/5, present without shouting`);
      } else if (trail === "strong" && p.sillage >= 4) {
        score += 3;
        reasons.push(`Sillage ${p.sillage}/5, room-filling trail`);
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
        reasons.push(`Rated ${p.rating.toFixed(1)} from wearers`);
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
  const pool =
    scored.length > 0
      ? scored
      : catalog
          .filter((p) => !isDiscoveryOrSet(p) && p.inStock !== false)
          .map((p) => ({
            product: p,
            score: p.badges?.includes("bestseller") ? 2 : 1,
            reasons: ["From the current line"] as string[],
          }))
          .sort((a, b) => b.score - a.score);

  return pool.slice(0, limit).map((item, index) => ({
    product: item.product,
    score: item.score,
    maxScore: MAX_SCORE,
    rankLabel:
      index === 0 ? "Best match" : index === 1 ? "Strong match" : "Also try",
    reasons:
      item.reasons.length > 0
        ? item.reasons
        : ["Fits your answers across family and wear"],
  }));
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
