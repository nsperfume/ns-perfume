import type { Collection } from "@/lib/types";

const PAY = "Pay cash on delivery anywhere in Pakistan, or by bank transfer, JazzCash or Easypaisa.";
const DETAIL = "Every bottle lists its top, heart and base notes, how far it projects and how long it lasts, so you can choose by occasion and weather instead of guessing.";

/**
 * Standard collections. Created once on a new database (see store-data) so every
 * menu link has a page; the owner edits them in admin after that. Filter tags come
 * from the product form automatically, so most of these fill themselves. Copy stays
 * general, because the catalog changes: no product names, no claims about stock.
 * The gender pages include unisex scents, which suit both.
 */
export const collections: Collection[] = [
  {
    handle: "for-her",
    title: "For her",
    description: "Perfumes for women, plus unisex scents that suit her just as well.",
    seoCopy: `Shop perfumes for women in Pakistan at NS Perfume, from soft florals to warm evening scents. ${DETAIL} ${PAY}`,
    bannerTone: "canvas",
    filterTags: ["gender:her", "gender:unisex"],
  },
  {
    handle: "for-him",
    title: "For him",
    description: "Perfumes for men, plus unisex scents that suit him just as well.",
    seoCopy: `Shop perfumes for men in Pakistan at NS Perfume, from fresh daily wear to deep oud and amber for the evening. ${DETAIL} ${PAY}`,
    bannerTone: "deep",
    filterTags: ["gender:him", "gender:unisex"],
  },
  {
    handle: "unisex",
    title: "Unisex",
    description: "Scents made to be shared, for men and women alike.",
    seoCopy: `Unisex perfumes at NS Perfume are made for anyone who likes the scent, whoever wears it. ${DETAIL} ${PAY}`,
    bannerTone: "canvas",
    filterTags: ["gender:unisex"],
  },
  {
    handle: "floral",
    title: "Floral",
    description: "Rose, jasmine and other flowers, from soft to rich.",
    seoCopy: `Floral perfumes centre on flowers such as rose and jasmine, and suit daytime wear and special occasions alike. ${DETAIL} ${PAY}`,
    bannerTone: "canvas",
    filterTags: ["family:floral"],
  },
  {
    handle: "woody",
    title: "Woody",
    description: "Cedar, sandalwood and vetiver, dry and warm.",
    seoCopy: `Woody perfumes are built on notes such as cedar, sandalwood and vetiver, for a dry, warm scent that stays close and wears well all day. ${DETAIL} ${PAY}`,
    bannerTone: "deep",
    filterTags: ["family:woody"],
  },
  {
    handle: "oriental",
    title: "Oriental and amber",
    description: "Oud, amber and spice, deep and long lasting.",
    seoCopy: `Oriental and amber perfumes use rich notes such as oud, amber, resin and spice, a favourite for evenings, weddings and cooler weather. ${DETAIL} ${PAY}`,
    bannerTone: "deep",
    filterTags: ["family:oriental"],
  },
  {
    handle: "fresh",
    title: "Fresh and citrus",
    description: "Bright, clean scents for heat and everyday wear.",
    seoCopy: `Fresh and citrus perfumes open bright and clean, which makes them an easy choice for Pakistani summers, offices and daily wear. ${DETAIL} ${PAY}`,
    bannerTone: "canvas",
    filterTags: ["family:fresh", "family:citrus"],
  },
  {
    handle: "citrus",
    title: "Citrus",
    description: "Lemon, bergamot and orange, bright and light.",
    seoCopy: `Citrus perfumes open with notes such as lemon, bergamot and orange. They feel light in the heat and suit daytime wear. ${DETAIL} ${PAY}`,
    bannerTone: "canvas",
    filterTags: ["family:citrus"],
  },
  {
    handle: "aromatic",
    title: "Aromatic",
    description: "Lavender, herbs and spice, clean and confident.",
    seoCopy: `Aromatic perfumes draw on lavender, herbs and spice for a clean, confident scent that works well for office and daily wear. ${DETAIL} ${PAY}`,
    bannerTone: "canvas",
    filterTags: ["family:aromatic"],
  },
  {
    handle: "gourmand",
    title: "Gourmand",
    description: "Vanilla, caramel and warm spice, sweet and cosy.",
    seoCopy: `Gourmand perfumes use warm, edible notes such as vanilla and caramel. They feel cosy and suit evenings and cooler weather. ${DETAIL} ${PAY}`,
    bannerTone: "canvas",
    filterTags: ["family:gourmand"],
  },
  {
    handle: "eau-de-parfum",
    title: "Eau de Parfum",
    description: "A higher concentration of perfume oil for longer wear.",
    seoCopy: `Eau de Parfum holds more perfume oil than Eau de Toilette, so it usually lasts longer on skin and has a richer scent. ${DETAIL} ${PAY}`,
    bannerTone: "canvas",
    filterTags: ["concentration:edp"],
  },
  {
    handle: "eau-de-toilette",
    title: "Eau de Toilette",
    description: "A lighter concentration for heat and daytime wear.",
    seoCopy: `Eau de Toilette holds less perfume oil than Eau de Parfum, so it feels lighter and suits hot days and offices. ${DETAIL} ${PAY}`,
    bannerTone: "canvas",
    filterTags: ["concentration:edt"],
  },
  {
    handle: "parfum",
    title: "Parfum",
    description: "The richest concentration, where a little goes a long way.",
    seoCopy: `Parfum has the highest concentration of perfume oil in the range, so a small amount goes a long way. ${DETAIL} ${PAY}`,
    bannerTone: "deep",
    filterTags: ["concentration:parfum"],
  },
  {
    handle: "discovery",
    title: "Discovery and travel size",
    description: "Small sizes for testing a scent on your own skin.",
    seoCopy: `Small sizes let you wear a perfume for a few days before you buy a full bottle, and they travel easily. ${PAY}`,
    bannerTone: "canvas",
  },
  {
    handle: "gift-sets",
    title: "Gift sets",
    description: "Perfume gifts for birthdays, weddings and Eid.",
    seoCopy: `Perfume makes a thoughtful gift for birthdays, weddings and Eid. Gift wrap is offered at checkout when available. ${PAY}`,
    bannerTone: "deep",
  },
  {
    handle: "wedding-season",
    title: "Wedding season",
    description: "Scents that last through mehndi, baraat and walima.",
    seoCopy: `Wedding functions run long, so choose a perfume with the wear time to match. ${DETAIL} ${PAY}`,
    bannerTone: "deep",
  },
  {
    handle: "new-arrivals",
    title: "New arrivals",
    description: "The latest perfumes added to the store.",
    seoCopy: `The newest perfumes at NS Perfume. ${DETAIL} ${PAY}`,
    bannerTone: "canvas",
    filterTags: ["badge:new"],
  },
  {
    handle: "bestsellers",
    title: "Bestsellers",
    description: "The perfumes customers order most.",
    seoCopy: `The perfumes our customers order most. ${DETAIL} ${PAY}`,
    bannerTone: "deep",
    filterTags: ["badge:bestseller"],
  },
  {
    handle: "limited-edition",
    title: "Limited edition",
    description: "Small batches, available while stock lasts.",
    seoCopy: `Limited editions are available while stock lasts, so check availability on the product page. ${DETAIL} ${PAY}`,
    bannerTone: "deep",
    filterTags: ["badge:limited"],
  },
];
