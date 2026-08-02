# NS Perfume — AI Image Generation Brief

Use this file when generating storefront imagery (ChatGPT Images, Midjourney, Flux, etc.). Generate clean commercial photography. Export as **WebP** (quality 80–85). Do not burn UI text, logos, watermarks, or price stickers into images unless a row expressly allows optional micro-lettering on a bottle.

**Aspect ratios only** below. Export at a resolution your tool handles well while keeping the named ratio.

### Reuse rule (important)

| Surface | Images to generate | How text works |
|---------|--------------------|----------------|
| **Every collection page** (`/collections/*`) | **1 shared** banner | Title, description, SEO copy change in CMS. **Same image file** for all collections |
| **Default product / catalog hero** | **1 shared** wide hero | Shop and catalog headers reuse it unless a product has its own primary |
| **Product bottle (primary)** | **1 image per product** (admin upload or URL) | Name, notes, price are HTML. No set of banners per SKU |
| **Homepage “Shop by collection” cards** | **4 images** (For Her, For Him, Unisex, Gift Sets tiles only) | Card labels are HTML on top of the photo |
| **Worn in the wild** | **3 images** (wrist · collar · evening fabric) | No text on images; section title is HTML |
| **Shop all / Cart / Wishlist** | **1 page hero each** | H1 and empty-state copy are HTML only |
| **Wishlist page** | **`wishlist-hero.webp` only** | Page name is **Wishlist** (not Favourites / Saved) |

Do **not** generate a separate banner for Bestsellers, Floral, For Him, Limited Edition, etc. Collection pages all use `collections/banner.webp`. Only the overlaid UI text changes.

---

## 0. Master brand prompt (paste first every time)

Copy this block into the chat **before** any individual asset prompt so every image stays on-brand:

```
You are generating photographic assets for NS Perfume, a modern fragrance e-commerce brand.

Live website color system (match lighting and empty space to this UI):
- Page background: pure white #FFFFFF
- Chrome (header/footer): solid black #000000 (footer top is rounded on the site)
- Accent / top-bar / price / button-hover gold: #A9873C
- Soft light section band: warm cream #F8F1E3 (never flood the full page with solid gold)
- Body text: black #000000; secondary grey #5C5C5C
- Hairlines / borders: warm #E8E0D0
- Typography on site: Ubuntu for headlines and buttons; clean sans-serif for body (do not render type in photos)

Brand art direction:
- Quiet, editorial, apothecary restraint. Light storefront first: white and cream, gold as a precise accent, black only for chrome and contrast.
- Not nightclub luxury, not gold glitter, not black marble + gold smoke CGI cliches.
- Light is soft daylight or soft studio (north-light quality). Avoid neon, harsh flash, HDR shine, heavy cinematic teal/orange grade.
- Surfaces: linen, raw silk, stone, warm plaster, light wood, warm concrete, cut flowers sparingly, glass perfume bottles only.
- Subject focus: scent, atmosphere, and object photography that leaves clear space for overlaid website text (lower third or left third safe zones). White or soft-cream negative space works best so black titles read after CSS overlays only where needed.
- Mood: Pakistan heat, late dinners, office-to-evening wear, calm confidence. Real materials, real light.
- No people faces unless specified. When people appear, prefer partial body, hands, or back-of-shoulder; diverse South Asian / global casting when any figure is shown.
- No readable brand logos (except plain anonymous bottle labels kept illegible/blurred). Never burn NS PERFUME wordmark into photos (the site footer renders that in type).
- No text overlays, banners, Sale labels, watermarks, UI chrome, or mock website frames in the image.
- Composition must read clearly at web sizes; strong focal subject, uncluttered background.
- Final delivery: photorealistic, commercial e-commerce quality, export-ready as WebP.

Reuse: one shared collection banner for all collection pages; one primary product still per bottle SKU only when needed; wishlist page (not favourites).
```

### UI palette quick reference

| Role | Hex | Notes for images |
|------|-----|------------------|
| Canvas / paper | `#FFFFFF` | Page and product cards |
| Soft section | `#F8F1E3` | Cream section band |
| Accent gold | `#A9873C` | Sparse props only; never full-bleed solid gold backdrops |
| Chrome | `#000000` | Header/footer in UI only |
| Hairline | `#E8E0D0` | Soft warm edges |

### Global technical rules

