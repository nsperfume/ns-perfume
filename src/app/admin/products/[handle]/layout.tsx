import type { Metadata } from "next";

type Props = { params: Promise<{ handle: string }> };

/** Browser tab title: "Add product | NS Admin" or "Edit product | NS Admin". */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return { title: handle === "new" ? "Add product" : "Edit product" };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
