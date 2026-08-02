export const siteConfig = {
  name: "NS Perfume",
  tagline: "Apothecary restraint. Editorial clarity.",
  url: "https://nsperfume.com",
  announcement:
    "Complimentary shipping over Rs 8,000 · Free returns on eligible orders · New: Iris Solstice",
  description:
    "NS Perfume is a fragrance house with honest scent pyramids, clear sillage ratings, and prices that convert into the currency you choose.",
  email: "care@nsperfume.com",
  phone: "+92 300 0000000",
} as const;

export const navLinks = [
  { label: "Our Story", href: "/about" },
  { label: "Journal", href: "/journal" },
  { label: "Find Your Scent", href: "/find-your-scent" },
  { label: "Contact", href: "/contact" },
] as const;

export const shopMegaMenu = {
  gender: [
    { label: "For Her", href: "/collections/for-her" },
    { label: "For Him", href: "/collections/for-him" },
    { label: "Unisex", href: "/collections/unisex" },
  ],
  family: [
    { label: "Floral", href: "/collections/floral" },
    { label: "Woody", href: "/collections/woody" },
    { label: "Oriental & Amber", href: "/collections/oriental" },
    { label: "Fresh & Citrus", href: "/collections/fresh" },
    { label: "Gourmand", href: "/collections/gourmand" },
  ],
  type: [
    { label: "Eau de Parfum", href: "/collections/eau-de-parfum" },
    { label: "Eau de Toilette", href: "/collections/eau-de-toilette" },
    { label: "Discovery & Travel Size", href: "/collections/discovery" },
    { label: "Gift Sets", href: "/collections/gift-sets" },
  ],
  featured: [
    { label: "New Arrivals", href: "/collections/new-arrivals" },
    { label: "Bestsellers", href: "/collections/bestsellers" },
    { label: "Limited Edition", href: "/collections/limited-edition" },
  ],
} as const;

/** Footer link map — keep every public storefront route represented once. */
export const footerColumns = {
  shop: [
    { label: "Shop All", href: "/products" },
    { label: "All Collections", href: "/collections" },
    { label: "Bestsellers", href: "/collections/bestsellers" },
    { label: "New Arrivals", href: "/collections/new-arrivals" },
    { label: "Limited Edition", href: "/collections/limited-edition" },
    { label: "Gift Sets", href: "/collections/gift-sets" },
    { label: "Gift Cards", href: "/gift-cards" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Account", href: "/account" },
    { label: "Search", href: "/search" },
    { label: "Cart", href: "/cart" },
  ],
  collections: [
    { label: "For Her", href: "/collections/for-her" },
    { label: "For Him", href: "/collections/for-him" },
    { label: "Unisex", href: "/collections/unisex" },
    { label: "Floral", href: "/collections/floral" },
    { label: "Woody", href: "/collections/woody" },
    { label: "Oriental & Amber", href: "/collections/oriental" },
    { label: "Fresh & Citrus", href: "/collections/fresh" },
    { label: "Gourmand", href: "/collections/gourmand" },
  ],
  care: [
    { label: "FAQ", href: "/faq" },
    { label: "Shipping & Returns", href: "/shipping-returns" },
    { label: "Track My Order", href: "/track-order" },
    { label: "Contact Us", href: "/contact" },
    { label: "Concentration Guide", href: "/faq#concentration" },
  ],
  company: [
    { label: "Our Story", href: "/about" },
    { label: "Ingredients & Sourcing", href: "/about#sourcing" },
    { label: "Press", href: "/about#press" },
    { label: "Journal", href: "/journal" },
    { label: "Find Your Scent", href: "/find-your-scent" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/policies/privacy" },
    { label: "Terms of Service", href: "/policies/terms" },
    { label: "Refund Policy", href: "/policies/refund" },
    { label: "Shipping Policy", href: "/policies/shipping" },
  ],
} as const;

export const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/nsperfume",
    slug: "instagram" as const,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/nsperfume",
    slug: "facebook" as const,
  },
  {
    label: "Pinterest",
    href: "https://www.pinterest.com/nsperfume",
    slug: "pinterest" as const,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@nsperfume",
    slug: "tiktok" as const,
  },
  {
    label: "X",
    href: "https://x.com/nsperfume",
    slug: "x" as const,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@nsperfume",
    slug: "youtube" as const,
  },
] as const;

