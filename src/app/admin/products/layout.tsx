import type { Metadata } from "next";

/**
 * Browser tab title: "Products | NS Admin". The template is repeated here because a
 * plain string title would drop it for the pages nested under this one.
 */
export const metadata: Metadata = {
  title: { default: "Products", template: "%s | NS Admin" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
