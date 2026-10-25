"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useCart } from "@/context/cart";
import { useUi } from "@/context/ui";

/*
 * The cart drawer and search sheet are only needed once a shopper opens them,
 * so their code loads on first open instead of with every page.
 */
const CartDrawer = dynamic(() => import("@/components/layout/cart-drawer").then((m) => m.CartDrawer), {
  ssr: false,
});
const SearchSheet = dynamic(() => import("@/components/layout/search-sheet").then((m) => m.SearchSheet), {
  ssr: false,
});

export function LazyCartDrawer() {
  const { isOpen } = useCart();
  const [used, setUsed] = useState(false);
  if (isOpen && !used) setUsed(true);
  return used ? <CartDrawer /> : null;
}

export function LazySearchSheet() {
  const { searchOpen } = useUi();
  const [used, setUsed] = useState(false);
  if (searchOpen && !used) setUsed(true);
  return used ? <SearchSheet /> : null;
}
