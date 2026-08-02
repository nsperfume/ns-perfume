---
name: NS Perfume
category: Fragrance / Beauty E-commerce
description: >
  A modern luxury fragrance brand on the Ivory & Brass light system:
  warm ivory canvas, warm-white surfaces, warm charcoal text, a single
  flat brass accent, and rose-wood scarcity signals. Restrained,
  editorial, and grounded in the language of perfumery — notes,
  sillage, concentration — rather than generic "luxury gold" decoration.
  Fully light: no dark inverted page sections.
---

# NS Perfume — DESIGN.md

**How to use this file:** this is the single source of truth for how nsperfume.com looks, feels, and is structured. Reference it for every page, section, email, and product listing. It defines the visual system, the component library, the page architecture, and the SEO rules — deliberately with **no technology or platform implementation details**, so it stays valid regardless of which theme, editor, or developer builds it.

---

## 1. Visual Theme & Atmosphere

NS Perfume reads like an apothecary label crossed with an editorial magazine — not a nightclub and not a dark mode “prestige” fashion site. The category is full of clichés: black-and-gold gradients, glitter, oversized cursive, bottles on pure clinical white. This system avoids all of that.

**Palette name: Ivory & Brass.** Everything lives on warm white/ivory. There are **no dark inverted sections** on the storefront — not for header, footer, brand story, or collection banners. Rhythm comes from ivory canvas vs warm-white paper surfaces, hairline rules, and occasional muted-ivory bands — never from flipping the page black.

**The mood:** quiet confidence. Soft ivory that feels held, not harsh. Warm charcoal for structure (pure `#000000` feels hard on ivory). One accent — burnished brass, flat, never a gradient or shine. Generous negative space around every bottle; restraint *is* the luxury signal.

**The signature device — the Scent Pyramid:** every fragrance is described by three note layers (top, heart, base). This is a load-bearing concept in perfumery, so it is the site’s motif: inverted triangle in thin brass hairlines on light canvas — on product pages, as a homepage divider, and as a quiet transition motif. Slightly theatrical; everything else stays quiet.

**Density:** editorial, not dashboard-dense. Long, breathing sections. Copy is a design element, set in generous measure, never crammed into cards.

**Optional cooler accent (catalog-dependent):** if brass feels too warm against a greener floral/citrus line, swap only the accent to muted sage `#6B7259` (hover `#525947`) and keep every other token. Sage = botanical; brass = oud/amber. Default for this project remains brass.

---

## 2. Color Palette & Roles — Ivory & Brass

Light system only. No gold gradients, no metallic shine, no dark full-bleed page bands.

| Token | Hex | Role |
|---|---|---|
| `{colors.canvas}` | `#FBF7F0` | Primary background — soft ivory for nearly everything |
| `{colors.paper}` | `#FFFFFF` | Elevated surface — product cards, modals, header bar, form fields — one step lighter so surfaces “lift” |
| `{colors.ink}` | `#2B2419` | Primary text, icons, structural controls — warm charcoal, not pure black |
| `{colors.taupe}` | `#8B7E6D` | Secondary text, captions, meta, muted labels |
| `{colors.brass}` | `#A67C3D` | Single accent — CTAs, links, prices, scent-pyramid strokes |
| `{colors.brass-deep}` | `#7C5B2B` | Hover / pressed brass only |
| `{colors.hairline}` | `#E8DFCB` | 1px borders and section dividers |
| `{colors.rosewood}` | `#8B4A45` | Scarcity only — sale, low stock, limited edition |
| `{colors.muted}` | `#F3EDE3` | Optional soft band alternate (still ivory family) for long-scroll pacing |

**Tokens deliberately removed / never reintroduced on storefront UI:**
- Dark “canvas-deep” inverted page sections
- Dark hairline on black panels
- Pure `#000000` body text
- Clinical pure white as the *page* background (page uses ivory; *cards* use warm white `#FFFFFF`)

**Rules:**
- Never use more than one accent color in a single section. Brass is the accent; rosewood is reserved for scarcity so it keeps urgency.
- No gradients. No gold-foil or metallic-shine effects. Flat color only.
- Page background is ivory. Elevated UI (cards, header, drawer) is warm white.
- Header and footer are light: paper/canvas with hairline borders — never charcoal slabs.

---

## 3. Typography Rules

Two type families plus one numeral face — avoid the category’s overused pair (swirly script logo + Playfair Display everywhere).

