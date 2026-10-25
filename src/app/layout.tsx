import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Manrope } from "next/font/google";
import { SiteShell } from "@/components/layout/site-shell";
import { siteConfig } from "@/data/site";
import "./globals.css";

/* Display: headings, product names, pull quotes (24px and up only) */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

/* UI and body copy: nav, buttons, forms, paragraphs */
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

/* Numerals: prices, ml sizes, SKUs, order numbers */
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Modern Luxury Fragrance`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    siteName: siteConfig.name,
    type: "website",
    locale: "en_PK",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${manrope.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col bg-canvas text-ink"
        suppressHydrationWarning
      >
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
