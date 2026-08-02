/** Static storefront imagery under `public/assets` (optimized WebP). */
export const siteImages = {
  homeHero: "/assets/hero-image.webp",
  shopByCollection: {
    forHer: "/assets/sbc-for-her.webp",
    forHim: "/assets/sbc-for-him.webp",
    unisex: "/assets/sbc-for-unisex.webp",
    giftSets: "/assets/sbc-for-gifts.webp",
  },
  storyBand: "/assets/homepage-story-band.webp",
  /** Shared banner for every `/collections/*` page */
  collectionsHero: "/assets/hero-collections.webp",
  /** Shop all / catalog header */
  shopHero: "/assets/hero-products.webp",
  /** Right panel in Shop mega-menu sheet */
  navbarShop: "/assets/navbar-shop-section.webp",
  /** Home teaser + `/find-your-scent` hero */
  findYourScent: "/assets/find-your-scent.webp",
  cart: "/assets/cart.webp",
  wishlist: "/assets/wishlist.webp",
  search: "/assets/search.webp",
  giftCards: "/assets/gift-cards.webp",
  about: "/assets/about-our-story.webp",
  contact: "/assets/contact.webp",
  /** Homepage “Worn in the wild” tiles */
  wornInWild: [
    "/assets/worn-in-wild-1.webp",
    "/assets/worn-in-wild-2.webp",
    "/assets/worn-in-wild-3.webp",
  ],
} as const;

export const wornInWildAlts = [
  "Wrist pulse point with fragrance at golden hour",
  "Day wear collar and soft light for perfume in daily life",
  "Evening fabric close-up suggesting worn scent",
] as const;
