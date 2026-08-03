import type { Metadata } from "next";
import { ThankYouClient } from "@/components/checkout/thank-you-client";

export const metadata: Metadata = {
  title: "Order confirmed",
  description: "Thank you for your NS Perfume order.",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return <ThankYouClient />;
}
