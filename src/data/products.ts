import type { Product, Review } from "@/lib/types";

export const products: Product[] = [
  {
    handle: "amber-noir-edp",
    name: "Amber Noir",
    descriptor: "Smoked amber and velvet oud for long evenings",
    concentration: "EDP",
    family: "oriental",
    gender: "unisex",
    prices: [
      { ml: 30, price: 95, sku: "NS-AN-30" },
      { ml: 50, price: 145, sku: "NS-AN-50" },
      { ml: 100, price: 220, sku: "NS-AN-100" },
    ],
    topNotes: ["Bergamot", "Pink pepper", "Saffron"],
    heartNotes: ["Oud", "Rose absolute", "Labdanum"],
    baseNotes: ["Amber", "Vanilla", "Musk", "Cedar"],
    sillage: 4,
    longevity: 5,
    ingredients: ["Alcohol denat.", "Parfum", "Linalool", "Coumarin", "Limonene"],
    countryOfOrigin: "France",
    story:
      "Amber Noir was composed for the hour after dusk—when the air cools and skin holds warmth. It opens bright with citrus heat, then settles into a deep resinous heart that lingers like silk on a collarbone.",
    howToWear:
      "Apply to pulse points and allow five minutes before dressing. Pairs well with a light cashmere layer. Best worn into warm evenings and formal dinners.",
    tags: ["gender:unisex", "family:oriental", "concentration:edp", "badge:bestseller"],
    badges: ["bestseller"],
    imagePrimary: "/products/amber-noir-a.svg",
    imageSecondary: "/products/amber-noir-b.svg",
    gallery: [
      "/products/amber-noir-a.svg",
      "/products/amber-noir-b.svg",
      "/products/placeholder-label.svg",
      "/products/placeholder-lifestyle.svg",
      "/products/placeholder-texture.svg",
    ],
    relatedHandles: ["iris-solstice-edp", "oud-atelier-parfum"],
    rating: 4.8,
    reviewCount: 42,
    inStock: true,
  },
  {
    handle: "iris-solstice-edp",
    name: "Iris Solstice",
    descriptor: "Powdered iris over cool violet wood",
    concentration: "EDP",
    family: "floral",
    gender: "her",
    prices: [
      { ml: 30, price: 90, sku: "NS-IS-30" },
      { ml: 50, price: 138, sku: "NS-IS-50" },
      { ml: 100, price: 210, sku: "NS-IS-100" },
    ],
    topNotes: ["Violet leaf", "Bergamot", "Carrot seed"],
    heartNotes: ["Iris butter", "Jasmine sambac", "Magnolia"],
    baseNotes: ["Sandalwood", "White musk", "Orris root"],
    sillage: 3,
    longevity: 4,
    ingredients: ["Alcohol denat.", "Parfum", "Benzyl alcohol", "Geraniol"],
    countryOfOrigin: "France",
    story:
      "Iris Solstice is a study in soft geometry—cool powder meeting sunlit wood. Built for daylight wear with enough structure to last through dinner.",
    howToWear:
      "Spray lightly on hair and wrists. Ideal for offices, daytime gatherings, and cool spring afternoons.",
    tags: ["gender:her", "family:floral", "concentration:edp", "badge:new"],
    badges: ["new"],
    imagePrimary: "/products/iris-solstice-a.svg",
    imageSecondary: "/products/iris-solstice-b.svg",
    gallery: [
      "/products/iris-solstice-a.svg",
      "/products/iris-solstice-b.svg",
      "/products/placeholder-label.svg",
      "/products/placeholder-lifestyle.svg",
      "/products/placeholder-texture.svg",
    ],
    relatedHandles: ["citrus-atelier-edt", "amber-noir-edp"],
    rating: 4.6,
    reviewCount: 18,
    inStock: true,
  },
  {
    handle: "cedar-rift-edt",
    name: "Cedar Rift",
    descriptor: "Dry cedar, cracked pepper, and clean musk",
    concentration: "EDT",
    family: "woody",
    gender: "him",
    prices: [
      { ml: 30, price: 78, sku: "NS-CR-30" },
      { ml: 50, price: 118, sku: "NS-CR-50" },
      { ml: 100, price: 175, sku: "NS-CR-100" },
    ],
    topNotes: ["Black pepper", "Grapefruit", "Elemi"],
    heartNotes: ["Cedarwood", "Vetiver", "Cypress"],
    baseNotes: ["Cashmeran", "Amberwood", "Musk"],
    sillage: 3,
    longevity: 3,
    ingredients: ["Alcohol denat.", "Parfum", "Limonene", "Citral"],
    countryOfOrigin: "Italy",
    story:
      "Cedar Rift opens with a crisp bite of pepper and citrus before unfolding into dry, architectural woods. Built for daily wear without dullness.",
    howToWear:
      "Two sprays at the chest, one at the collar. Works from morning meetings through late dinners.",
    tags: ["gender:him", "family:woody", "concentration:edt", "badge:bestseller"],
    badges: ["bestseller"],
    imagePrimary: "/products/cedar-rift-a.svg",
    imageSecondary: "/products/cedar-rift-b.svg",
    gallery: [
      "/products/cedar-rift-a.svg",
      "/products/cedar-rift-b.svg",
      "/products/placeholder-label.svg",
      "/products/placeholder-lifestyle.svg",
      "/products/placeholder-texture.svg",
    ],
    relatedHandles: ["oud-atelier-parfum", "fig-verdure-edt"],
    rating: 4.5,
    reviewCount: 31,
    inStock: true,
  },
  {
    handle: "fig-verdure-edt",
    name: "Fig Verdure",
    descriptor: "Green fig leaf over milky coconut wood",
    concentration: "EDT",
    family: "fresh",
    gender: "unisex",
    prices: [
      { ml: 30, price: 72, sku: "NS-FV-30" },
      { ml: 50, price: 110, sku: "NS-FV-50" },
      { ml: 100, price: 165, sku: "NS-FV-100" },
    ],
    topNotes: ["Fig leaf", "Bergamot", "Green stem"],
    heartNotes: ["Coconut milk", "Jasmine tea", "Magnolia"],
    baseNotes: ["Driftwood", "Musk", "Soft tonka"],
    sillage: 2,
    longevity: 3,
    ingredients: ["Alcohol denat.", "Parfum", "Linalool", "Citronellol"],
    countryOfOrigin: "Spain",
    story:
      "Fig Verdure is a cool shade walk—crushed leaves, milky fruit, and the faint sweetness of sun on wood. A summer staple refined for year-round wear.",
    howToWear:
      "Best on bare skin in heat. Layer lightly after a shower when skin is still warm.",
    tags: ["gender:unisex", "family:fresh", "concentration:edt", "badge:new"],
    badges: ["new"],
    imagePrimary: "/products/fig-verdure-a.svg",
    imageSecondary: "/products/fig-verdure-b.svg",
    gallery: [
      "/products/fig-verdure-a.svg",
      "/products/fig-verdure-b.svg",
      "/products/placeholder-label.svg",
      "/products/placeholder-lifestyle.svg",
      "/products/placeholder-texture.svg",
    ],
    relatedHandles: ["citrus-atelier-edt", "iris-solstice-edp"],
    rating: 4.4,
    reviewCount: 22,
    inStock: true,
  },
  {
    handle: "oud-atelier-parfum",
    name: "Oud Atelier",
    descriptor: "Resinous oud with black rose and smoked leather",
    concentration: "PARFUM",
    family: "oriental",
    gender: "him",
    prices: [
      { ml: 30, price: 145, sku: "NS-OA-30" },
      { ml: 50, price: 210, sku: "NS-OA-50" },
      { ml: 100, price: 320, sku: "NS-OA-100" },
    ],
    topNotes: ["Saffron", "Cardamom", "Aldehyde"],
    heartNotes: ["Black rose", "Oud", "Incense"],
    baseNotes: ["Leather", "Patchouli", "Ambergris accord"],
    sillage: 5,
    longevity: 5,
    ingredients: ["Alcohol denat.", "Parfum", "Eugenol", "Cinnamal"],
    countryOfOrigin: "France",
    story:
      "Oud Atelier is a denser composition for cooler nights—rose darkens, leather softens, and the trail fills a room without shouting.",
    howToWear:
      "One spray only at the base of the throat. Stronger concentrations need less volume. Ideal for autumn and winter evenings.",
    tags: ["gender:him", "family:oriental", "concentration:edp", "badge:limited"],
    badges: ["limited"],
    imagePrimary: "/products/oud-atelier-a.svg",
    imageSecondary: "/products/oud-atelier-b.svg",
    gallery: [
      "/products/oud-atelier-a.svg",
      "/products/oud-atelier-b.svg",
      "/products/placeholder-label.svg",
      "/products/placeholder-lifestyle.svg",
      "/products/placeholder-texture.svg",
    ],
    relatedHandles: ["amber-noir-edp", "cedar-rift-edt"],
    rating: 4.9,
    reviewCount: 15,
    inStock: true,
  },
  {
    handle: "citrus-atelier-edt",
    name: "Citrus Atelier",
    descriptor: "Italian citrus with neroli and white pepper",
    concentration: "EDT",
    family: "fresh",
    gender: "unisex",
    prices: [
      { ml: 30, price: 68, sku: "NS-CA-30" },
      { ml: 50, price: 105, sku: "NS-CA-50" },
      { ml: 100, price: 155, sku: "NS-CA-100" },
    ],
    topNotes: ["Sicilian lemon", "Blood orange", "White pepper"],
    heartNotes: ["Neroli", "Petitgrain", "Orange blossom"],
    baseNotes: ["White musk", "Cedar", "Light amber"],
    sillage: 2,
    longevity: 2,
    ingredients: ["Alcohol denat.", "Parfum", "Limonene", "Citral", "Linalool"],
    countryOfOrigin: "Italy",
    story:
      "Citrus Atelier is a clean break into morning light—zested rinds and peppery sparkle over a soft, transparent drydown.",
    howToWear:
      "Reapply mid-afternoon. Perfect for warm climates and people who prefer brightness over weight.",
    tags: ["gender:unisex", "family:fresh", "concentration:edt", "badge:bestseller"],
    badges: ["bestseller"],
    imagePrimary: "/products/citrus-atelier-a.svg",
    imageSecondary: "/products/citrus-atelier-b.svg",
    gallery: [
      "/products/citrus-atelier-a.svg",
      "/products/citrus-atelier-b.svg",
      "/products/placeholder-label.svg",
      "/products/placeholder-lifestyle.svg",
      "/products/placeholder-texture.svg",
    ],
    relatedHandles: ["fig-verdure-edt", "iris-solstice-edp"],
    rating: 4.3,
    reviewCount: 37,
    inStock: true,
  },
  {
    handle: "vanille-gilde-edp",
    name: "Vanille Gilde",
    descriptor: "Caramelized vanilla with roasted cacao and tonka",
    concentration: "EDP",
    family: "gourmand",
    gender: "her",
    prices: [
      { ml: 30, price: 98, sku: "NS-VG-30" },
      { ml: 50, price: 152, sku: "NS-VG-50" },
      { ml: 100, price: 235, sku: "NS-VG-100" },
    ],
    topNotes: ["Bergamot", "Almond", "Rum accord"],
    heartNotes: ["Vanilla absolute", "Cacao", "Jasmine"],
    baseNotes: ["Tonka bean", "Benzoin", "Sandalwood"],
    sillage: 4,
    longevity: 5,
    ingredients: ["Alcohol denat.", "Parfum", "Coumarin", "Vanillin"],
    countryOfOrigin: "France",
    story:
      "Vanille Gilde treats gourmand notes with restraint—sweetness is tempered by roast and wood so the composition reads warm, not sugary.",
    howToWear:
      "Wear into cooler weather. One spray on clothing fibers extends the drydown through the night.",
    tags: ["gender:her", "family:gourmand", "concentration:edp", "badge:limited"],
    badges: ["limited"],
    imagePrimary: "/products/vanille-gilde-a.svg",
    imageSecondary: "/products/vanille-gilde-b.svg",
    gallery: [
      "/products/vanille-gilde-a.svg",
      "/products/vanille-gilde-b.svg",
      "/products/placeholder-label.svg",
      "/products/placeholder-lifestyle.svg",
      "/products/placeholder-texture.svg",
    ],
    relatedHandles: ["iris-solstice-edp", "amber-noir-edp"],
    rating: 4.7,
    reviewCount: 28,
    inStock: true,
  },
  {
    handle: "discovery-set-six",
    name: "Discovery Set",
    descriptor: "Six 2ml essentials for mapping your scent wardrobe",
    concentration: "EDP",
    family: "fresh",
    gender: "unisex",
    prices: [{ ml: 12, price: 48, sku: "NS-DS-12" }],
    topNotes: ["Assorted"],
    heartNotes: ["Assorted"],
    baseNotes: ["Assorted"],
    sillage: 3,
    longevity: 3,
    ingredients: ["Alcohol denat.", "Parfum"],
    countryOfOrigin: "France",
    story:
      "Six of our most requested compositions in travel vials—built so you can live with each scent before choosing a full bottle.",
    howToWear:
      "Wear one vial at a time over three days. Note how the drydown sits on your skin in heat and cool air.",
    tags: ["gender:unisex", "family:fresh", "concentration:edp", "badge:bestseller"],
    badges: ["bestseller", "new"],
    imagePrimary: "/products/discovery-a.svg",
    imageSecondary: "/products/discovery-b.svg",
    gallery: [
      "/products/discovery-a.svg",
      "/products/discovery-b.svg",
      "/products/placeholder-label.svg",
      "/products/placeholder-lifestyle.svg",
      "/products/placeholder-texture.svg",
    ],
    relatedHandles: ["amber-noir-edp", "citrus-atelier-edt"],
    rating: 4.9,
    reviewCount: 64,
    inStock: true,
  },
];

