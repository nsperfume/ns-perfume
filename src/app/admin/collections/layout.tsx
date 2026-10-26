import type { Metadata } from "next";

/** Browser tab title: "Collections | NS Admin" (template in app/admin/layout.tsx). */
export const metadata: Metadata = { title: "Collections" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
