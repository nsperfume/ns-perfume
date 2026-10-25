import type { Metadata } from "next";

/** Access is enforced by src/proxy.ts (pages) and requireAdmin (APIs). */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