| Rule | Spec |
|------|------|
| Format | **WebP** primary (keep PNG/JPG master only for archive) |
| Color space | sRGB |
| Compression | WebP quality **80–85** |
| Sharpness | Natural; no oversharpening halos |
| Aspect | Follow the **ratio** listed for each asset |
| Empty space | Keep **text-safe zones** free of busy detail (see each prompt) |
| Overlay note | Collection cards and banners may add a dark scrim in CSS. Prefer midtones |
| Avoid | Solid mustard full-frame backgrounds, glitter, neon, black-marble luxury cliches |
| Consistency | Same bottle silhouette family; white/cream world across the set |
| Reuse | **One** collection banner for all `/collections/*`. Text differs in HTML only |

### Suggested folder layout (for developers)

```
public/images/
  home/
    hero.webp
    collection-for-her.webp      # homepage tile only
    collection-for-him.webp      # homepage tile only
    collection-unisex.webp       # homepage tile only
    collection-gift-sets.webp    # homepage tile only
    banner-find-your-scent.webp
    story-band.webp              # optional
    worn-in-wild-01.webp         # wrist — step 1 of 3
    worn-in-wild-02.webp         # office collar — step 2 of 3
    worn-in-wild-03.webp         # evening fabric — step 3 of 3
  products/
    hero-default.webp            # optional alias of pages/shop-hero
  pages/
    shop-hero.webp               # Shop all (/shop)
    cart-hero.webp               # Cart (/cart)
    wishlist-hero.webp           # Wishlist (/wishlist) — not favourites
    contact-hero.webp
    about-hero.webp
    find-your-scent-hero.webp
    gift-cards-hero.webp
    journal-hero.webp
    search-hero.webp
    shipping-hero.webp
    faq-hero.webp
    404-atmosphere.webp
  collections/
    banner.webp                  # ONE image for ALL collection pages
```

---

## 1. Homepage — Hero (full-bleed)

**Where it lives:** first viewport. Background image edge-to-edge. Headline, supporting line, and two CTAs sit **on** the image (typically left third / lower third). Site copy can change in code without regenerating this image.

| Field | Value |
|-------|--------|
| Filename | `home/hero.webp` |
| Aspect ratio | **8:5** |
| Text safe zone | Soft darker area left/bottom ~45% of frame; right side may hold atmosphere |

**Prompt**

```
Photorealistic full-bleed fragrance campaign still for a modern e-commerce hero background. Aspect ratio 8:5.
Quiet editorial ivory and brass mood. Soft late-afternoon daylight entering an interior room with warm plaster walls the color of antique ivory.
In the mid-ground: a single amber-tinted glass perfume bottle (anonymous square-shouldered apothecary bottle, no readable logo), standing on a light stone or linen surface.
Subtle reflection in a dark glass table or polished stone. Dry botanical: a few dried citrus slices or a sprig of cedar, not a floral mess.
Deep soft shadows; atmosphere of heat cooling into evening. Midtone exposure so a website dark overlay still keeps detail.
Leave the left third and lower third relatively calm for large headline and two buttons.
No people, no text, no watermark. Cinematic but restrained. Web-ready commercial photography.
```

**Negative prompts (if supported)**

```
gold glitter, black marble cliché, gold liquid CGI, champagne towers, neon, pure white cyclorama, harsh flash, watermark, logo, readable text, crowded product shelves, smartphone in frame
```

---

## 2. Homepage — Shop by collection (4 cards only)

**Where it lives:** four homepage tiles only (For Her / For Him / Unisex / Gift Sets). **Not** used as different banners for every collection route. Collection pages use the single image in section 6.

| Field | Value |
|-------|--------|
| Aspect ratio (each) | **4:5** |
| Overlay | Site applies ~45% black + bottom gradient; shoot for midtones |
| Count | **Exactly 4** files |

### 2.1 For Her — `home/collection-for-her.webp`

```
Editorial still-life background for a perfume collection card titled “For Her” (do not render that text). Aspect ratio 4:5.
Soft feminine restraint, not pastel cliché. Warm ivory linen, pale blush rose petals sparse, soft iris-purple shadow in the background only.
Glass flacon of pale rose-gold liquid catching soft daylight. Blurred silk scarf edge in frame.
Photographed slightly top-down or three-quarter angle. Calm lower third for white title text after dark overlay.
No person face. No logo text. Midtone, commercial e-commerce quality, ivory and brass brand world.
```

### 2.2 For Him — `home/collection-for-him.webp`

