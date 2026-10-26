import type { StoreProduct } from "@/lib/mappers";

/**
 * Storefront search shared by the header search sheet and /search.
 * Pure functions only: safe to import from client components.
 */

/** Card fields the matcher and result rows need (what GET /api/search returns). */
export type SearchProduct = Pick<
  StoreProduct,
  | "id"
  | "handle"
  | "name"
  | "descriptor"
  | "concentration"
  | "family"
  | "gender"
  | "prices"
  | "topNotes"
  | "heartNotes"
  | "baseNotes"
  | "sillage"
  | "longevity"
  | "containsAlcohol"
  | "tags"
  | "collectionHandles"
  | "badges"
  | "imagePrimary"
  | "imageSecondary"
  | "rating"
  | "reviewCount"
  | "inStock"
>;

/**
 * Trim a full product to search fields. `collectionHandles` should list every
 * collection the product appears in (hand-picked, ticked or by tag), so a
 * "gift" search can find bottles placed in a gift collection.
 */
export function toSearchProduct(
  p: StoreProduct,
  collectionHandles: string[] = p.collectionHandles,
): SearchProduct {
  return {
    id: p.id,
    handle: p.handle,
    name: p.name,
    descriptor: p.descriptor,
    concentration: p.concentration,
    family: p.family,
    gender: p.gender,
    prices: p.prices.map(({ ml, price, sku, compareAt }) =>
      compareAt ? { ml, price, sku, compareAt } : { ml, price, sku },
    ),
    topNotes: p.topNotes,
    heartNotes: p.heartNotes,
    baseNotes: p.baseNotes,
    sillage: p.sillage,
    longevity: p.longevity,
    containsAlcohol: p.containsAlcohol,
    tags: p.tags,
    collectionHandles,
    badges: p.badges,
    imagePrimary: p.imagePrimary,
    imageSecondary: p.imageSecondary,
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.inStock,
  };
}

/** Lowest size price, or 0 when a product has no sizes. */
export function lowestPrice(p: Pick<StoreProduct, "prices">): number {
  if (!p.prices.length) return 0;
  return p.prices.reduce((min, s) => (s.price < min ? s.price : min), p.prices[0].price);
}

export function isBestseller(p: Pick<StoreProduct, "badges">) {
  return p.badges.includes("bestseller");
}

function words(value: string): string[] {
  return normalize(value).split(" ").filter(Boolean);
}

const SET_WORDS = new Set(["set", "sets", "discovery", "sampler", "samplers", "kit"]);

/**
 * Discovery kits and gift sets, matched on whole words of the handle, name or
 * tags. "discovery-set-six" counts; "sunset-oud" does not.
 */
export function isSetProduct(p: Pick<StoreProduct, "handle" | "name" | "tags">) {
  const pool = [...words(p.handle), ...words(p.name)];
  if (pool.some((w) => SET_WORDS.has(w))) return true;
  return p.tags.some((t) => {
    const tag = t.toLowerCase();
    return tag === "set" || tag === "type:set" || tag === "discovery" || tag === "type:discovery";
  });
}

/* ------------------------------------------------------------------ */
/* Query parsing                                                       */
/* ------------------------------------------------------------------ */

export type Gender = StoreProduct["gender"];
type Concentration = StoreProduct["concentration"];

type Intent =
  | { kind: "gender"; value: Gender }
  | { kind: "family"; value: string }
  | { kind: "concentration"; value: Concentration }
  | { kind: "badge"; value: StoreProduct["badges"][number] }
  | { kind: "gift" }
  | { kind: "attar" }
  | { kind: "longevity" }
  | { kind: "sillage" };

export type QueryToken = {
  /** Word as typed (normalised). */
  raw: string;
  /** Words to look for in product text. Empty for pure intents such as gender. */
  terms: string[];
  intent?: Intent;
};

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const FILLER = new Set([
  "perfume",
  "perfumes",
  "for",
  "the",
  "a",
  "an",
  "and",
  "of",
  "with",
  "scent",
  "scents",
  "fragrance",
  "fragrances",
  "arrival",
  "arrivals",
]);

/** Multi-word phrases folded into one token before splitting. */
const PHRASES: [RegExp, string][] = [
  [/\bextrait de parfum\b/g, "extrait"],
  [/\beau de parfum\b/g, "edp"],
  [/\beau de toilette\b/g, "edt"],
  [/\blong (lasting|last|lasts|stay|staying)\b/g, "longlasting"],
];

