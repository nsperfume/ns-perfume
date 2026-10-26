export const siteConfig = {
  name: "NS Perfume",
  tagline: "Apothecary restraint. Editorial clarity.",
  url: "https://nsperfume.pk",
  announcement:
    "Complimentary shipping over Rs 8,000 · Free returns on eligible orders · New: Iris Solstice",
  description:
    "NS Perfume is a fragrance house with honest scent pyramids, clear sillage ratings, and prices that convert into the currency you choose.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "care@nsperfume.pk",
  /** Primary care line (JazzCash / Easypaisa / WhatsApp). No spaces for easy copy. */
  phone: "03067861412",
  contactName: "Asim Ali",
  location: {
    label: "NS Mart",
    detail: "Qila Didar Singh",
    mapsUrl:
      "https://www.google.com/maps/search/NS+Mart/@32.131237,74.0168304,17z?hl=en",
  },
  /** Mobile wallets accepted for prepaid orders (same as primary contact number). */
  wallets: {
    jazzcash: "03067861412",
    easypaisa: "03067861412",
  },
  /** Shown at checkout for bank deposit / transfer payment. */
  bankTransfer: {
    bankName: "Meezan Bank",
    accountTitle: "Asim Ali",
    accountNumber: "09110111027312",
    iban: "PK68MEZN0009110111027312",
    branch: "Qila Didar Singh (0911)",
    note: "Use your order number as the transfer reference. WhatsApp payment proof to 03067861412 if asked.",
  },
} as const;

export const navLinks = [
  { label: "Our story", href: "/about" },
  { label: "Journal", href: "/journal" },
  { label: "Find your scent", href: "/find-your-scent" },
  { label: "Contact", href: "/contact" },
] as const;

export const shopMegaMenu = {
  gender: [
    { label: "For her", href: "/collections/for-her" },
    { label: "For him", href: "/collections/for-him" },
    { label: "Unisex", href: "/collections/unisex" },
  ],
  family: [
    { label: "Floral", href: "/collections/floral" },
    { label: "Woody", href: "/collections/woody" },
    { label: "Oriental and amber", href: "/collections/oriental" },
    { label: "Fresh and citrus", href: "/collections/fresh" },
    { label: "Gourmand", href: "/collections/gourmand" },
  ],
  type: [
    { label: "Eau de Parfum", href: "/collections/eau-de-parfum" },
    { label: "Eau de Toilette", href: "/collections/eau-de-toilette" },
    { label: "Discovery and travel size", href: "/collections/discovery" },
    { label: "Gift sets", href: "/collections/gift-sets" },
  ],
  featured: [
    { label: "New arrivals", href: "/collections/new-arrivals" },
    { label: "Bestsellers", href: "/collections/bestsellers" },
    { label: "Limited edition", href: "/collections/limited-edition" },
  ],
} as const;

/** Footer link map. Account, wishlist, search and cart live in the header and mobile menu. */
export const footerColumns = {
  shop: [
    { label: "Shop all", href: "/products" },
    { label: "All collections", href: "/collections" },
    { label: "Bestsellers", href: "/collections/bestsellers" },
    { label: "New arrivals", href: "/collections/new-arrivals" },
    { label: "Limited edition", href: "/collections/limited-edition" },
    { label: "Gift sets", href: "/collections/gift-sets" },
    { label: "Gift cards", href: "/gift-cards" },
  ],
  collections: [
    { label: "For her", href: "/collections/for-her" },
    { label: "For him", href: "/collections/for-him" },
    { label: "Unisex", href: "/collections/unisex" },
    { label: "Floral", href: "/collections/floral" },
    { label: "Woody", href: "/collections/woody" },
    { label: "Oriental and amber", href: "/collections/oriental" },
    { label: "Fresh and citrus", href: "/collections/fresh" },
    { label: "Gourmand", href: "/collections/gourmand" },
  ],
  care: [
    { label: "FAQ", href: "/faq" },
    { label: "Shipping and returns", href: "/shipping-returns" },
    { label: "Track your order", href: "/track-order" },
    { label: "Contact us", href: "/contact" },
    { label: "Concentration guide", href: "/faq#concentration" },
  ],
  company: [
    { label: "Our story", href: "/about" },
    { label: "Ingredients and sourcing", href: "/about#sourcing" },
    { label: "Journal", href: "/journal" },
    { label: "Find your scent", href: "/find-your-scent" },
  ],
  legal: [
    { label: "Privacy policy", href: "/policies/privacy" },
    { label: "Terms of service", href: "/policies/terms" },
    { label: "Refund policy", href: "/policies/refund" },
    { label: "Shipping policy", href: "/policies/shipping" },
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
      "{{shipping}} In-stock orders usually leave within one business day.",
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
    title: "Privacy policy",
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
        body: "Privacy questions: privacy@nsperfume.pk.",
      },
    ],
  },
  terms: {
    title: "Terms of service",
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
    title: "Refund policy",
    sections: [
      {
        heading: "Eligibility",
        body: "Unopened items in original packaging may be returned within 30 days of delivery for a refund to the original payment method.",
      },
      {
        heading: "Opened products",
        body: "Opened bottles are final sale unless there is a verified quality defect. Contact care@nsperfume.pk within seven days of delivery for review.",
      },
      {
        heading: "Process",
        body: "Approved refunds process within five to ten business days after we receive the return.",
      },
    ],
  },
  shipping: {
    title: "Shipping policy",
    sections: [
      {
        heading: "Processing",
        body: "Orders placed before 2pm local warehouse time ship the next business day when the item is in stock.",
      },
      {
        heading: "Rates",
        body: "{{shipping}}",
      },
      {
        heading: "Damage",
        body: "Inspect packages on arrival. Report broken bottles within 48 hours with photos for a replacement or refund.",
      },
    ],
  },
};