```
Editorial still-life for a perfume collection card “For Him” (do not render text). Aspect ratio 4:5.
Warm charcoal and brass atmosphere without going black-luxury. Matte stone slab, cedar chips, dry tobacco leaf, faint leather texture in soft focus.
Dark amber glass bottle with clean geometry. Soft window light from one side.
Grounded, architectural mood. Leave lower area simpler for overlaid white title.
No logo text. Midtone commercial photograph, NS Perfume style ivory studio not pure black void.
```

### 2.3 Unisex — `home/collection-unisex.webp`

```
Editorial still-life for a unisex fragrance collection card (no text in image). Aspect ratio 4:5.
Balanced composition: dual bottles or one clear bottle between cool green citrus leaf and warm amber resin pieces on warm ivory stone.
Neutral modern interior background. Soft cross light. Feeling of shared wardrobe scent, clean and current.
Lower third calm for title overlay after dark scrim. Photorealistic, midtone, no logos.
```

### 2.4 Gift Sets — `home/collection-gift-sets.webp`

```
Editorial packaging still-life for a gift sets collection card (no text). Aspect ratio 4:5.
Open gift tray with three mini anonymous perfume vials nested in soft ivory tissue paper and a narrow brass ribbon (flat metal brass color, not shiny gift-store gold).
Warm top-down view, soft shadows, paper grain visible. Quiet holiday-without-holiday language, year-round gifting.
Bottom third calmer for the words “Gift Sets” as overlay after dark filter. WebP-ready commercial photo.
```

---

## 3. Homepage — Find your scent banner

**Where it lives:** full-width banner after Bestsellers. H2 and body copy are HTML; image stays fixed when marketing text is edited.

| Field | Value |
|-------|--------|
| Filename | `home/banner-find-your-scent.webp` |
| Aspect ratio | **12:5** |
| Text safe | Left half or center soft area for H2 + paragraph + button |

**Prompt**

```
Wide cinematic e-commerce banner photograph for a “Find your scent” quiz section. Aspect ratio 12:5.
Quiet ivory studio table turning into a pathway of three anonymous perfume bottles arranged in a soft arc as if choices on a path.
Soft aerial three-quarter view, morning light, pale shadows. A folded paper map of scent notes lies blank (no readable letters) beside a brass paperclip or brass ring.
Atmosphere: decision, clarity, guided choice. Not quiz cartoon graphics.
Keep left half slightly quieter and a half-stop darker for headline overlay after site dark scrim.
No text, no faces, no UI. Photorealistic commercial image, ivory and brass brand world.
```

---

## 4. Homepage — supporting images

### 4.1 Brand story atmosphere — `home/story-band.webp` *(optional)*

| Aspect ratio | **5:3** |

```
Quiet brand-story atmosphere photo for a light e-commerce section. Aspect ratio 5:3.
A scent pyramid idea without diagram text: three stacked shallow brass trays of ingredients (bergamot peel, dried rose, crushed cedar) on ivory plaster, top-down editorial.
Soft daylight, airy negative space. No people, no logos. Midtone.
```

### 4.2 Worn in the wild — three tiles (required set)

**Where it lives:** homepage “Worn in the wild” grid — **exactly 3 square images** in a row. No faces required. Same series identity (light, palette, anonymous bottle language) so they read as one set when placed side by side.

| Field | Value |
|-------|--------|
| Count | **3** |
| Aspect ratio (each) | **1:1** |
| Filenames | `home/worn-in-wild-01.webp` · `…-02.webp` · `…-03.webp` |
| Shared rules | Partial body only · no readable logos · no UI · no text · soft golden-hour / late-day light · South Asian urban climate feel without landmarks or signage · export WebP |

**Shared series opener (paste before each of the three steps)**

```
You are generating square UGC-style lifestyle stills for NS Perfume “Worn in the wild” homepage tiles.
Brand world: ivory, soft cream #F8F1E3, sparse brass #A9873C accents, quiet editorial real life — not fashion-shoot polish, not nightclub luxury.
Lighting: warm dust-soft golden hour or late-afternoon daylight. Natural, slightly elevated phone-photo quality (clean, not messy).
People: partial figure only — never full face. Prefer hands, wrist, collarbone, nape, cuff. South Asian / global casting when any skin is shown.
Object: one anonymous rectangular glass perfume bottle may appear small in frame, label illegible/blurred. Or scent presence implied without a bottle.
No text, no logos, no watermarks, no emojis, no phone UI. Aspect ratio 1:1. Photorealistic commercial quality, WebP-ready.
The three frames must feel like same day / same house of light so they grid cleanly together.
```

