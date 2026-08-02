import { products } from "@/data/products";
import type { Collection, Product } from "@/lib/types";

export const collections: Collection[] = [
  {
    handle: "for-her",
    title: "For Her",
    description: "Florals, iris, and soft gourmands composed for her wardrobe.",
    seoCopy:
      "Explore NS Perfume compositions created with feminine-leaning structures—powdered iris, rose, and warm vanilla gourmands. Each eau de parfum and eau de toilette is listed with its true scent pyramid, sillage, and longevity so you can choose by wear time and occasion rather than by trend. From Iris Solstice for daylight offices to Vanille Gilde for cooler evenings, every bottle links to full note breakdowns, concentration, and available sizes.",
    bannerTone: "canvas",
    filterTags: ["gender:her"],
  },
  {
    handle: "for-him",
    title: "For Him",
    description: "Woods, oud, and dry amber structures built for daily and evening wear.",
    seoCopy:
      "Shop NS Perfume for him—cedar, vetiver, smoked leather, and restrained oud. Cedar Rift is a clean daytime EDT; Oud Atelier is a denser parfum for night. Filter by family and concentration to match climate, office policy, and how long you need a scent to last.",
    bannerTone: "deep",
    filterTags: ["gender:him"],
  },
  {
    handle: "unisex",
    title: "Unisex",
    description: "Shared compositions that sit well across wardrobes and seasons.",
    seoCopy:
      "Our unisex lineup balances fresh citrus, green fig, and oriental amber without leaning hard into gendered clichés. Amber Noir, Fig Verdure, and Citrus Atelier give you options from soft sillage to room-filling trails—each with transparent note lists and performance meters on the product page.",
    bannerTone: "canvas",
    filterTags: ["gender:unisex"],
  },
  {
    handle: "floral",
    title: "Floral",
    description: "Iris, jasmine, rose, and violet constructed for modern wear.",
    seoCopy:
      "Floral at NS Perfume means structure over sweetness. Iris butter, violet leaf, and rose absolute are paired with musk and wood so the drydown stays wearable through a full day. Read each scent pyramid for top-to-base evolution before you commit to a bottle size.",
    bannerTone: "canvas",
    filterTags: ["family:floral"],
  },
  {
    handle: "woody",
    title: "Woody",
    description: "Cedar, vetiver, and dry timber accords with clean spice.",
    seoCopy:
      "Woody fragrances here favor dry, architectural woods over heavy resin. Pepper, grapefruit, and cypress brighten the opening; cashmeran and amberwood manage the trail. Ideal if you want something clean enough for daytime and grounded enough for evening.",
    bannerTone: "deep",
    filterTags: ["family:woody"],
  },
  {
    handle: "oriental",
    title: "Oriental & Amber",
    description: "Resins, amber, oud, and incense for longer nights.",
    seoCopy:
      "Oriental and amber compositions at NS Perfume emphasize depth without glitter or gimmick. Expect saffron, labdanum, oud, and leather crafted for sillage you can control with application. Compare performance meters to match intensity to occasion.",
    bannerTone: "deep",
    filterTags: ["family:oriental"],
  },
  {
    handle: "fresh",
    title: "Fresh & Citrus",
    description: "Green stems, fig leaf, and Italian citrus with soft drydowns.",
    seoCopy:
      "Fresh and citrus scents need more than top-note sparkle. Our lineup pairs lemon, blood orange, and fig leaf with musk and light woods so the scent does not disappear after an hour. Reapplication-friendly EDTs sit beside brighter everyday options for warm weather.",
    bannerTone: "canvas",
    filterTags: ["family:fresh"],
  },
  {
    handle: "gourmand",
    title: "Gourmand",
    description: "Vanilla, cacao, and tonka treated with restraint.",
    seoCopy:
      "Gourmand here is roasted, not sugary. Vanille Gilde layers vanilla absolute with cacao and tonka over sandalwood for a dinner-table presence that still reads adult. Check longevity ratings if you want a scent that lasts well past dessert.",
    bannerTone: "canvas",
    filterTags: ["family:gourmand"],
  },
  {
    handle: "eau-de-parfum",
    title: "Eau de Parfum",
    description: "Higher concentration for longer longevity on skin.",
    seoCopy:
      "EDP formulas in the NS Perfume range sit between daily EDT brightness and extrait intensity. Expect richer hearts and longer drydowns—ideal when you want six to eight hours of wear without heavy reapplication.",
    bannerTone: "canvas",
    filterTags: ["concentration:edp"],
  },
  {
    handle: "eau-de-toilette",
    title: "Eau de Toilette",
    description: "Lighter concentration for heat and daytime refresh.",
    seoCopy:
      "EDT bottles are built for climates and days when you want lift without weight. Citrus, fig, and dry cedar open cleanly; reapply after midday if skin chemistry burns through the top notes.",
    bannerTone: "canvas",
    filterTags: ["concentration:edt"],
  },
  {
    handle: "discovery",
    title: "Discovery & Travel Size",
    description: "Sample sets and smaller formats for testing on skin.",
    seoCopy:
      "Start with the Discovery Set when you want to wear a formula for several days before buying a full bottle. Travel-friendly formats help you test sillage in real offices, evenings, and humidity.",
    bannerTone: "canvas",
    filterTags: undefined,
  },
  {
    handle: "gift-sets",
    title: "Gift Sets",
    description: "Curated pairings for occasions that deserve a full wardrobe start.",
    seoCopy:
      "Gift sets combine discovery formats with signature bottles so recipients can map preference before committing to a larger size. Look for guided note descriptions and free shipping thresholds on eligible orders.",
    bannerTone: "deep",
    filterTags: undefined,
  },
  {
    handle: "new-arrivals",
    title: "New Arrivals",
    description: "Recently released compositions and limited formats.",
    seoCopy:
      "New arrivals at NS Perfume surface the latest note structures and bottle sizes. Browse concentration badges and scent pyramids first—then choose size once performance matches how you live.",
    bannerTone: "canvas",
    filterTags: ["badge:new"],
  },
  {
    handle: "bestsellers",
    title: "Bestsellers",
    description: "Most requested bottles across gender and family.",
    seoCopy:
      "Bestsellers reflect wear-tested favorites—Amber Noir, Cedar Rift, Citrus Atelier, and the Discovery Set. Each listing still shows honest sillage and longevity so popular does not mean one-size-fits-all.",
    bannerTone: "deep",
    filterTags: ["badge:bestseller"],
  },
  {
    handle: "limited-edition",
    title: "Limited Edition",
    description: "Short-run compositions and seasonal strengths.",
    seoCopy:
      "Limited editions may use higher concentrations or restricted raw materials. Availability is finite; check stock on the product page and consider smaller sizes if you are sampling a denser formula for the first time.",
    bannerTone: "deep",
    filterTags: ["badge:limited"],
  },
];

export function getCollection(handle: string): Collection | undefined {
  return collections.find((c) => c.handle === handle);
}

export function getCollectionProducts(handle: string): Product[] {
  const collection = getCollection(handle);
  if (!collection) return [];

  if (handle === "discovery") {
    return products.filter(
      (p) => p.handle === "discovery-set-six" || p.prices.some((s) => s.ml <= 30),
    );
  }
  if (handle === "gift-sets") {
    return products.filter(
      (p) => p.handle === "discovery-set-six" || p.badges.includes("bestseller"),
    );
  }
  if (collection.filterTags?.length) {
    return products.filter((p) =>
      collection.filterTags!.some(
        (tag) =>
          p.tags.includes(tag) ||
          p.badges.includes(tag.replace("badge:", "") as Product["badges"][number]),
      ),
    );
  }
  return products;
}
