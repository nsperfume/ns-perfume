# NS Perfume

Storefront and admin for [nsperfume.pk](https://nsperfume.pk), a Pakistani fragrance house. Customers browse fragrances by notes, sillage and longevity, order with cash on delivery or bank/wallet transfer, track parcels and download invoices. The team runs products, collections, orders, coupons, content and email from `/admin`.

## Stack

- Next.js 16 (App Router, Turbopack, React Compiler), React 19, Tailwind CSS 4
- MongoDB Atlas via Mongoose
- Cloudinary for admin image uploads
- Nodemailer + React Email for transactional email
- `@react-pdf/renderer` for PDF invoices
- pnpm

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in the values
pnpm dev                     # http://localhost:3000
```

The admin is at `/admin`. The first login with `ADMIN_EMAIL` and `ADMIN_PASSWORD` creates the super admin account.

To run a second dev server next to `pnpm dev` (for example for screenshots), give it its own build folder: `NEXT_DIST_DIR=.next-alt pnpm exec next dev -p 3100`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server (`prebuild` blocks SSR-unsafe packages) |
| `pnpm seed:db -- --yes` | Wipes and reseeds the demo catalog in the database from `MONGODB_URI`. Never run against production data. |
| `pnpm clean:copy` | Lists em/en dashes in stored product, collection and journal copy. `--apply` backs up to `scripts/backups/` and fixes them. |
| `pnpm optimize:images` | Converts images in `public/` to optimized WebP |

## Environment

Every variable is documented in [`.env.example`](.env.example). Required in production: `NEXT_PUBLIC_SITE_URL`, `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET` (32+ characters), the three `CLOUDINARY_*` keys, and `SMTP_USER` with `SMTP_PASS` or `APP_PASSWORD`.

## Email

Templates live in `src/emails` (React Email). Triggers live in `src/lib/email/index.ts`:

| Event | Emails |
| --- | --- |
| Order placed | Confirmation to the customer (COD or bank/wallet instructions, invoice link) and an alert to the store |
| Order status changed in admin | Confirmed, shipped (courier and tracking), delivered (review request), cancelled |
| Account created | Welcome with an email confirmation link (password accounts) |
| Forgot password | Single-use reset link (1 hour), then a "password changed" notice |
| Contact form | Auto-reply to the customer and an alert to the store (reply goes straight to the customer) |
| Newsletter signup | Welcome with one-click unsubscribe |

Emails are sent after the HTTP response, so a mail outage never blocks an order. Every attempt is logged. Admin > Emails shows the delivery log and subscribers, previews every template, and lets the owner send a test.

Sending uses Gmail SMTP with an app password by default. The Google account must have 2-Step Verification on. Gmail allows about 500 messages a day. Once `nsperfume.pk` has mailboxes (for example Google Workspace), send from a domain address and publish SPF, DKIM and DMARC records for good inbox placement.

## Invoices

`GET /api/orders/{orderNumber}/invoice` returns an A4 PDF. It is available to admins, to the signed-in customer who owns the order, and through the signed link in order emails, the thank-you page, account history and order tracking.

## Deploying (Vercel)

1. Import the repository in Vercel. The framework is detected automatically and the build command is `pnpm build`.
2. Add the environment variables from `.env.example` for the Production environment.
3. In MongoDB Atlas > Network Access, allow connections from Vercel (`0.0.0.0/0`, or Vercel's static IPs on paid plans).
4. Add `nsperfume.pk` and `www.nsperfume.pk` under Project > Domains. In the Websouls DNS manager, create the records Vercel shows. Usually that is an `A` record for `@` pointing to `76.76.21.21` and a `CNAME` for `www` pointing to `cname.vercel-dns.com`. HTTPS is issued automatically.
5. Set `NEXT_PUBLIC_SITE_URL=https://nsperfume.pk`, then redeploy.
6. After the first deploy, submit `https://nsperfume.pk/sitemap.xml` in Google Search Console.

### Before going live

- Use a strong `ADMIN_PASSWORD` that has never been shared and a fresh `ADMIN_JWT_SECRET`. Changing the secret signs everyone out.
- Replace the product photography. The current demo photos show other brands' bottles.
- Send one test of each email from Admin > Emails.
- Place a test COD order and a bank-transfer order. Move them through confirmed, shipped and delivered, and check the emails and invoices.
- Rate limiting is in memory per server instance. On serverless hosting it slows abuse but does not stop it, so add a shared store (Upstash Redis) when traffic grows.

## SEO and AI discovery

`/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, `/llms.txt` and `/llms-full.txt` are generated from the live catalog and refreshed hourly. Product, collection, breadcrumb, FAQ and article pages include JSON-LD.

## Brand assets

Logo files are in `public/brand`: symbol, horizontal logo, stacked logo, label emblem and round seal. Each comes in colour, reverse, black and brass. The monogram is a single solid path, ready for foil, embossing or etching. Ask a print designer to export print-ready PDF/AI files with a Pantone match for the brass (`#A9873C`).
