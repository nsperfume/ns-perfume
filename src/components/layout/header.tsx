"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { animate, EASE } from "@/lib/animate";
import {
  ChevronDownIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  ShoppingBagIcon,
  UserIcon,
  XIcon,
} from "@/components/ui/icons";
import { shopMegaMenu, siteConfig } from "@/data/site";
import { siteImages } from "@/data/images";
import { useCart } from "@/context/cart";
import { useCustomer } from "@/context/customer";
import { useWishlist } from "@/context/wishlist";
import { useUi } from "@/context/ui";
import { cn } from "@/lib/cn";
import { CurrencyToggle } from "@/components/layout/currency-toggle";
import { NavDropdown } from "@/components/layout/nav-dropdown";
import { Logo } from "@/components/brand/logo";
import { BrandIcon } from "@/components/ui/brand-icon";
import { whatsappUrl } from "@/lib/whatsapp";

const shopColumns = [
  { title: "Gender", items: shopMegaMenu.gender },
  { title: "Scent family", items: shopMegaMenu.family },
  { title: "Concentration", items: shopMegaMenu.type },
  { title: "Gifts and occasions", items: shopMegaMenu.gifts },
  { title: "Highlights", items: shopMegaMenu.featured },
];

const exploreItems = [
  { label: "Our story", href: "/about" },
  { label: "Journal", href: "/journal" },
  { label: "Track your order", href: "/track-order" },
  { label: "Contact us", href: "/contact" },
];

/** First-level links in the mobile menu: what most shoppers come for. */
const mobileQuickLinks = [
  { label: "Shop all", href: "/products" },
  { label: "For her", href: "/collections/for-her" },
  { label: "For him", href: "/collections/for-him" },
  { label: "Unisex", href: "/collections/unisex" },
  { label: "Bestsellers", href: "/collections/bestsellers" },
  { label: "Gift sets", href: "/collections/gift-sets" },
];

const linkClass =
  "inline-flex min-h-11 cursor-pointer items-center rounded-full px-3 text-label text-paper/85 transition-colors duration-300 hover:text-white xl:px-4";

const mobileLink =
  "flex min-h-12 cursor-pointer items-center text-label text-paper/90 transition-colors hover:text-white";

const iconBtn =
  "relative inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-paper/85 transition-colors hover:bg-white/5 hover:text-white";

const iconBtnDesktop =
  "relative hidden h-11 w-11 cursor-pointer items-center justify-center rounded-full text-paper/85 transition-colors hover:bg-white/5 hover:text-white sm:inline-flex";