export const reviews: Review[] = [
  {
    id: "r1",
    productHandle: "amber-noir-edp",
    author: "M. Chen",
    rating: 5,
    title: "Evening staple",
    body: "Opens with peppered bergamot and settles into a soft, smoked amber. Lasts through a full dinner without reapplication.",
    verified: true,
    date: "2026-03-12",
  },
  {
    id: "r2",
    productHandle: "amber-noir-edp",
    author: "S. Okonkwo",
    rating: 5,
    title: "Restrained and rich",
    body: "Not a nightclub oud. Quiet, warm, and very easy to wear into cooler weather.",
    verified: true,
    date: "2026-02-28",
  },
  {
    id: "r3",
    productHandle: "iris-solstice-edp",
    author: "A. Brandt",
    rating: 4,
    title: "Powdered and modern",
    body: "The iris is powdery without feeling dusty. Projects well for an office scent.",
    verified: true,
    date: "2026-04-02",
  },
  {
    id: "r4",
    productHandle: "cedar-rift-edt",
    author: "J. Torres",
    rating: 5,
    title: "Clean woods",
    body: "Dry cedar with a pepper edge. Daily driver for warm climates.",
    verified: true,
    date: "2026-01-19",
  },
];

export function getProduct(handle: string): Product | undefined {
  return products.find((p) => p.handle === handle);
}

export function getProductsByTag(tag: string): Product[] {
  return products.filter((p) => p.tags.includes(tag));
}

export function getBestsellers(): Product[] {
  return products.filter((p) => p.badges.includes("bestseller"));
}

export function getRelated(product: Product): Product[] {
  return product.relatedHandles
    .map((h) => getProduct(h))
    .filter((p): p is Product => Boolean(p));
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.descriptor.toLowerCase().includes(q) ||
      p.family.toLowerCase().includes(q) ||
      p.topNotes.some((n) => n.toLowerCase().includes(q)) ||
      p.heartNotes.some((n) => n.toLowerCase().includes(q)) ||
      p.baseNotes.some((n) => n.toLowerCase().includes(q)) ||
      p.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

export function getReviews(handle: string): Review[] {
  return reviews.filter((r) => r.productHandle === handle);
}
