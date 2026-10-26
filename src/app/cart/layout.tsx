import type { Metadata } from "next";
import { pageCopy } from "@/data/copy";

/** The cart page is a client component, so its metadata lives on this segment layout. */
export const metadata: Metadata = {
  title: "Your cart",
  description: pageCopy.cart.description,
  robots: { index: false },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