/**
 * `intent` is what the word means; `terms` are the words to look for in product
 * text (defaults to the typed word, empty for pure intents such as gender).
 */
type Synonym = { intent?: Intent; terms?: string[] };

const g = (value: Gender): Synonym => ({ intent: { kind: "gender", value }, terms: [] });
const fam = (value: string): Synonym => ({ intent: { kind: "family", value } });
const conc = (value: Concentration): Synonym => ({ intent: { kind: "concentration", value } });
const badge = (value: StoreProduct["badges"][number]): Synonym => ({
  intent: { kind: "badge", value },
});
const oud: Synonym = { terms: ["oud"] };
const attar: Synonym = { intent: { kind: "attar" }, terms: ["attar"] };
const gift: Synonym = { intent: { kind: "gift" } };
const longevity: Synonym = { intent: { kind: "longevity" }, terms: [] };
const sillage: Synonym = { intent: { kind: "sillage" }, terms: [] };

const SYNONYMS: Record<string, Synonym> = {
  // Gender: pure intent, never matched against notes ("men" is not a note).
  men: g("him"),
  man: g("him"),
  mens: g("him"),
  male: g("him"),
  males: g("him"),
  gents: g("him"),
  gent: g("him"),
  gentlemen: g("him"),
  boys: g("him"),
  him: g("him"),
  his: g("him"),
  mardana: g("him"),
  women: g("her"),
  woman: g("her"),
  womens: g("her"),
  ladies: g("her"),
  lady: g("her"),
  female: g("her"),
  females: g("her"),
  girls: g("her"),
  her: g("her"),
  zanana: g("her"),
  unisex: g("unisex"),
  everyone: g("unisex"),
  // Oud spellings
  oud,
  oudh: oud,
  oodh: oud,
  // Attar: alcohol-free perfume oils
  attar,
  attars: attar,
  itr: attar,
  ittar: attar,
  // Concentration
  edp: conc("EDP"),
  edt: conc("EDT"),
  parfum: conc("PARFUM"),
  extrait: conc("PARFUM"),
  // Gifting
  gift,
  gifts: gift,
  gifting: gift,
  eid: gift,
  wedding: gift,
  weddings: gift,
  shaadi: gift,
  shadi: gift,
  present: gift,
  presents: gift,
  // Performance
  longlasting: longevity,
  lasting: longevity,
  longevity,
  strong: sillage,
  projection: sillage,
  sillage,
  powerful: sillage,
  // Families
  fresh: fam("fresh"),
  citrus: fam("fresh"),
  woody: fam("woody"),
  wood: fam("woody"),
  woods: fam("woody"),
  floral: fam("floral"),
  florals: fam("floral"),
  flower: fam("floral"),
  flowers: fam("floral"),
  oriental: fam("oriental"),
  amber: fam("oriental"),
  gourmand: fam("gourmand"),
  sweet: fam("gourmand"),
  vanilla: fam("gourmand"),
  // Badges
  bestseller: badge("bestseller"),
  bestsellers: badge("bestseller"),
  popular: badge("bestseller"),
  new: badge("new"),
  latest: badge("new"),
  limited: badge("limited"),
  sale: badge("sale"),
};

const FUZZY_SYNONYM_KEYS = Object.keys(SYNONYMS).filter((k) => k.length >= 5);
const FUZZY_FILLER = [...FILLER].filter((k) => k.length >= 5);

/** True when `a` and `b` differ by at most one insert, delete, swap or adjacent transposition. */
export function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i++;
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return (
      i + 1 < la &&
      a[i] === b[i + 1] &&
      a[i + 1] === b[i] &&
      a.slice(i + 2) === b.slice(i + 2)
    );
  }
  return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

/** Exact synonym, else (for 5+ letters) one a single typo away. */
function lookupSynonym(word: string): [string, Synonym] | undefined {
  if (SYNONYMS[word]) return [word, SYNONYMS[word]];
  if (word.length < 5) return undefined;
  const key = FUZZY_SYNONYM_KEYS.find((k) => withinOneEdit(word, k));
  return key ? [key, SYNONYMS[key]] : undefined;
}

function isFiller(word: string) {
  if (FILLER.has(word)) return true;
  // "perfum", "fragrence": typo of a filler word, unless it is itself a known word.
  return word.length >= 5 && !SYNONYMS[word] && FUZZY_FILLER.some((f) => withinOneEdit(word, f));
}

