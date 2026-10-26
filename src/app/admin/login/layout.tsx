import type { Metadata } from "next";

/** Browser tab title: "Sign in | NS Admin" (template in app/admin/layout.tsx). */
export const metadata: Metadata = { title: "Sign in" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
