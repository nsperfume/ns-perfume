import type { Metadata } from "next";

/** Browser tab title: "Reviews | NS Admin" (template in app/admin/layout.tsx). */
export const metadata: Metadata = { title: "Reviews" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
