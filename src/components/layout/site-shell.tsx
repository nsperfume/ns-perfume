"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { SearchSheet } from "@/components/layout/search-sheet";
import { ToastHost } from "@/components/layout/toast-host";
import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/cart";
import { CurrencyProvider } from "@/context/currency";
import { CustomerProvider } from "@/context/customer";
import { UiProvider } from "@/context/ui";
import { WishlistProvider } from "@/context/wishlist";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isCheckout = pathname?.startsWith("/checkout");
  const isTrackOrder = pathname?.startsWith("/track-order");

  if (isAdmin) {
    return (
      <>
        <ScrollToTop />
        {children}
      </>
    );
  }

  if (isCheckout || isTrackOrder) {
    return (
      <CurrencyProvider>
        <CustomerProvider>
          <CartProvider>
            <UiProvider>
              <TooltipProvider delayDuration={120} skipDelayDuration={0}>
                <ScrollToTop />
                {children}
                <ToastHost />
              </TooltipProvider>
            </UiProvider>
          </CartProvider>
        </CustomerProvider>
      </CurrencyProvider>
    );
  }

  return (
    <CurrencyProvider>
      <CustomerProvider>
        <CartProvider>
          <WishlistProvider>
            <UiProvider>
              <TooltipProvider delayDuration={120} skipDelayDuration={0}>
                <ScrollToTop />
                <div className="fixed inset-x-0 top-0 z-50 overflow-visible">
                  <div data-site-chrome className="overflow-visible">
                    <AnnouncementBar />
                    <Header />
                  </div>
                </div>
                <main className="flex-1 pt-chrome-height">{children}</main>
                <Footer />
                <CartDrawer />
                <SearchSheet />
                <ToastHost />
              </TooltipProvider>
            </UiProvider>
          </WishlistProvider>
        </CartProvider>
      </CustomerProvider>
    </CurrencyProvider>
  );
}