export function Header() {
  const { openCart, itemCount } = useCart();
  const { user } = useCustomer();
  const { count: wishCount } = useWishlist();
  const { openSearch } = useUi();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  /** Avoid badge / local state mismatches between SSR and first client paint */
  const [ready, setReady] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const cartBadgeRef = useRef<HTMLSpanElement>(null);
  const wishBadgeRef = useRef<HTMLSpanElement>(null);
  const prevCart = useRef(itemCount);
  const prevWish = useRef(wishCount);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    animate(
      mobilePanelRef.current,
      [
        { opacity: 0, transform: "translateY(-8px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 320 },
    );
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      setMobileShopOpen(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMobileOpen(false);
      menuButtonRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!ready) return;
    if (itemCount > prevCart.current) {
      animate(cartBadgeRef.current, [{ transform: "scale(0.5)" }, { transform: "scale(1)" }], {
        duration: 400,
        easing: EASE.back,
      });
    }
    prevCart.current = itemCount;
  }, [itemCount, ready]);

  useEffect(() => {
    if (!ready) return;
    if (wishCount > prevWish.current) {
      animate(wishBadgeRef.current, [{ transform: "scale(0.5)" }, { transform: "scale(1)" }], {
        duration: 400,
        easing: EASE.back,
      });
    }
    prevWish.current = wishCount;
  }, [wishCount, ready]);

  return (
    <header ref={headerRef} className="nav-glass overflow-visible text-paper">
      <div className="container-ns flex h-16 items-center gap-1 sm:h-[4.25rem] sm:gap-3 lg:h-[4.5rem] lg:gap-6">
        <button
          ref={menuButtonRef}
          type="button"
          className={cn(iconBtn, "-ml-1 lg:hidden")}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? (
            <XIcon size={22} color="currentColor" />
          ) : (
            <MenuIcon size={22} color="currentColor" />
          )}
        </button>

        <Link
          href="/"
          aria-label={`${siteConfig.name} home`}
          className="shrink-0 cursor-pointer text-paper transition-colors hover:text-white"
        >
          <Logo className="h-6 min-[380px]:h-7 sm:h-8 lg:h-9" />
        </Link>

        <nav
          className="relative z-50 hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex xl:gap-2"
          aria-label="Primary"
        >
            <NavDropdown
              label="Shop"
              wide
              topLinks={[
                { label: "All perfumes", href: "/products" },
                { label: "All collections", href: "/collections" },
              ]}
              columns={shopColumns}
              panelImage={{
                src: siteImages.navbarShop,
                alt: "NS Perfume bottles on a styled shelf",
                href: "/products/discovery-set-six",
                cta: "Try six scents in the discovery set →",
              }}
            />
            <NavDropdown label="Explore" items={exploreItems} />
            <Link href="/find-your-scent" className={linkClass}>
              Find your scent
            </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <CurrencyToggle className="mr-1 hidden md:inline-flex" tone="dark" />
          <button
            type="button"
            onClick={openSearch}
            className={iconBtn}
            aria-label="Search"
          >
            <SearchIcon size={20} color="currentColor" />
          </button>
          <Link
            href="/wishlist"
            className={iconBtnDesktop}
            aria-label={
              ready && wishCount
                ? `Wishlist, ${wishCount} items`
                : "Wishlist"
            }
          >
            <HeartIcon size={20} color="currentColor" />
            {ready && wishCount > 0 ? (
              <span
                ref={wishBadgeRef}
                className="absolute right-0 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass px-1 font-sans tabular-nums text-xs font-semibold leading-none text-ink"
              >
                {wishCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={openCart}
            className={iconBtn}
            aria-label={
              ready && itemCount ? `Cart, ${itemCount} items` : "Cart"
            }
          >
            <ShoppingBagIcon size={21} color="currentColor" />
            {ready && itemCount > 0 ? (
              <span
                ref={cartBadgeRef}
                className="absolute right-0 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass px-1 font-sans tabular-nums text-xs font-semibold leading-none text-ink"
              >
                {itemCount}
              </span>
            ) : null}
          </button>
          <Link
            href="/account"
            className={cn(iconBtnDesktop, "relative")}
            aria-label={user ? "Your account" : "Sign in"}
          >
            <UserIcon size={20} color="currentColor" />
            {user ? (
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brass"
                aria-hidden
              />
            ) : null}
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <div
          ref={mobilePanelRef}
          id="mobile-menu"
          className="nav-glass-panel h-[calc(100dvh-var(--chrome-height))] overflow-x-hidden overflow-y-auto overscroll-contain border-t border-white/10 text-paper lg:hidden"
        >
          <div className="px-[var(--gutter)] pb-8 pt-3">
            <nav aria-label="Mobile" className="divide-y divide-white/10">
              <div className="py-2">
                {mobileQuickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={mobileLink}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                <button
                  type="button"
                  className={cn(mobileLink, "w-full justify-between")}
                  onClick={() => setMobileShopOpen((v) => !v)}
                  aria-expanded={mobileShopOpen}
                >
                  More categories
                  <ChevronDownIcon
                    size={18}
                    color="currentColor"
                    className={cn(
                      "transition-transform duration-300",
                      mobileShopOpen && "rotate-180",
                    )}
                  />
                </button>
                {mobileShopOpen ? (
                  <div className="mb-3 space-y-5 border-l border-white/20 pl-4">
                    {shopColumns.map((col) => (
                      <div key={col.title}>
                        <p className="mb-1 text-eyebrow text-paper/60">
                          {col.title}
                        </p>
                        <ul className="flex flex-col">
                          {col.items.map((item) => (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                className="flex min-h-11 cursor-pointer items-center text-base text-paper/85 transition-colors hover:text-white"
                                onClick={() => setMobileOpen(false)}
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}

                <Link
                  href="/find-your-scent"
                  className={mobileLink}
                  onClick={() => setMobileOpen(false)}
                >
                  Find your scent
                </Link>
              </div>

              <div className="py-2">
                {exploreItems.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={mobileLink}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="py-3">
                <a
                  href={whatsappUrl(siteConfig.phone, "Hi NS Perfume, I have a question.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-3 text-label text-paper/90 transition-colors hover:text-white"
                >
                  <BrandIcon name="whatsapp" size={20} />
                  Chat on WhatsApp
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="flex gap-6">
                  <Link
                    href="/wishlist"
                    className="inline-flex min-h-11 items-center text-body-sm text-paper/80 hover:text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    Wishlist{ready && wishCount ? ` (${wishCount})` : ""}
                  </Link>
                  <Link
                    href="/account"
                    className="inline-flex min-h-11 items-center text-body-sm text-paper/80 hover:text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    {user ? "Account" : "Sign in"}
                  </Link>
                </div>
                <CurrencyToggle tone="dark" />
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
