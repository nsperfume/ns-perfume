import type { Metadata } from "next";

/** Browser tab title: "Messages | NS Admin" (template in app/admin/layout.tsx). */
export const metadata: Metadata = { title: "Messages" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