#### Step 1 of 3 — Wrist / pulse point — `home/worn-in-wild-01.webp`

| Field | Value |
|-------|--------|
| Focus | Wrist pulse point, bottle optional |
| Mood | Morning-to-afternoon wear; intimate application moment |

**Prompt**

```
Square lifestyle photograph for e-commerce UGC tile. Aspect ratio 1:1.
Close-up of a wrist and lower forearm at a soft pulse point, skin catching late daylight, thin natural shadow of leaves across skin.
Optionally: a small anonymous glass perfume bottle resting near the wrist on a warm railing or linen sleeve edge — label blurred, amber or clear juice.
Composition: center or slightly off-center; square crop reads even when small on a mobile grid.
Setting hint only: open balcony or window air of a South Asian city afternoon without skyline landmarks, signage, or crowd.
Warm dust-soft light, quiet confidence. No face, no text, no logos, no jewelry logos. Photorealistic, midtone, WebP-ready.
Series slot 1 of 3 — wrist / application.
```

**Negative (if supported)**

```
full face, selfie pose, neon, heavy makeup close-up, brand logo, readable label, text overlay, luxury watch logos, cluttered background, nightclub
```

#### Step 2 of 3 — Office collar / day wear — `home/worn-in-wild-02.webp`

| Field | Value |
|-------|--------|
| Focus | Collar, neck line, or shirt cuff |
| Mood | Desk-to-commute; AC interiors meeting outdoor heat |

**Prompt**

```
Square lifestyle photograph for e-commerce UGC tile. Aspect ratio 1:1.
Partial figure: collarbone and open shirt or soft cotton collar, or a pressed cuff and hand adjusting fabric near the neck / chest — fragrance just applied for the office day.
Skin tone natural under cool indoor light mixed with a stripe of warm window light.
Optional: bottle partially cropped at lower edge of frame, anonymous geometry only.
Feeling of Karachi / Lahore / Islamabad workday climate without naming the city and without office logos, nameplates, or computer screens with readable UI.
Square crop, clean negative space, midtone. No face required (or only nape / partial side of neck — never frontal face). No text, no logos. Photorealistic commercial still. Series slot 2 of 3 — office / collar.
```

**Negative (if supported)**

```
full face, laptop UI, branded laptop stickers, fluorescent green cast, formal black-tie cliché, gold glitter perfume CGI, watermark, text
```

#### Step 3 of 3 — Evening fabric close-up — `home/worn-in-wild-03.webp`

| Field | Value |
|-------|--------|
| Focus | Fabric drape, evening texture, sillage mood |
| Mood | Hours after work; dinner hour; heat cooling |

**Prompt**

```
Square lifestyle photograph for e-commerce UGC tile. Aspect ratio 1:1.
Intimate fabric and scent moment: silk, raw linen, or fine cotton scarf or sleeve drape in warm evening light, soft folds, micro texture visible.
A hand or wrist partially in frame touching the cloth at a pulse-adjacent fold — or the cloth alone with a small anonymous perfume bottle in shallow soft focus behind.
Golden-hour to early-evening grade: ivory and amber warmth, soft shadow pools, not pure black void.
Suggests dinner, stroll, or courtyard without landmarks, cars with plates, or signage.
Composition: square, tactile, editorial. No face, no text, no logos, no UI heart icons. Photorealistic, WebP-ready. Series slot 3 of 3 — evening fabric.
```

**Negative (if supported)**

```
face, party confetti, champagne tower, black marble luxury set, neon club, readable typography, stock emoji-style hearts, watermark
```

**Series QA (after generating all three)**

- [ ] Same white balance / golden-hour family across 01, 02, 03  
- [ ] All three are **1:1** and crop well at ~300px tile size  
- [ ] No faces reading the camera  
- [ ] No logos or text  
- [ ] Visually distinct subjects (wrist · collar · evening fabric) so the grid is not three near-duplicates  

---

## 5. Products — one image strategy

- Storefront cards and PDP show **imagePrimary** from the product admin (upload **or** link + preview).
- Optional **imageSecondary** for hover only. No need to generate a full pack of heroes per collection family here.
- **Shared default only** when you need a catalog header with no product-specific art.

