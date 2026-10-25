/**
 * llms.txt (https://llmstxt.org) for AI assistants and answer engines:
 * a short index of the store and a full-text version with every fragrance.
 * Built from the live catalog so it never drifts from the site.
 */
import { faqItems, policies, siteConfig } from "@/data/site";
import { describeShipping, fillCheckoutCopy, type CheckoutConfig } from "@/lib/checkout-config";
import { getCheckoutConfig } from "@/lib/site-settings";
import { richTextToPlain } from "@/lib/rich-text";
import { siteUrl } from "@/lib/site-url";
import { getCollections, getJournalPosts, getStoreProducts } from "@/lib/store-data";
import type { StoreProduct } from "@/lib/mappers";

const CONCENTRATION: Record<StoreProduct["concentration"], string> = {
  EDP: "Eau de Parfum",
  EDT: "Eau de Toilette",
  PARFUM: "Parfum",
};

/** Plain text, single spaces, no em or en dashes. */
function clean(value: string) {
  return richTextToPlain(value || "")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-US")}`;
const sentence = (v: string) => clean(v).replace(/[.\s]+$/, "");
const titleCase = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

function priceRange(p: StoreProduct) {
  const prices = p.prices.map((x) => x.price).filter((n) => n > 0);
  if (!prices.length) return "";
  const lo = Math.min(...prices), hi = Math.max(...prices);
  return lo === hi ? rs(lo) : `${rs(lo)} to ${rs(hi)}`;
}

function shippingFacts(config: CheckoutConfig) {
  return `${describeShipping(config)} Payment by cash on delivery, bank transfer (${siteConfig.bankTransfer.bankName}), JazzCash or Easypaisa. Prices are in Pakistani rupees (PKR).`;
}

export async function buildLlmsTxt() {
  const base = siteUrl();
  const [products, collections, posts, config] = await Promise.all([
    getStoreProducts(),
    getCollections(),
    getJournalPosts(),
    getCheckoutConfig(),
  ]);
  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${clean(siteConfig.description)} Based in ${siteConfig.location.detail}, Punjab, Pakistan. ${shippingFacts(config)}`,
    "",
    "Every fragrance page lists top, heart and base notes, a sillage and longevity rating out of 5, concentration, available sizes in ml and the price in PKR.",
    "",
    "## Fragrances",
    ...products.map(
      (p) =>
        `- [${p.name} ${CONCENTRATION[p.concentration]}](${base}/products/${p.handle}): ${sentence(p.descriptor)}. ${titleCase(p.family)}, ${p.prices.map((x) => `${x.ml} ml`).join(" / ")}, ${priceRange(p)}.`,
    ),
    "",
    "## Collections",
    ...collections.map((c) => `- [${clean(String(c.title))}](${base}/collections/${c.handle})${c.description ? `: ${clean(String(c.description))}` : ""}`),
    "",
    "## Guides",
    `- [Find your scent](${base}/find-your-scent): a short quiz that matches notes, climate and occasion to a fragrance`,
    ...posts.map((post) => `- [${clean(post.title)}](${base}/journal/${post.slug})${post.excerpt ? `: ${clean(post.excerpt)}` : ""}`),
    "",
    "## Customer care",
    `- [FAQ](${base}/faq): authenticity, notes, shipping and returns`,
    `- [Shipping and returns](${base}/shipping-returns)`,
    `- [Track an order](${base}/track-order)`,
    `- [Contact](${base}/contact): ${siteConfig.email}, WhatsApp ${siteConfig.phone}`,
    "",
    "## Optional",
    `- [Full catalog with notes and descriptions](${base}/llms-full.txt)`,
    `- [Our story](${base}/about)`,
    ...Object.entries(policies).map(([slug, p]) => `- [${p.title}](${base}/policies/${slug})`),
    "",
  ];
  return lines.join("\n");
}

export async function buildLlmsFullTxt() {
  const base = siteUrl();
  const [products, config] = await Promise.all([getStoreProducts(), getCheckoutConfig()]);
  const out = [
    `# ${siteConfig.name}: full catalog`,
    "",
    `> ${clean(siteConfig.description)} ${shippingFacts(config)}`,
    "",
    `Website: ${base}. Contact: ${siteConfig.email}, WhatsApp ${siteConfig.phone}. Store: ${siteConfig.location.label}, ${siteConfig.location.detail}, Pakistan.`,
    "",
  ];

  for (const p of products) {
    out.push(
      `## ${p.name} (${CONCENTRATION[p.concentration]})`,
      "",
      `URL: ${base}/products/${p.handle}`,
      `Family: ${titleCase(p.family)}. For: ${p.gender === "unisex" ? "everyone" : p.gender === "her" ? "her" : "him"}.`,
      `Sizes and prices: ${p.prices.map((x) => `${x.ml} ml ${rs(x.price)}`).join(", ")}. ${p.inStock ? "In stock." : "Currently out of stock."}`,
      `Top notes: ${p.topNotes.join(", ") || "not listed"}.`,
      `Heart notes: ${p.heartNotes.join(", ") || "not listed"}.`,
      `Base notes: ${p.baseNotes.join(", ") || "not listed"}.`,
      `Sillage ${p.sillage}/5, longevity ${p.longevity}/5.`,
      p.reviewCount ? `Rated ${p.rating.toFixed(1)}/5 from ${p.reviewCount} reviews.` : "",
      "",
      sentence(p.descriptor) ? `${sentence(p.descriptor)}.` : "",
      clean(p.description),
      p.story ? `Story: ${clean(p.story)}` : "",
      p.howToWear ? `How to wear: ${clean(p.howToWear)}` : "",
      "",
    );
  }

  out.push("## Frequently asked questions", "");
  for (const f of faqItems) out.push(`### ${clean(f.question)}`, "", clean(fillCheckoutCopy(f.answer, config)), "");

  out.push("## Policies", "");
  for (const [slug, p] of Object.entries(policies)) {
    out.push(`### ${p.title}`, "", `URL: ${base}/policies/${slug}`, "");
    for (const sec of p.sections) out.push(`${clean(sec.heading)}: ${clean(fillCheckoutCopy(sec.body, config))}`, "");
  }

  return out.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");
}
