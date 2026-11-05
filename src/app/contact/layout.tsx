import type { Metadata } from "next";
import { siteConfig } from "@/data/site";
import { fitDescription, pageOpenGraph } from "@/lib/seo";

/** The contact page is a client component, so its metadata lives on this segment layout. */
export const metadata: Metadata = {
  title: { absolute: "Contact NS Perfume | WhatsApp, Phone and Email" },
  description: fitDescription(
    `Contact NS Perfume about orders, notes or delivery. WhatsApp or call ${siteConfig.phoneDisplay}, or email ${siteConfig.email}. Based in Qila Didar Singh, Punjab.`,
  ),
  alternates: { canonical: "/contact" },
  openGraph: pageOpenGraph("/contact"),
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
