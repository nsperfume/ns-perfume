import type { Metadata } from "next";
import { formatOrderNumber } from "@/lib/order-number";

type Props = { params: Promise<{ orderNumber: string }> };

/** Browser tab title: "Order NS-7K4Q2M | NS Admin". */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderNumber } = await params;
  let ref = orderNumber;
  try {
    ref = decodeURIComponent(orderNumber);
  } catch {
    /* keep the raw segment */
  }
  return { title: `Order ${formatOrderNumber(ref)}` };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