export const faqItems = [
  {
    question: "Are your fragrances authentic?",
    answer:
      "Every bottle ships from our fulfilled inventory. We source materials through registered fragrance houses and never resell gray-market stock.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Domestic orders typically leave within two business days and arrive in three to seven days. International timelines vary by customs clearance.",
  },
  {
    question: "What is your return policy?",
    answer:
      "Unopened bottles may be returned within 30 days. For opened products with a genuine quality issue, contact customer care with your order number.",
  },
  {
    question: "What do EDP and EDT mean?",
    answer:
      "They describe oil concentration. EDP usually lasts longer and projects fuller. EDT opens brighter and may need reapplication. Parfum is denser still, so use fewer sprays.",
  },
  {
    question: "Do you list ingredients?",
    answer:
      "Yes. Each product page includes a core ingredients list plus country of origin. Allergens required on labeling appear on the packing insert.",
  },
  {
    question: "How should I store perfume?",
    answer:
      "Keep bottles away from direct sun and heat. A cool, dark drawer preserves top notes longer than a sunny bathroom shelf.",
  },
] as const;

export const policies: Record<
  string,
  { title: string; sections: { heading: string; body: string }[] }
> = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "Information we collect",
        body: "We collect account details, order history, and device data needed to fulfill purchases and improve the storefront. Payment card data is handled by our payment processor.",
      },
      {
        heading: "How we use information",
        body: "Order data fulfills delivery. Email addresses send transactional notices and, only with consent, product updates. You may unsubscribe at any time.",
      },
      {
        heading: "Contact",
        body: "Privacy questions: privacy@nsperfume.com.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: [
      {
        heading: "Use of the site",
        body: "By browsing or ordering, you agree to accurate account information and lawful use of the storefront.",
      },
      {
        heading: "Products",
        body: "Fragrance descriptions and performance meters are guides based on formula composition. Skin chemistry alters how a scent opens and lasts.",
      },
      {
        heading: "Limitation",
        body: "To the extent permitted by law, NS Perfume is not liable for indirect damages arising from product use beyond standard consumer protections.",
      },
    ],
  },
  refund: {
    title: "Refund Policy",
    sections: [
      {
        heading: "Eligibility",
        body: "Unopened items in original packaging may be returned within 30 days of delivery for a refund to the original payment method.",
      },
      {
        heading: "Opened products",
        body: "Opened bottles are final sale unless there is a verified quality defect. Contact care@nsperfume.com within seven days of delivery for review.",
      },
      {
        heading: "Process",
        body: "Approved refunds process within five to ten business days after we receive the return.",
      },
    ],
  },
  shipping: {
    title: "Shipping Policy",
    sections: [
      {
        heading: "Processing",
        body: "Orders placed before 2pm local warehouse time ship the next business day when the item is in stock.",
      },
      {
        heading: "Rates",
        body: "Standard domestic shipping is calculated at checkout. Orders over $75 qualify for complimentary standard shipping where available.",
      },
      {
        heading: "Damage",
        body: "Inspect packages on arrival. Report broken bottles within 48 hours with photos for a replacement or refund.",
      },
    ],
  },
};

export const trustBadges = [
  "Cash on delivery in major cities",
  "Complimentary shipping over Rs 8,000",
  "Easy returns on eligible sealed bottles",
  "Authenticity checked before dispatch",
] as const;

export const testimonials = [
  {
    quote: "Amber Noir lasts through dinner without turning heavy. That is rare.",
    attribution: "Vogue Beauty Desk",
  },
  {
    quote: "Finally a fragrance site that lists notes and sillage like it matters.",
    attribution: "City Fragrance Weekly",
  },
  {
    quote: "Iris Solstice is daylight powder without the grand-mère dust.",
    attribution: "Scent Letter",
  },
] as const;
