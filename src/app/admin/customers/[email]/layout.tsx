import type { Metadata } from "next";

/** Browser tab title: "Customer | NS Admin". */
export const metadata: Metadata = { title: "Customer" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