### 5.1 Shared catalog header (alternative file) — `products/hero-default.webp`

| Aspect ratio | **2:1** |
| Use | Optional alias of shop hero; prefer **§7.1** `pages/shop-hero.webp` as the storefront file |
| Count | **1** if not reusing shop hero |

```
Wide product-catalog hero: neat row of anonymous perfume bottles of mixed heights on warm ivory seam, soft shadow grid of daylight from a tall window. Aspect ratio 2:1.
Editorial product catalog mood, lots of calm space center for optional title. No brand names. One image reuses across shop-style headers.
```

### 5.2 Product bottle frame (reference for AI or style guide)

| Aspect ratio | **1:1** |
| Use | Style guide for admin uploads; products are not bulk-generated per SKU in this brief |

```
Studio product hero for eau de parfum bottle photography. Aspect ratio 1:1.
Centered glass bottle (tall rectangular shoulders, clear or amber-tinted juice), warm ivory plaster pedestal, soft natural light upper left, gentle contact shadow.
Minimal: one material cue only. No logo text, no props that steal focus. WebP-ready e-commerce still.
```

---

## 6. Collection pages — **one** banner for all

**Where it lives:** top of every `/collections/{handle}` page. **Filename stays the same** whether the page is For Her, Bestsellers, Floral, or Limited Edition. Developers change **title and body copy** in data or CMS; they do **not** swap different hero files per collection.

| Field | Value |
|-------|--------|
| Filename | `collections/banner.webp` |
| Aspect ratio | **8:3** |
| Count | **1** (never 7+ per collection type) |

**Prompt**

```
Wide editorial fragrance collection banner used on every collection page. Aspect ratio 8:3.
Anonymous glass bottles and soft botanical accents on warm ivory stone or linen, calm left third for large page title after a dark CSS scrim.
Gender-neutral, family-neutral atmosphere (works for her, him, unisex, floral, woody, bestsellers, gifts). Soft studio daylight. No readable text, logos, or collection names in the image.
Midtone, photorealistic commercial quality.
```

If a future design needs a second collection mood, wait for product direction. Default is one asset.

---

## 7. Storefront page heroes — full prompts

Site copy (H1, body, empty states) is always **HTML**. Images stay fixed when text changes.

### 7.1 Shop all — `pages/shop-hero.webp`

**Where it lives:** top of `/shop` (Shop all). One catalog hero for the full listing page. Can also power a generic catalog band. Do not generate a separate shop image per filter.

| Field | Value |
|-------|--------|
| Filename | `pages/shop-hero.webp` |
| Aspect ratio | **12:5** |
| Text safe | Lower band or left third for H1 “Shop all” + short line |
| Count | **1** |
| Alias | May double as `products/hero-default.webp` if you only want one catalog file |

**Prompt**

```
Wide e-commerce catalog hero for a fragrance Shop all page. Aspect ratio 12:5.
Editorial top-down or three-quarter view of anonymous perfume bottles of mixed heights arranged in a calm, ordered row or soft grid on warm ivory stone / plaster, soft daylight from a tall window casting long pale shadows.
Atmosphere of a full house of scent without retail clutter, price tags, or shelf edge talkers. Midtone exposure.
Leave the lower third or left third quieter and slightly simpler so black or white HTML title can sit after an optional soft scrim.
No readable labels, no logos, no text, no people. Photorealistic commercial photography, ivory and brass brand world (#F8F1E3 cream light, sparse #A9873C metal only as thin props if any). WebP-ready.
```

**Negative (if supported)**

```
crowded supermarket shelf, neon signage, sale stickers, gold glitter, black marble CGI, watermark, brand logos, mock browser UI
```

---

### 7.2 Cart — `pages/cart-hero.webp`

**Where it lives:** optional soft band / empty-cart atmosphere on `/cart` (and can tint empty bag messaging). One image only; line items remain product thumbnails from catalog data.

| Field | Value |
|-------|--------|
| Filename | `pages/cart-hero.webp` |
| Aspect ratio | **5:2** |
| Text safe | Center or left calm area for “Your cart” H1 and empty-state copy |
| Count | **1** |
| Tone | Inviting to continue shopping — not sad empty-shelf stock |

**Prompt**

