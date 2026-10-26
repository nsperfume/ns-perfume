import type { Metadata } from "next";

/** Browser tab title: "Journal | NS Admin" (template in app/admin/layout.tsx). */
export const metadata: Metadata = { title: "Journal" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