- **Display — Fraunces** (Google Fonts). Soft, slightly flared serif. H1/H2, product names, pull quotes only. Never below 22px, never for paragraphs, never all-caps (use mono eyebrows for caps).
- **Body — General Sans** ideally; **Public Sans** or **Work Sans** are free substitutes when General Sans is unavailable. Navigation, buttons, descriptions, UI copy. Humanist, quiet, carries the work without fighting the serif.
- **Numerals — IBM Plex Mono.** Prices, SKUs, sizes (`30ML` / `50ML` / `100ML`), and eyebrow labels only — not full sentences. The apothecary-label detail.

| Token | Size / Line-height | Weight | Use |
|---|---|---|---|
| `{typography.display-xl}` | 64px / 1.05 | 400 | Homepage hero headline |
| `{typography.display-lg}` | 44px / 1.1 | 400 | Section headlines, product name on PDP |
| `{typography.display-md}` | 32px / 1.15 | 400 | Collection titles, journal headlines |
| `{typography.heading-sm}` | 22px / 1.3 | 500 (body face) | Card titles, sub-sections |
| `{typography.body-lg}` | 18px / 1.6 | 400 | Product description, journal body |
| `{typography.body}` | 16px / 1.6 | 400 | Default UI and paragraph text |
| `{typography.caption}` | 13px / 1.5 | 400 | Meta text, helper copy |
| `{typography.eyebrow}` | 12px / 1.4 | 500 mono, uppercase, 0.12em tracking | Section labels, concentration badges |
| `{typography.price}` | 18px / 1.3 | 500 mono | Price display everywhere |

**Rules:**
- One H1 per page, always in the display face.
- Never all-caps for display; mono eyebrows for caps treatments.
- Body measure 55–75 characters for paragraphs longer than two sentences.

---

## 4. Component Stylings

### Buttons
- `{components.button-primary}` — `{colors.ink}` background, `{colors.paper}` text, `{typography.eyebrow}` (uppercase, tracked), `{rounded.xs}`. Hover: background `{colors.brass-deep}`, light text. Rectangular — never a pill.
- `{components.button-secondary}` — transparent, 1px `{colors.ink}` border, ink text. Hover: border and text `{colors.brass}`.
- `{components.button-ghost}` — no border, brass text, underline on hover. Tertiary (“View all”, “Read more”).

### Commerce-specific
- `{components.scent-pyramid}` — inverted triangle of three brass hairline bands (Top / Heart / Base), labels in eyebrow, notes in body. Always on light canvas. Full-width divider on homepage between sections.
- `{components.performance-meter}` — Sillage + Longevity, 5 segments; filled `{colors.brass}`, empty `{colors.hairline}`.
- `{components.concentration-badge}` — full-pill only exception (`{rounded.full}`): EDP / EDT / PARFUM on paper + 1px ink border.
- `{components.size-selector}` — rectangular 30 / 50 / 100 ML mono swatches; selected ink border + paper fill; unselected hairline; min touch 44×44.

### Cards & surfaces
- `{components.product-card}` — paper surface, soft radius, no shadow at rest. Hover: 1px hairline + image crossfade (no scale).
- `{components.feature-panel}` — paper or muted band, large padding, hairline optional — never a black panel.
- `{components.quote-block}` — display quote, brass rule above, caption attribution.

### Forms & inputs
- Paper bg, 1px hairline, `{rounded.xs}`, focus border brass, no glow.

### Chrome
- **Header:** warm white paper bar, hairline bottom, charcoal nav, brass hover.
- **Announcement bar:** muted ivory or canvas, taupe/ink mono eyebrow.
- **Footer:** canvas or muted with hairline top — light text hierarchy (ink / taupe), never dark slab.

---

## 5. Layout Principles

**Base unit: 8px.**

| Token | Value | Use |
|---|---|---|
| `{spacing.xxs}` | 4px | Icon gaps, tight label spacing |
| `{spacing.xs}` | 8px | Chip/badge padding |
| `{spacing.sm}` | 12px | Form field padding |
| `{spacing.md}` | 16px | Default component padding |
| `{spacing.lg}` | 24px | Card padding |
| `{spacing.xl}` | 32px | Panel padding |
| `{spacing.xxl}` | 48px | Feature-panel padding |
| `{spacing.section}` | 96px | Vertical padding between homepage sections |

- **Grid:** 12-column, max content width 1280px, gutter 24px. Product grids 4 / 3 / 2 (desktop / tablet / mobile).
- **Whitespace:** bottle gets the most negative space; if a layout feels full, remove content before shrinking margins.
- **Section rhythm (light only):** alternate `{colors.canvas}` and `{colors.paper}` or soft `{colors.muted}` bands — never black/ivory flip. Brass stays readable on all three.