```
Wide soft e-commerce cart / bag atmosphere still. Aspect ratio 5:2.
An empty natural linen shopping tote folded neatly on a warm ivory or pale stone surface, beside a single unopened anonymous mini perfume sample vial and a thin unbranded kraft packing strip.
Soft daylight, quiet invitation to keep shopping — not a lonely abandoned cart cliché, not a junk pile of packages.
Midtones, clean negative space for HTML page title. No prices, no barcodes, no courier logos, no readable text, no UI shopping-cart icons drawn into the photo.
Photorealistic, NS Perfume ivory studio world. WebP-ready.
```

**Negative (if supported)**

```
sad empty cart memes, stock plastic basket, grocery produce, neon checkout, credit card numbers, brand logos, watermark, text
```

---

### 7.3 Wishlist — `pages/wishlist-hero.webp`

**Where it lives:** optional atmosphere / empty state on `/wishlist`. Page name is **Wishlist** only (never Favourites or Saved). Product rows use real product images from data.

| Field | Value |
|-------|--------|
| Filename | `pages/wishlist-hero.webp` |
| Aspect ratio | **5:2** |
| Text safe | Calm band for HTML title “Wishlist” and empty-state sentence |
| Count | **1** |
| Naming | **Wishlist** — do not label the asset or scene as favourites/saved |

**Prompt**

```
Wide Wishlist page atmosphere for fragrance e-commerce. Aspect ratio 5:2.
Two anonymous glass perfume bottles set side by side on soft ivory linen, as if set aside for comparison — quiet selection, not purchase yet.
Optional soft fabric fold casting a very subtle organic heart-shaped shadow only (no graphic heart, no emoji, no UI icons).
Warm restrained daylight, cream and ivory palette, optional single dried botanical between bottles.
Leave center-left relatively calm for overlaid HTML heading “Wishlist”.
No text burned in, no logos, no “favourites” or “saved” concepts in style. Photorealistic commercial still. WebP-ready.
```

**Negative (if supported)**

```
emoji heart graphics, UI heart icons, red valentine cliché, gift bows overload, gold glitter, readable logos, watermark, text overlay, black marble luxury set
```

---

### 7.4 About — `pages/about-hero.webp`

| Aspect ratio | **24:11** |

```
About-page hero. Aspect ratio 24:11. Hands of a fragrance formulator (no face) on ivory apothecary table: pipette, brass dish, citrus peel, blank notebook. Documentary light. Space for story title. No text in image.
```

### 7.5 Contact — `pages/contact-hero.webp`

| Aspect ratio | **2:1** |

```
Contact page hero. Aspect ratio 2:1. Desk corner, linen envelope, unbranded bottle, soft window, plant leaf. Quiet care-office light. No screens with UI. No text.
```

### 7.6 Find your scent — `pages/find-your-scent-hero.webp`

| Aspect ratio | **2:1** |

```
Quiz page hero. Aspect ratio 2:1. Three physical choices (bottles or blank papers) on ivory floor, soft overhead light. No icons, no text. Safe center for H1.
```

### 7.7 Gift cards — `pages/gift-cards-hero.webp`

| Aspect ratio | **5:3** |

```
Gift card still life. Aspect ratio 5:3. Ivory card stock, flat brass edge, mini vial, tissue. Top-down. No numbers or logos.
```

### 7.8 Journal index — `pages/journal-hero.webp`

| Aspect ratio | **12:5** |

```
Editorial magazine still. Aspect ratio 12:5. Open notebook, blotter strip, soft blur of a bottle. No readable words.
```

### 7.9 Journal cover default — `pages/journal-cover-default.webp`

| Aspect ratio | **16:9** |

```
Generic article cover photo. Aspect ratio 16:9. Close detail of a blotter strip and glass dropper. Soft bokeh. Calm center. No text.
```

### 7.10 Search — `pages/search-hero.webp`

| Aspect ratio | **20:7** |

```
Search header mood. Aspect ratio 20:7. Magnifying glass on ivory desk, blank dried-herb labels, soft blur. No cartoon UI.
```

### 7.11 Shipping — `pages/shipping-hero.webp`

| Aspect ratio | **5:2** |

```
Careful packing. Aspect ratio 5:2. Open box, tissue around bottle silhouette, kraft paper, soft warehouse light. No courier logos.
```

### 7.12 FAQ — `pages/faq-hero.webp`

| Aspect ratio | **20:7** |

```
Support desk mood. Aspect ratio 20:7. Blank care card, small bottle, ceramic cup of tea. No speech bubbles, no text.
```

