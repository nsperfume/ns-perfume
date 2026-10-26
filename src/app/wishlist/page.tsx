import type { Metadata } from "next";
import { WishlistClient } from "@/app/wishlist/wishlist-client";

/** Kept here so the page does not promise a compare feature (src/data/copy.ts still does). */
const WISHLIST_DESCRIPTION =
  "Perfumes you saved for later. Move one to your cart when you are ready.";

export const metadata: Metadata = {
  title: "Wishlist",
  description: WISHLIST_DESCRIPTION,
  robots: { index: false },
};

export default function WishlistPage() {
  return <WishlistClient description={WISHLIST_DESCRIPTION} />;
}
