"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType, type WheelEvent } from "react";
import {
  BoxIcon,
  BookOpenIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  EyeIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MailIcon,
  MenuIcon,
  MessageCircleIcon,
  SendIcon,
  SettingsIcon,
  ShoppingBagIcon,
  StarIcon,
  UserIcon,
  UserRoundCogIcon,
  UsersIcon,
  XIcon,
} from "@animateicons/react/lucide";
import { cn } from "@/lib/cn";
import { Button } from "@/components/admin/button";
import { Logo, LogoMark } from "@/components/brand/logo";
import {
  AdminThemeProvider,
  useAdminTheme,
} from "@/context/admin-theme";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { AdminToaster } from "@/components/admin/toast";
import { AdminAccessProvider } from "@/components/admin/access";

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
  /** Shown to owners only. */
  ownerOnly?: boolean;
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
      { href: "/admin/customers", label: "Customers", Icon: UserIcon },
      { href: "/admin/contacts", label: "Messages", Icon: MailIcon },
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
      { href: "/admin/journal", label: "Journal", Icon: BookOpenIcon },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { href: "/admin/emails", label: "Emails", Icon: SendIcon },
      { href: "/admin/team", label: "Team", ownerOnly: true, Icon: UsersIcon },
      { href: "/admin/settings", label: "Settings", Icon: SettingsIcon },
    ],
  },
];

