import type { Metadata } from "next";

/** Browser tab title: "Emails | NS Admin" (template in app/admin/layout.tsx). */
export const metadata: Metadata = { title: "Emails" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
