import type { Metadata } from "next";

/** Browser tab title: "Testimonials | NS Admin" (template in app/admin/layout.tsx). */
export const metadata: Metadata = { title: "Testimonials" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
