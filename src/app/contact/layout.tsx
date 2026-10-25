import type { Metadata } from "next";
import { pageCopy } from "@/data/copy";

/** The contact page is a client component, so its metadata lives on this segment layout. */
export const metadata: Metadata = {
  title: "Contact care",
  description: pageCopy.contact.description,
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