---

## 6. Depth & Elevation

Flat by design — heavy shadow and glassmorphism read as SaaS, not fragrance.

- Rest: no shadow. Separation via paper-on-canvas or 1px hairline.
- Card hover only: `0 4px 16px rgba(43, 36, 25, 0.06)`.
- Modal/drawer: `0 12px 40px rgba(43, 36, 25, 0.12)`, paper background.
- Never stack border + shadow on the same resting surface.

---

## 7. Do's and Don'ts

**Do:**
- Keep the full storefront light (Ivory & Brass).
- Let the bottle dominate heroes and product shots.
- Use real note names (bergamot, oud, iris, amber — never “Note 1”).
- One accent per screen; mono for every price, size, SKU.

**Don't:**
- Don’t introduce dark inverted full sections for “luxury contrast.”
- Don’t use gold gradients, foil, glitter, or pure black type on ivory.
- Don’t set display below 22px or in all-caps; don’t pill primary buttons.
- Don’t stack more than one trust-badge row on the product page.
- Don’t animate on scroll for its own sake — only product-card crossfade and ~200ms fade-up on section entry.

---

## 8. Responsive Behavior

| Breakpoint | Width | Behavior |
|---|---|---|
| `{breakpoint.mobile}` | < 480px | Single column, sticky ATC on PDP, hamburger nav |
| `{breakpoint.mobile-lg}` | 480–767px | 2-up product grid, hamburger nav |
| `{breakpoint.tablet}` | 768–1023px | 3-up product grid, condensed nav |
| `{breakpoint.desktop}` | 1024–1439px | 4-up product grid, full nav + mega menu |
| `{breakpoint.desktop-lg}` | ≥ 1440px | Content capped at 1280px |

- Touch target min 44×44 including size swatches.
- Scent Pyramid stacks vertically on mobile.
- Mega menu → accordion on mobile.
- Sticky ATC mobile only after primary CTA leaves viewport; hide when footer enters.

---

## 9. Agent Prompt Guide

> Build [section] for nsperfume.com using DESIGN.md **Ivory & Brass**. Canvas `{colors.canvas}` (`#FBF7F0`), elevated surfaces `{colors.paper}` (`#FFFFFF`), text `{colors.ink}` (`#2B2419`), secondary `{colors.taupe}`, accent `{colors.brass}` only — no dark inverted bands, no gradients, no shadows at rest. Headlines Fraunces, body Public Sans (or General Sans), prices/sizes IBM Plex Mono. Buttons rectangular (`{rounded.xs}`), never pills.

Ready-made prompts:
- *"Build the homepage hero using DESIGN.md — ivory canvas, warm-white product plane, display-xl headline, single brass CTA."*
- *"Build a product page using DESIGN.md — scent-pyramid and performance-meter, size-selector, concentration badge, light paper surfaces only."*
- *"Build the collection grid using DESIGN.md — 4-up product-card grid, filter bar, SEO block below the fold, light banner (no black band)."*

---

## Part II — Store Architecture, Pages & Admin Setup

### Navigation

**Header — primary nav (light bar):**
`Shop` (mega menu) · `Our Story` · `Journal` · `Find Your Scent` · `Contact` — with search, currency, and cart at the right.

Shop mega menu columns:
1. **Shop by Gender** — For Her / For Him / Unisex
2. **Shop by Family** — Floral / Woody / Oriental & Amber / Fresh & Citrus / Gourmand
3. **Shop by Type** — Eau de Parfum / Eau de Toilette / Discovery & Travel Size / Gift Sets
4. **Featured** — New Arrivals / Bestsellers / Limited Edition (with one promotional tile)

**Footer (light):** four columns + newsletter on ivory/muted, hairline top — Shop, Customer Care, Company, Legal; newsletter + social + payment icons.

### Required pages

| Page | Purpose |
|---|---|
| Home | Brand entry — homepage blueprint below |
| Collection pages (×N) | Gender, family, curated groupings |
| Product pages (×N) | Per SKU — PDP blueprint |
| About / Our Story | Brand narrative |
| Journal + articles | SEO content |
| Find Your Scent | Quiz / guided selector |
| FAQ | Support |
| Shipping & Returns | Policy detail |
| Track My Order | Order lookup |
| Contact | Form + business info |
| Search | Empty → bestsellers |
| Cart & Checkout | Cart drawer + checkout |
| Gift Cards | Gift product |
| 404 | On-brand → Bestsellers / Shop |
| Policy pages | Privacy, Terms, Refund, Shipping |