export function parseQuery(query: string): QueryToken[] {
  let text = normalize(query);
  for (const [pattern, replacement] of PHRASES) text = text.replace(pattern, replacement);

  const tokens: QueryToken[] = [];
  const seen = new Set<string>();
  for (const word of text.split(" ")) {
    if (word.length < 2 || seen.has(word) || isFiller(word)) continue;
    seen.add(word);
    const found = lookupSynonym(word);
    if (!found) {
      tokens.push({ raw: word, terms: [word] });
      continue;
    }
    const [key, synonym] = found;
    // A typo ("vanila") also searches the word it was meant to be.
    const terms = synonym.terms ?? [...new Set([word, key])];
    tokens.push({ raw: word, terms, intent: synonym.intent });
  }
  return tokens;
}

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

type Indexed = {
  name: string;
  nameWords: string[];
  noteWords: string[];
  descriptorWords: string[];
  tagWords: string[];
  collectionWords: string[];
  set: boolean;
};

const indexCache = new WeakMap<object, Indexed>();

function indexProduct(p: SearchProduct): Indexed {
  const cached = indexCache.get(p);
  if (cached) return cached;
  const notes = [...p.topNotes, ...p.heartNotes, ...p.baseNotes].join(" ");
  const entry: Indexed = {
    name: normalize(p.name),
    nameWords: words(p.name),
    noteWords: words(notes),
    descriptorWords: words(p.descriptor),
    tagWords: words(p.tags.join(" ")),
    collectionWords: words(p.collectionHandles.join(" ")),
    set: isSetProduct(p),
  };
  indexCache.set(p, entry);
  return entry;
}

/** 3 exact, 2 prefix or inside a longer word, 1 one typo away, 0 no match. */
function termScore(term: string, list: string[]): number {
  let best = 0;
  for (const word of list) {
    if (word === term) return 3;
    if (word.startsWith(term) || (term.length >= 4 && word.includes(term))) {
      best = Math.max(best, 2);
    } else if (best < 1 && term.length >= 5 && withinOneEdit(term, word)) {
      best = 1;
    }
  }
  return best;
}

function bestTermScore(terms: string[], list: string[]) {
  let best = 0;
  for (const t of terms) best = Math.max(best, termScore(t, list));
  return best;
}

const GIFT_COLLECTION = /gift|eid|wedding|shaadi|present/;

function intentMatches(intent: Intent, p: SearchProduct, ix: Indexed): boolean {
  switch (intent.kind) {
    case "family":
      return p.family.toLowerCase() === intent.value;
    case "concentration":
      return p.concentration === intent.value;
    case "badge":
      return p.badges.includes(intent.value);
    case "gift":
      return (
        ix.set ||
        p.collectionHandles.some((h) => GIFT_COLLECTION.test(h.toLowerCase())) ||
        p.tags.some((t) => GIFT_COLLECTION.test(t.toLowerCase()))
      );
    case "attar":
      return p.containsAlcohol === false;
    case "longevity":
      return p.longevity >= 4;
    case "sillage":
      return p.sillage >= 4;
    case "gender":
      return p.gender === intent.value;
  }
}

/**
 * Score one token against a product. Name hits rank first, then intent hits
 * (gender, family, concentration and similar), then notes, then the rest.
 */
function scoreToken(token: QueryToken, p: SearchProduct, ix: Indexed): number {
  const name = bestTermScore(token.terms, ix.nameWords);
  const intent = token.intent ? intentMatches(token.intent, p, ix) : false;
  const notes = bestTermScore(token.terms, ix.noteWords);
  const descriptor = bestTermScore(token.terms, ix.descriptorWords);
  const tags = Math.max(
    bestTermScore(token.terms, ix.tagWords),
    bestTermScore(token.terms, ix.collectionWords),
  );

  const parts = [
    name ? 100 + name * 10 : 0,
    intent ? 60 : 0,
    notes ? 30 + notes * 3 : 0,
    descriptor ? 20 + descriptor : 0,
    tags ? 12 : 0,
  ];
  const top = Math.max(...parts);
  if (!top) return 0;
  const rest = parts.reduce((sum, v) => sum + v, 0) - top;
  let score = top + rest * 0.1;

  if (intent && token.intent?.kind === "gift") {
    if (ix.set) score += 4;
    // "wedding" lifts the wedding collection, "gift" the gift collection.
    if (termScore(token.raw, ix.collectionWords)) score += 5;
  }
  return score;
}

export type SearchOutcome<T> = {
  results: T[];
  /** No product matched every word, so these match some of them. */
  partial: boolean;
  /** Gender named in the query, if exactly one. */
  gender: Gender | null;
};

