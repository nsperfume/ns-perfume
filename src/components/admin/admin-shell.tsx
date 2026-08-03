"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType, type WheelEvent } from "react";
import {
  BoxIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ExternalLinkIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  MessageCircleIcon,
  SettingsIcon,
  ShoppingBagIcon,
  StarIcon,
  XIcon,
} from "@animateicons/react/lucide";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  AdminThemeProvider,
  useAdminTheme,
} from "@/context/admin-theme";
import { TooltipProvider } from "@/components/ui/tooltip";

type IconProps = {
  size?: number;
  color?: string;
  className?: string;
  isAnimated?: boolean;
};

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  Icon: ComponentType<IconProps>;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        exact: true,
        Icon: LayoutDashboardIcon,
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", Icon: BoxIcon },
      { href: "/admin/collections", label: "Collections", Icon: LayersIcon },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", Icon: ShoppingBagIcon },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      { href: "/admin/reviews", label: "Reviews", Icon: StarIcon },
      {
        href: "/admin/testimonials",
        label: "Testimonials",
        Icon: MessageCircleIcon,
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", Icon: SettingsIcon },
    ],
  },
];

const COLLAPSED_KEY = "ns-admin-sidebar-collapsed";

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function AdminShellInner({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: {
    email?: string;
    name?: string;
    role?: string;
    isSuperAdmin?: boolean;
  } | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useAdminTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // One scroll surface only: lock document so body/html never compete with main.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlHeight: html.style.height,
      bodyHeight: body.style.height,
      bodyOverscroll: body.style.overscrollBehavior,
    };
    html.classList.add("admin-scroll-lock");
    html.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.height = "100%";
    body.style.overscrollBehavior = "none";
    return () => {
      html.classList.remove("admin-scroll-lock");
      html.style.overflow = prev.htmlOverflow;
      html.style.height = prev.htmlHeight;
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      body.style.overscrollBehavior = prev.bodyOverscroll;
    };
  }, []);

  /**
   * When the pointer is over the sidebar (or chrome that isn't the main pane),
   * still scroll the content column so the page never feels "stuck".
   */
  function redirectWheelToMain(e: WheelEvent<HTMLElement>) {
    const main = mainScrollRef.current;
    if (!main) return;
    const target = e.target as HTMLElement | null;
    const scrollParent = target?.closest(
      ".admin-sidebar-nav",
    ) as HTMLElement | null;
    if (scrollParent) {
      const { scrollTop, scrollHeight, clientHeight } = scrollParent;
      const canScroll = scrollHeight > clientHeight + 1;
      const scrollingDown = e.deltaY > 0;
      const scrollingUp = e.deltaY < 0;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
      if (canScroll) {
        if (scrollingDown && !atBottom) return;
        if (scrollingUp && !atTop) return;
      }
    }
    e.preventDefault();
    main.scrollTop += e.deltaY;
  }

  function toggleCollapse() {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-white/10",
          collapsed
            ? "justify-center px-2 py-5"
            : "justify-between gap-2 px-4 py-5",
        )}
      >
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate font-display text-base font-medium tracking-wide text-white">
              NS Perfume
            </p>
            <p className="mt-0.5 font-display text-[11px] uppercase tracking-[0.16em] text-white/40">
              Admin console
            </p>
          </div>
        ) : (
          <span
            className="font-display text-base font-semibold text-white"
            title="NS Perfume Admin"
          >
            NS
          </span>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          className="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white md:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <ChevronsRightIcon size={18} color="currentColor" isAnimated={false} />
          ) : (
            <ChevronsLeftIcon size={18} color="currentColor" isAnimated={false} />
          )}
        </button>
      </div>

      <nav
        className="admin-sidebar-nav min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain px-2.5 py-4"
        aria-label="Admin navigation"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            {!collapsed ? (
              <p className="mb-1.5 px-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                {group.label}
              </p>
            ) : (
              <div
                className="mx-auto mb-1.5 h-px w-6 bg-white/15"
                aria-hidden
              />
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.Icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      className={cn(
                        "flex items-center gap-3 rounded-md font-display text-[14px] font-medium transition-colors",
                        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
                        active
                          ? "bg-[var(--admin-sidebar-active-bg)] text-[var(--admin-sidebar-active-text)]"
                          : "text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-hover)] hover:text-white",
                      )}
                    >
                      <Icon
                        size={17}
                        color="currentColor"
                        isAnimated={false}
                        className="shrink-0"
                      />
                      {!collapsed ? (
                        <span className="truncate">{item.label}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1.5 border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-md px-2 py-2.5 font-display text-xs font-medium uppercase tracking-[0.1em] text-white/45 transition-colors hover:bg-white/10 hover:text-white",
          )}
          title="Open storefront"
        >
          <ExternalLinkIcon size={14} color="currentColor" isAnimated={false} />
          {!collapsed ? "Storefront" : null}
        </Link>
        <Button
          type="button"
          variant="secondary"
          onClick={logout}
          className={cn(
            "w-full gap-2 !border-white/15 !bg-transparent !text-white/55 hover:!bg-white/10 hover:!text-white sm:w-full",
            collapsed && "!px-2",
          )}
        >
          <LogOutIcon size={16} color="currentColor" isAnimated={false} />
          {collapsed ? null : "Log out"}
        </Button>
      </div>
    </div>
  );

  return (
    <div
      className="admin-app fixed inset-0 z-[40] flex overflow-hidden"
      data-theme={theme}
    >
      <aside
        className={cn(
          "hidden h-full shrink-0 border-r border-black/20 bg-[var(--admin-sidebar)] transition-[width] duration-200 md:flex md:flex-col",
          collapsed ? "w-[4.5rem]" : "w-60",
        )}
        onWheel={redirectWheelToMain}
      >
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(18rem,88vw)] flex-col bg-[var(--admin-sidebar)] shadow-modal">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
              <p className="font-display text-base font-medium text-white">
                Menu
              </p>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-1 px-2 py-1 font-display text-sm text-white/60"
                onClick={() => setMobileOpen(false)}
              >
                <XIcon size={16} color="currentColor" isAnimated={false} />
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{sidebar}</div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--admin-page)]">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--admin-line)] bg-[var(--admin-paper)] px-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 font-display text-sm font-medium text-[var(--admin-ink)]"
          >
            <MenuIcon size={18} color="currentColor" isAnimated={false} />
            Menu
          </button>
          <span className="font-display text-base font-medium text-[var(--admin-ink)]">
            NS Admin
          </span>
          <Button
            variant="secondary"
            onClick={logout}
            className="!h-9 !min-h-9 !w-auto !px-3"
          >
            <LogOutIcon size={14} color="currentColor" isAnimated={false} />
          </Button>
        </header>

        <main
          id="admin-main-scroll"
          ref={mainScrollRef}
          className="admin-main-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
        >
          <div className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: {
    email?: string;
    name?: string;
    role?: string;
    isSuperAdmin?: boolean;
  } | null;
}) {
  return (
    <AdminThemeProvider>
      <TooltipProvider delayDuration={120} skipDelayDuration={0}>
        <AdminShellInner user={user}>{children}</AdminShellInner>
      </TooltipProvider>
    </AdminThemeProvider>
  );
}