### Homepage section order

1. Announcement bar (muted/canvas)
2. Header (paper)
3. Hero — ivory canvas, product on paper plane, display-xl, brass CTA
4. Shop by Collection tiles
5. Bestsellers — product cards + performance teaser (muted band optional)
6. Brand story — scent pyramid divider on canvas (not black), story + About link
7. Find Your Scent teaser on paper card
8. Testimonials (customers; separate from PDP reviews)
9. Journal preview (3)
10. UGC / Instagram-style grid
11. Newsletter
12. Footer (light)

### Product page section order

1. Breadcrumb
2. Gallery + info: name, concentration badge, mono price, descriptor, size selector, performance meter, ATC, one trust row
3. Tabs: Scent Pyramid / Story / How to Wear
4. Ingredients & sourcing
5. Product reviews (not site testimonials)
6. You May Also Love
7. Recently viewed

### Collection page section order

1. Light collection banner (canvas/muted)
2. Filter/sort
3. Product grid
4. Pagination
5. SEO copy ~150 words

### Admin setup — collections, tags & metafields

- Prefer automated collections from tags.
- Tags: `gender:*`, `family:*`, `concentration:*`, `badge:*`
- Metafields: notes layers, concentration, sizes, sillage, longevity, ingredients, origin
- Images: consistent lighting against ivory; WebP; `ns-perfume-[handle]-[view].webp`

---

## Part III — SEO Rules

See also project rule `.cursor/rules/content-seo-layout.mdc` (always applied).

- **One H1** per page that matches search intent (product name, collection name, or page question)
- Primary keyword appears naturally in the H1, one early paragraph, and one image alt. Never stuffed.
- **Title tags:** under 60 characters, written as a clickable sentence. Prefer hyphen or plain words over en dashes. Unique per page. Pattern example: `{Name} {Descriptor} | NS Perfume`
- **Meta descriptions:** under 155 characters; occasion or benefit + a real note or fact + soft next step
- **Paragraphs:** 2 to 4 sentences each. Avoid long unbroken walls of text.
- **PDP depth:** at least 100 to 150 words of genuine descriptive prose below the fold (Story / How to Wear), not only bullets
- **Internal links:** every journal article links to at least one product or collection with descriptive anchors (never "click here")
- **Alt text:** describes what is in the image specifically
- **Schema:** Product, Organization, BreadcrumbList, FAQPage, Article as applicable
- **Canonicals** on filtered collection URLs
- **Speed:** lazy below-fold, WebP, minimal third parties
- **Mobile-first** validation

---

## Part IV — Content Voice and Copywriting

Follow `.cursor/rules/content-seo-layout.mdc` in full. Summary:

- No em dash or en dash as sentence connectors. Use period, comma, or "and" / "but".
- No semicolons joining independent clauses. Split into two sentences.
- Vary sentence length. No stacked short punchy fragments. No rhetorical openers. No exclamation marks in marketing copy.
- Banned fluff words (elevate, seamless, journey, timeless elegance, unparalleled, rule-of-three adjective stacks, etc.) as listed in the project rule.
- Sensory and checkable detail: real notes, times of day, climate, sillage numbers.
- Write for the wearer. Honest specificity over urgency gimmicks. Plain CTAs ("Shop Amber Noir", "Add to bag").
- Social proof near the decision point (near add to bag), not only at the page bottom.
- Empty states always offer a next action.

---

## Part V — Layout / Viewport Rules

Follow `.cursor/rules/content-seo-layout.mdc` for full-viewport homepage sections.

- Desktop tablet: major homepage bands fill one viewport each (utilities: `.section-hero`, `.section-viewport`). Content centered as a "slide."
- Hero: `min-height: calc(100dvh - var(--chrome-height))` where chrome is announcement + sticky header.
- Mobile: full-viewport priority on hero. Later sections may grow when content requires it, without empty space padding.
- Prefer `100dvh` over `100vh`. Test at 375, 768, 1024, 1440.

---

## Known Gaps — confirm before build

- Final bottle photography should be reviewed on `#FBF7F0` ivory before locking hero treatments
- Oil/attar formats may expand size/concentration options
- Multi-currency is a commerce concern; visual system stays Ivory and Brass regardless
- Final copy still lands in the voice of Part IV