### 7.13 Track order — `pages/track-order-hero.webp`

| Aspect ratio | **5:2** |

```
Delivery mood. Aspect ratio 5:2. Sealed kraft box with brass paper seal on doorstep, soft morning light. No house numbers or brands.
```

### 7.14 404 — `pages/404-atmosphere.webp`

| Aspect ratio | **5:3** |

```
Gentle lost-path lab corridor, soft ivory walls, one bottle slightly out of place. Aspect ratio 5:3. Calm center for 404 headline. No text.
```

---

## 8. Batch generation order (recommended)

1. Master brand prompt (section 0)  
2. `home/hero.webp` (**8:5**)  
3. Four homepage collection **tiles** only (**4:5**)  
4. `home/banner-find-your-scent.webp` (**12:5**)  
5. **Worn in the wild trio** — steps 1→2→3 in §4.2 (**1:1** each)  
6. `collections/banner.webp` (**8:3**) — single file for all collections  
7. **Shop all** `pages/shop-hero.webp` (**12:5**)  
8. **Cart** `pages/cart-hero.webp` (**5:2**)  
9. **Wishlist** `pages/wishlist-hero.webp` (**5:2**)  
10. Remaining page heroes as needed  

Product bottle photos: upload **one primary** (and optional hover) in admin per product.

After each image: re-export as WebP if needed:

```bash
pnpm optimize:images --dir=public/assets
# or
cwebp -q 82 input.png -o public/images/home/worn-in-wild-01.webp
```

---

## 9. QA checklist before shipping assets

- [ ] No readable logos, watermarks, or fake brand marks  
- [ ] No embedded UI text (titles will be HTML)  
- [ ] **Only one** `collections/banner.webp` (not per-collection files)  
- [ ] Worn in the wild = **three** distinct 1:1 frames (wrist · collar · evening fabric)  
- [ ] Shop / Cart / Wishlist each have **one** dedicated page hero  
- [ ] Wishlist asset named `wishlist-hero` (not favourites / saved)  
- [ ] Midtones work under ~45% dark overlay where scrims apply  
- [ ] Aspect ratio matches the asset table  
- [ ] Filenames match the tree in section 0  

---

## 10. One-shot pack super-prompt

```
Generate a consistent NS Perfume web image pack as separate stills (list filenames in captions). Match white / cream / gold #A9873C / black from the master brand brief.

Reuse: one collection banner for all collection pages; wishlist not favourites.

Required set (ratios only):
1) home/hero · 8:5
2–5) home collection tiles · 4:5 ×4 (her / him / unisex / gifts)
6) home/banner-find-your-scent · 12:5
7) home/worn-in-wild-01 · 1:1 · wrist / pulse application
8) home/worn-in-wild-02 · 1:1 · office collar / day wear
9) home/worn-in-wild-03 · 1:1 · evening fabric close-up
10) collections/banner · 8:3 · single banner for ALL collections
11) pages/shop-hero · 12:5 · Shop all catalog
12) pages/cart-hero · 5:2 · cart / empty-bag mood
13) pages/wishlist-hero · 5:2 · Wishlist atmosphere (not favourites)
14) pages/about-hero · 24:11
15) pages/contact-hero · 2:1

Each image: photorealistic, no text overlays, midtone-friendly, WebP-ready. Keep lighting and bottle language consistent. Worn-in-wild set must share the same day of light.
```

---

## 11. Overlay guidance for developers

| Surface | Overlay treatment (CSS) | Text color |
|---------|---------------------------|------------|
| Homepage collection cards | dark scrim ~45% or bottom gradient | white or #F8F1E3 |
| Home hero | left/bottom gradient from black ~55% | white when scrim is strong |
| Find your scent banner | full soft black ~40% or left heavy gradient | white paper |
| **All collection pages** | shared `collections/banner.webp` + HTML title/description | white paper |
| Shop / Cart / Wishlist heroes | soft scrim only if contrast fails | black on light preferred |
| Worn in the wild | usually **no** text overlay — pure tiles | n/a |

Collection page titles, product names, Shop/Cart/Wishlist headings are always **HTML**. Do not bake them into image files.

---

*Brand system: NS Perfume · white #FFFFFF · cream #F8F1E3 · gold #A9873C · chrome #000000. Collection = 1 banner. Worn in the wild = 3 steps. Wishlist (not Favourites). Keep next to `design-system/design.md`.*