/**
 * Match a shopper's query against the catalog.
 * - every non-gender word must match (name, notes, family, concentration, tags,
 *   collections), with one typo allowed on words of 5+ letters;
 * - a gender word filters: "for men" keeps him and unisex, never her;
 * - when no product matches every word, products matching most words are
 *   returned with `partial: true`.
 */
export function searchProducts<T extends SearchProduct>(
  catalog: readonly T[],
  query: string,
): SearchOutcome<T> {
  const tokens = parseQuery(query);
  const hasInput = normalize(query).length > 0;
  if (!hasInput) return { results: [], partial: false, gender: null };

  const genders = new Set<Gender>();
  for (const t of tokens) if (t.intent?.kind === "gender") genders.add(t.intent.value);
  const textTokens = tokens.filter((t) => t.intent?.kind !== "gender");
  const named = genders.size === 1 ? [...genders][0] : null;

  const allowed = (p: T) => {
    if (!genders.size) return true;
    if (genders.has("him") && genders.has("her")) return true;
    if (genders.has(p.gender)) return true;
    return p.gender === "unisex" && (genders.has("him") || genders.has("her"));
  };

  const phrase = textTokens.map((t) => t.raw).join(" ");
  const wants = (kind: Intent["kind"]) => textTokens.some((t) => t.intent?.kind === kind);
  const wantsGift = wants("gift");
  const wantsLongevity = wants("longevity");
  const wantsSillage = wants("sillage");

  type Row = { p: T; score: number; matched: number; order: number };
  const rows: Row[] = [];
  catalog.forEach((p, order) => {
    if (!allowed(p)) return;
    const ix = indexProduct(p);
    let score = 0;
    let matched = 0;
    for (const token of textTokens) {
      const s = scoreToken(token, p, ix);
      if (s > 0) {
        matched += 1;
        score += s;
      }
    }
    if (genders.size) score += genders.has(p.gender) ? 50 : 20;
    if (phrase.length >= 3 && ix.name.includes(phrase)) score += ix.name === phrase ? 300 : 200;
    // Stronger performers first when the shopper asked for it.
    if (wantsLongevity) score += p.longevity;
    if (wantsSillage) score += p.sillage;
    // Kits and sets trail single bottles unless the shopper is looking for a gift.
    if (ix.set && !wantsGift) score -= 3;
    if (!p.inStock) score -= 5;
    rows.push({ p, score, matched, order });
  });

  const rank = (a: Row, b: Row) => {
    if (b.matched !== a.matched) return b.matched - a.matched;
    if (b.score !== a.score) return b.score - a.score;
    const bs = Number(isBestseller(b.p)) - Number(isBestseller(a.p));
    if (bs) return bs;
    if (b.p.rating !== a.p.rating) return b.p.rating - a.p.rating;
    return a.order - b.order;
  };

  const exact = rows.filter((r) => r.matched === textTokens.length);
  // A query of only filler words ("perfume") or only a gender ("for men") lists everything allowed.
  if (exact.length) {
    return { results: exact.sort(rank).map((r) => r.p), partial: false, gender: named };
  }
  if (textTokens.length > 1) {
    const some = rows.filter((r) => r.matched > 0).sort(rank);
    if (some.length) return { results: some.map((r) => r.p), partial: true, gender: named };
  }
  return { results: [], partial: false, gender: named };
}

/** Searches offered before anything is typed. */
export const POPULAR_SEARCHES = ["Oud", "Rose", "Musk", "For men", "For women", "Gifts"] as const;

const CLIENT_TTL_MS = 5 * 60 * 1000;
let catalogRequest: { at: number; promise: Promise<SearchProduct[]> } | null = null;

/**
 * Load the lightweight search catalog from GET /api/search. Shared by the
 * search sheet, /search and the scent guide, and kept for 5 minutes so
 * reopening search does not download it again.
 */
export function fetchSearchCatalog(): Promise<SearchProduct[]> {
  if (catalogRequest && Date.now() - catalogRequest.at < CLIENT_TTL_MS) {
    return catalogRequest.promise;
  }
  const promise = fetch("/api/search")
    .then(async (res) => {
      const json = (await res.json()) as { ok: boolean; data?: SearchProduct[] };
      if (!res.ok || !json.ok || !Array.isArray(json.data)) {
        throw new Error("Search catalog unavailable");
      }
      return json.data;
    })
    .catch((e: unknown) => {
      // Let the next open try again.
      catalogRequest = null;
      throw e;
    });
  catalogRequest = { at: Date.now(), promise };
  return promise;
}
