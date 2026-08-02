"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/admin", label: "Home", exact: true },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: { email?: string; name?: string } | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-[#f6f6f7] text-[#1a1a1a]">
      <aside className="hidden w-60 shrink-0 border-r border-[#e1e3e5] bg-[#1a1c1d] text-white md:flex md:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-sm font-semibold tracking-wide">NS Perfume</p>
          <p className="mt-0.5 text-xs text-white/55">Admin</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-white/12 font-medium text-white"
                    : "text-white/70 hover:bg-white/8 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-xs text-white/60">{user?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 text-xs text-white/80 underline-offset-2 hover:underline"
          >
            Log out
          </button>
          <Link
            href="/"
            className="mt-3 block text-xs text-white/50 hover:text-white/80"
          >
            ← View storefront
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-[#e1e3e5] bg-white px-4 md:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <span className="text-sm font-semibold">NS Admin</span>
          </div>
          <p className="hidden text-sm text-[#6d7175] md:block">
            {user?.name || "Admin"}
          </p>
          <div className="flex gap-2 overflow-x-auto md:hidden">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded bg-[#f1f2f3] px-2 py-1 text-xs"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
