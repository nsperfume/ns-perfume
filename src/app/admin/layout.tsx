import type { Metadata } from "next";

/** Access is enforced by src/proxy.ts (pages) and requireAdmin (APIs). */
export const metadata: Metadata = {
  // Each section layout names its tab, e.g. "Orders | NS Admin". Pages without
  // one show plain "NS Admin" rather than another page's name.
  title: { absolute: "NS Admin", template: "%s | NS Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
