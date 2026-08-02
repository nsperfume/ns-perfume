"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  ChevronDownIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  ShoppingBagIcon,
  UserIcon,
  XIcon,
} from "@animateicons/react/lucide";
import { shopMegaMenu, siteConfig } from "@/data/site";
import { siteImages } from "@/data/images";
import { useCart } from "@/context/cart";
import { useWishlist } from "@/context/wishlist";
import { useUi } from "@/context/ui";
import { cn } from "@/lib/cn";
import { CurrencyToggle } from "@/components/layout/currency-toggle";
import { NavDropdown } from "@/components/layout/nav-dropdown";

const shopColumns = [
  { title: "Gender", items: shopMegaMenu.gender },
  { title: "Scent Family", items: shopMegaMenu.family },
  { title: "Concentration", items: shopMegaMenu.type },
  { title: "Featured", items: shopMegaMenu.featured },
];

const exploreItems = [
  { label: "Our Story", href: "/about" },
  { label: "Gift Cards", href: "/gift-cards" },
];

const linkClass =
  "inline-flex min-h-11 cursor-pointer items-center rounded-xs px-2 font-display text-[12px] font-medium uppercase tracking-[0.12em] text-paper/85 transition-colors duration-300 hover:text-white xl:text-[13px]";

const iconBtn =
  "relative inline-flex min-h-11 min-w-10 cursor-pointer items-center justify-center rounded-xs text-paper/85 transition-colors hover:text-white sm:min-w-11";

export function Header() {
  const { openCart, itemCount } = useCart();
  const { count: wishCount } = useWishlist();
  const { openSearch } = useUi();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  /** Avoid badge / local state mismatches between SSR and first client paint */
  const [ready, setReady] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const cartBadgeRef = useRef<HTMLSpanElement>(null);
  const wishBadgeRef = useRef<HTMLSpanElement>(null);
  const prevCart = useRef(itemCount);
  const prevWish = useRef(wishCount);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const prefersReduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const el = headerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        y: -14,
        duration: 0.5,
        ease: "power3.out",
        clearProps: "transform",
      });
    }, headerRef);
    return () => ctx.revert();
  }, [ready]);

  useEffect(() => {
    if (!mobilePanelRef.current || !mobileOpen) return;
    gsap.fromTo(
      mobilePanelRef.current,
      { height: 0, autoAlpha: 0 },
      { height: "auto", autoAlpha: 1, duration: 0.4, ease: "power3.out" },
    );
  }, [mobileOpen]);

  useEffect(() => {
    if (!ready) return;
    if (itemCount > prevCart.current && cartBadgeRef.current) {
      gsap.fromTo(
        cartBadgeRef.current,
        { scale: 0.5 },
        { scale: 1, duration: 0.4, ease: "back.out(2.2)" },
      );
    }
    prevCart.current = itemCount;
  }, [itemCount, ready]);

  useEffect(() => {
    if (!ready) return;
    if (wishCount > prevWish.current && wishBadgeRef.current) {
      gsap.fromTo(
        wishBadgeRef.current,
        { scale: 0.5 },
        { scale: 1, duration: 0.4, ease: "back.out(2.2)" },
      );
    }
    prevWish.current = wishCount;
  }, [wishCount, ready]);

  return (
    <header ref={headerRef} className="nav-glass overflow-visible text-paper">
      <div className="container-ns flex h-[4.25rem] items-center gap-2 sm:gap-3">
        <button
          type="button"
          className={cn(iconBtn, "-ml-1 lg:hidden")}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
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
          className="shrink-0 cursor-pointer font-display text-[1.4rem] font-medium leading-none tracking-tight text-paper transition-colors hover:text-white sm:text-[1.55rem]"
        >
          {siteConfig.name}
        </Link>

        <nav
          className="relative z-50 hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex"
          aria-label="Primary"
        >
            <NavDropdown
              label="Shop"
              wide
              topLinks={[
                { label: "All Products", href: "/products" },
                { label: "All Collections", href: "/collections" },
              ]}
              columns={shopColumns}
              panelImage={{
                src: siteImages.navbarShop,
                alt: "NS Perfume bottles styled for the Shop menu",
                href: "/products",
                cta: "Shop all bottles →",
              }}
            />
            <NavDropdown label="Explore" items={exploreItems} />
            <Link href="/find-your-scent" className={linkClass}>
              Find Your Scent
            </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <CurrencyToggle className="hidden md:inline-flex" tone="dark" />
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
            className={iconBtn}
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
                className="absolute right-0.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF1744] px-1 font-mono text-[10px] font-medium text-white"
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
                className="absolute right-0.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF1744] px-1 font-mono text-[10px] font-medium text-white"
              >
                {itemCount}
              </span>
            ) : null}
          </button>
          <Link href="/account" className={iconBtn} aria-label="Account">
            <UserIcon size={20} color="currentColor" />
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <div
          ref={mobilePanelRef}
          className="nav-glass-panel overflow-hidden border-t border-white/10 text-paper lg:hidden"
        >
          <div className="space-y-1 px-5 py-5">
            <div className="mb-4">
              <CurrencyToggle tone="dark" />
            </div>

            {[
              { label: "Journal", href: "/journal" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block cursor-pointer py-3 text-[13px] font-medium uppercase tracking-[0.12em] text-paper/90 transition-colors hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/products"
              className="block cursor-pointer py-3 text-[13px] font-medium uppercase tracking-[0.12em] text-paper/90 transition-colors hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              All Products
            </Link>
            <Link
              href="/collections"
              className="block cursor-pointer py-3 text-[13px] font-medium uppercase tracking-[0.12em] text-paper/90 transition-colors hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              All Collections
            </Link>

            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between py-3 text-[13px] font-medium uppercase tracking-[0.12em] text-paper/90 transition-colors hover:text-white"
              onClick={() => setMobileShopOpen((v) => !v)}
              aria-expanded={mobileShopOpen}
            >
              Shop By Category
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
                    <p className="mb-2 font-display text-[11px] uppercase tracking-[0.14em] text-paper/50">
                      {col.title}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {col.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="block cursor-pointer py-1.5 text-sm text-paper/85 transition-colors hover:text-white"
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

            {[
              ...exploreItems,
              { label: "Find Your Scent", href: "/find-your-scent" },
              { label: "Wishlist", href: "/wishlist" },
              { label: "Search", href: "/search" },
              { label: "Account", href: "/account" },
              { label: "Cart", href: "/cart" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block cursor-pointer py-3 text-[13px] font-medium uppercase tracking-[0.12em] text-paper/90 transition-colors hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