const COLLAPSED_KEY = "ns-admin-sidebar-collapsed";

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Tooltip for icon-only sidebar links (collapsed menu). */
function NavTip({
  show,
  label,
  children,
}: {
  show: boolean;
  label: string;
  children: React.ReactElement;
}) {
  if (!show) return children;
  return (
    <Tooltip content={label} side="right">
      {children}
    </Tooltip>
  );
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
    roleLabel?: string;
    isSuperAdmin?: boolean;
    /** False for viewers and for anyone still on a temporary password. */
    canWrite?: boolean;
    mustChangePassword?: boolean;
  } | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useAdminTheme();
  const isOwner = Boolean(user?.isSuperAdmin || user?.role === "super_admin");
  // Until the account loads, assume write access so owners never see controls flicker off.
  const canWrite = user ? user.canWrite !== false && user.role !== "viewer" : true;
  const viewOnly = Boolean(user) && !canWrite && !user?.mustChangePassword;

  // Temporary password: nothing else until they choose their own.
  useEffect(() => {
    if (user?.mustChangePassword && pathname !== "/admin/profile") router.replace("/admin/profile");
  }, [user?.mustChangePassword, pathname, router]);
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

  // Portalled layers (select menus, tooltips, confirm dialogs) live on <body>;
  // mirror the console theme on <html> so globals.css can theme them too.
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.adminTheme = theme;
    return () => {
      delete html.dataset.adminTheme;
    };
  }, [theme]);

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
            : "justify-between gap-2 px-5 py-5",
        )}
      >
        {!collapsed ? (
          <Link href="/admin" className="block min-w-0 text-white">
            <Logo className="h-8 max-w-full" title="NS Perfume admin" />
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
              Admin console
            </p>
          </Link>
        ) : (
          <Link
            href="/admin"
            className="flex text-white"
            title="NS Perfume Admin"
          >
            <LogoMark className="h-9" title="NS Perfume admin" />
          </Link>
        )}
        <Tooltip content={collapsed ? "Expand menu" : "Collapse menu"} side="right">
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/55 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-brass/60 md:flex"
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? (
              <ChevronsRightIcon size={18} color="currentColor" isAnimated={false} />
            ) : (
              <ChevronsLeftIcon size={18} color="currentColor" isAnimated={false} />
            )}
          </button>
        </Tooltip>
      </div>

      <nav
        className="admin-sidebar-nav min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-contain px-3 py-5"
        aria-label="Admin navigation"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.id}>
            {!collapsed ? (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-admin-sidebar-muted">
                {group.label}
              </p>
            ) : (
              <div
                className="mx-auto mb-1.5 h-px w-6 bg-white/15"
                aria-hidden
              />
            )}
            <ul className="space-y-0.5">
              {group.items.filter((item) => !item.ownerOnly || isOwner).map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.Icon;
                return (
                  <li key={item.href}>
                    <NavTip show={collapsed} label={item.label}>
                    <Link
                      href={item.href}
                      aria-label={collapsed ? item.label : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-md text-[0.9375rem] font-medium transition-colors",
                        collapsed ? "justify-center px-2" : "px-3",
                        active
                          ? "bg-admin-sidebar-active-bg text-admin-sidebar-active-text"
                          : "text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-white",
                      )}
                    >
                      <Icon
                        size={18}
                        color="currentColor"
                        isAnimated={false}
                        className="shrink-0"
                      />
                      {!collapsed ? (
                        <span className="truncate">{item.label}</span>
                      ) : null}
                    </Link>
                    </NavTip>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1.5 border-t border-white/10 p-3">
        <NavTip show={collapsed} label="Profile">
          <Link
            href="/admin/profile"
            aria-label={collapsed ? "Profile" : undefined}
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-md transition-colors",
              collapsed ? "justify-center px-2" : "px-3",
              pathname === "/admin/profile"
                ? "bg-admin-sidebar-active-bg text-admin-sidebar-active-text"
                : "text-admin-sidebar-text hover:bg-admin-sidebar-hover hover:text-white",
            )}
          >
            <UserRoundCogIcon size={18} color="currentColor" isAnimated={false} className="shrink-0" />
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem] font-medium">{user?.name || "Profile"}</span>
                <span className="block truncate text-xs opacity-70">{user?.roleLabel || "Your account"}</span>
              </span>
            ) : null}
          </Link>
        </NavTip>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white",
          )}
          title="Open storefront"
        >
          <EyeIcon size={16} color="currentColor" isAnimated={false} />
          {!collapsed ? "View storefront" : null}
        </Link>
        <Button
          type="button"
          variant="secondary"
          onClick={logout}
          className={cn(
            "w-full gap-2 border-white/20! bg-transparent! text-white/70! hover:text-white! sm:w-full",
            collapsed && "px-2!",
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
      // overflow-clip, not hidden: a hidden box can still be scrolled by focus or
      // scrollIntoView, which shifted the whole console. Only <main> scrolls.
      className="admin-app fixed inset-0 z-40 flex overflow-clip"
      data-theme={theme}
    >
      <aside
        className={cn(
          "hidden h-full shrink-0 border-r border-black/20 bg-admin-sidebar transition-[width] duration-200 md:flex md:flex-col",
          collapsed ? "w-[4.5rem]" : "w-66",
        )}
        onWheel={redirectWheelToMain}
      >
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-70 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[min(18rem,88vw)] flex-col bg-admin-sidebar">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
              <p className="text-base font-semibold text-white">
                Menu
              </p>
              <button
                type="button"
                className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                <XIcon size={16} color="currentColor" isAnimated={false} />
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-clip">{sidebar}</div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-clip bg-admin-page">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-admin-line bg-admin-paper px-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[0.9375rem] font-semibold text-admin-ink hover:bg-admin-soft"
          >
            <MenuIcon size={18} color="currentColor" isAnimated={false} />
            Menu
          </button>
          <Link href="/admin" className="flex text-admin-ink">
            <Logo className="h-7" title="NS Perfume admin" />
          </Link>
          <Tooltip content="Log out">
            <button
              type="button"
              onClick={logout}
              aria-label="Log out"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-admin-line text-admin-muted outline-none transition-colors hover:border-admin-ink hover:text-admin-ink focus-visible:ring-2 focus-visible:ring-brass/60"
            >
              <LogOutIcon size={17} color="currentColor" isAnimated={false} />
            </button>
          </Tooltip>
        </header>

        <main
          id="admin-main-scroll"
          ref={mainScrollRef}
          className="admin-main-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
        >
          <div className="mx-auto w-full max-w-[1600px] px-4 pb-10 pt-5 sm:px-6 sm:pt-7 lg:px-8 2xl:px-10">
            {viewOnly ? (
              <div
                role="status"
                className="mb-5 flex items-center gap-2 rounded-md border border-admin-line bg-admin-soft-2 px-4 py-2.5 text-sm text-admin-ink"
              >
                <EyeIcon size={16} color="currentColor" isAnimated={false} className="shrink-0 text-admin-muted" />
                <span>
                  <strong className="font-semibold">View only.</strong> You can look at everything, but changes are turned off for your account.
                </span>
              </div>
            ) : null}
            <AdminAccessProvider value={{ canWrite, isOwner }}>{children}</AdminAccessProvider>
          </div>
        </main>
      </div>
      <AdminToaster theme={theme} />
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
    roleLabel?: string;
    isSuperAdmin?: boolean;
    /** False for viewers and for anyone still on a temporary password. */
    canWrite?: boolean;
    mustChangePassword?: boolean;
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
