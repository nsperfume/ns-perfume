import type { Metadata } from "next";
import { WishlistClient } from "@/app/wishlist/wishlist-client";
import { pageCopy } from "@/data/copy";

export const metadata: Metadata = {
  title: "Wishlist",
  description: pageCopy.wishlist.description,
  robots: { index: false },
};

export default function WishlistPage() {
  return <WishlistClient />;
}
