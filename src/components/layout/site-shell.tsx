"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { SearchSheet } from "@/components/layout/search-sheet";
import { ToastHost } from "@/components/layout/toast-host";
import { CartProvider } from "@/context/cart";
import { CurrencyProvider } from "@/context/currency";
import { UiProvider } from "@/context/ui";
import { WishlistProvider } from "@/context/wishlist";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isCheckout = pathname?.startsWith("/checkout");
  /** Shopify-style order status pages omit store chrome */
  const isTrackOrder = pathname?.startsWith("/track-order");

  if (isAdmin) {
    return <>{children}</>;
  }

  if (isCheckout || isTrackOrder) {
    return (
      <CurrencyProvider>
        <CartProvider>
          <UiProvider>
            {children}
            <ToastHost />
          </UiProvider>
        </CartProvider>
      </CurrencyProvider>
    );
  }

  return (
    <CurrencyProvider>
      <CartProvider>
        <WishlistProvider>
          <UiProvider>
            <div className="fixed inset-x-0 top-0 z-50 overflow-visible">
              <div data-site-chrome className="overflow-visible">
                <AnnouncementBar />
                <Header />
              </div>
            </div>
            <main className="flex-1 pt-[var(--chrome-height)]">{children}</main>
            <Footer />
            <CartDrawer />
            <SearchSheet />
            <ToastHost />
          </UiProvider>
        </WishlistProvider>
      </CartProvider>
    </CurrencyProvider>
  );
}
