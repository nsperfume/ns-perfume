import type { Metadata } from "next";

/** Browser tab title: "Settings | NS Admin" (template in app/admin/layout.tsx). */
export const metadata: Metadata = { title: "Settings" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
