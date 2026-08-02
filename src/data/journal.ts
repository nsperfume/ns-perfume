import type { JournalPost } from "@/lib/types";

export const journalPosts: JournalPost[] = [
  {
    slug: "how-to-read-a-scent-pyramid",
    title: "How to read a scent pyramid",
    excerpt:
      "Top, heart, and base notes are not marketing layers—they describe how a formula evolves on skin over hours.",
    body: [
      "A scent pyramid is a practical map, not a poetic invention. Top notes arrive first and often fade within thirty to sixty minutes. Heart notes form the character of the perfume for most of its life on skin. Base notes linger longest—woods, resins, musks, and amber that settle after the brighter materials quiet down.",
      "When you shop NS Perfume product pages, the inverted brass pyramid shows those three bands with actual materials: bergamot, iris butter, oud, tonka. Read the top if you care about the first impression; read the base if you care about how you leave a room hours later.",
      "Pair the pyramid with the performance meter. High sillage with a heavy base may feel dense in small offices. Soft sillage with bright tops may need a midday refresh in heat. Neither is wrong—matching structure to day is the point.",
    ],
    date: "2026-02-10",
    readTime: "5 min",
    relatedProductHandle: "amber-noir-edp",
    relatedCollectionHandle: "bestsellers",
    imageTone: "#E8DFC8",
  },
  {
    slug: "layering-fragrance-without-muddying",
    title: "Layering fragrance without muddying the drydown",
    excerpt:
      "Two compatible formulas can build a wardrobe. The rule is shared bases, not competing tops.",
    body: [
      "Layering works when materials already live in the same family. A citrus EDT over a woody base can brighten a morning without fighting cedar or musk. Two heavy ambers stacked together often become opaque and sugary—harder to identify, harder to wear.",
      "Start with the softer, lower-sillage scent closest to skin. Wait five minutes, then add a single spray of the second composition at the collar or wrists. Smell after twenty minutes when the heart is present.",
      "If you are exploring, begin with the Discovery Set. Wear each vial alone for three days before pairing. Your notes on heat, office air, and evening will be more useful than any suggested combo list.",
    ],
    date: "2026-03-04",
    readTime: "6 min",
    relatedProductHandle: "fig-verdure-edt",
    relatedCollectionHandle: "fresh",
    imageTone: "#D9E0D2",
  },
  {
    slug: "gifting-perfume-that-actually-fits",
    title: "Gifting perfume that actually fits",
    excerpt:
      "Skip guessing a signature bottle. Start with notes they already wear, climate, and occasion.",
    body: [
      "A good fragrance gift is specific. Ask what they already wear, or notice whether they lean clean, floral, wood, or sweet. Climate matters—heat burns through bright tops; cold air slows drydowns and favors ambers and parfums.",
      "Discovery and travel sizes reduce risk. Pair a set with a short note describing top and base materials rather than adjectives like \"luxurious.\" People remember bergamot and vetiver more than brand adjectives.",
      "If you already know the family, a gift set of bestseller bottles in smaller formats lets them live with the drydown before choosing 50 or 100ml.",
    ],
    date: "2026-04-18",
    readTime: "4 min",
    relatedProductHandle: "discovery-set-six",
    relatedCollectionHandle: "gift-sets",
    imageTone: "#E5D4C8",
  },
  {
    slug: "edp-vs-edt-what-changes",
    title: "EDP vs EDT: what actually changes",
    excerpt:
      "Concentration is not quality. It is oil load, which shapes longevity and how loud the trail can be.",
    body: [
      "Eau de toilette typically carries a lower perfume oil percentage than eau de parfum. You often feel more of the bright opening and may reapply earlier. Parfum and extrait sit denser and need fewer sprays.",
      "On NS Perfume labels, concentration badges sit beside price for a reason: a 50ml EDP is not automatically \"better\" than a 50ml EDT. Choose by day length, climate, and how close you work with other people.",
      "Use the longevity meter as a starting guide, then trust your own skin. Dry skin shortens most formulas; moisturized skin holds base notes longer.",
    ],
    date: "2026-05-01",
    readTime: "5 min",
    relatedProductHandle: "cedar-rift-edt",
    relatedCollectionHandle: "eau-de-parfum",
    imageTone: "#D8D2C4",
  },
];

export function getPost(slug: string): JournalPost | undefined {
  return journalPosts.find((p) => p.slug === slug);
}
