import type { Metadata } from "next";

/**
 * Browser tab title: "Orders | NS Admin". The template is repeated here because a
 * plain string title would drop it for the pages nested under this one.
 */
export const metadata: Metadata = {
  title: { default: "Orders", template: "%s | NS Admin" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
