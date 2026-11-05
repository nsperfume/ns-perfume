import type { Metadata } from "next";
import { siteConfig } from "@/data/site";

/** A page's own openGraph replaces the root one, so each page carries these too. */
export const BASE_OPEN_GRAPH = {
  siteName: siteConfig.name,
  locale: "en_PK",
  type: "website",
} as const;

/**
 * Open Graph for a page that keeps the site-wide share image. Setting openGraph on a
 * page drops the root opengraph-image file, so the image is named here.
 */
export const pageOpenGraph = (path: string) => ({
  ...BASE_OPEN_GRAPH,
  url: path,
  images: [
    {
      url: "/opengraph-image.png",
      width: 1200,
      height: 630,
      alt: `${siteConfig.name}: long lasting perfumes in Pakistan`,
    },
  ],
});

/** Search results show about 60 characters of a title and 160 of a description. */
const MAX_TITLE = 60;
const MAX_DESCRIPTION = 160;
const BRAND_SUFFIX = ` | ${siteConfig.name}`;

function cutAtWord(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,:;.\-]+$/, "");
}

/**
 * First option that fits with the brand (the root layout adds it); otherwise the
 * last option alone, cut at a word boundary. No ellipsis: it reads as broken in results.
 */
export function fitTitle(...options: string[]): NonNullable<Metadata["title"]> {
  const fits = options.find((o) => o.length + BRAND_SUFFIX.length <= MAX_TITLE);
  if (fits) return fits;
  return { absolute: cutAtWord(options[options.length - 1], MAX_TITLE) };
}

export const fitDescription = (text: string) =>
  cutAtWord(text.replace(/\s+/g, " ").trim(), MAX_DESCRIPTION);

const CONCENTRATION_NAMES: Record<string, string> = {
  EDP: "Eau de Parfum",
  EDT: "Eau de Toilette",
  EDC: "Eau de Cologne",
  PARFUM: "Parfum",
  EXTRAIT: "Extrait de Parfum",
};
export const concentrationName = (c: string) => CONCENTRATION_NAMES[c.toUpperCase()] ?? c;
export const audienceLabel = (gender: string) =>
  gender === "him" ? "for men" : gender === "her" ? "for women" : "for men and women";

type ProductForSeo = {
  name: string;
  concentration: string;
  gender: string;
  descriptor: string;
  prices: { price: number }[];
};

/** Automatic product title, used when the owner leaves the search title empty. */
export function productTitle(p: Pick<ProductForSeo, "name" | "concentration" | "gender">) {
  const type = concentrationName(p.concentration);
  return fitTitle(`${p.name} ${type} ${audienceLabel(p.gender)}`, `${p.name} ${type}`, p.name);
}

/** The same title as a plain string, as it appears in search results. */
export function titleText(title: NonNullable<Metadata["title"]>) {
  if (typeof title === "string") return `${title}${BRAND_SUFFIX}`;
  return "absolute" in title ? title.absolute : "";
}

/** Automatic product description, used when the owner leaves the search description empty. */
export function productDescription(p: ProductForSeo) {
  const prices = p.prices.map((s) => s.price).filter((n) => n > 0);
  const from = prices.length
    ? ` Price in Pakistan from Rs ${Math.min(...prices).toLocaleString("en-US")}.`
    : "";
  const lead = p.descriptor.trim() ? `${p.descriptor.trim().replace(/\.?$/, ".")} ` : "";
  return fitDescription(
    `${lead}${concentrationName(p.concentration)} ${audienceLabel(p.gender)}.${from} Cash on delivery across Pakistan.`,
  );
}

/** Structured data needs absolute URLs; uploaded images may already be absolute. */
export const absoluteUrl = (path: string) =>
  /^https?:\/\//i.test(path)
    ? path
    : `${siteConfig.url}${path === "/" ? "" : path.startsWith("/") ? path : `/${path}`}`;

export const breadcrumbJsonLd = (trail: { label: string; href: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.label,
    item: absoluteUrl(t.href),
  })),
});
