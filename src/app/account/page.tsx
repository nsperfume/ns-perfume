import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in and order history for NS Perfume will live here soon.",
};

export default function AccountPage() {
  return (
    <section className="bg-canvas section-y">
      <div className="container-ns max-w-lg">
        <h1 className="text-display-lg mb-3">Account</h1>
        <p className="measure mb-8 font-sans text-body text-taupe">
          Customer sign-in and order history are not open yet. You can still
          track a recent order or reach care by email.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button href="/track-order">Track an order</Button>
          <Button href="/contact" variant="secondary">
            Contact care
          </Button>
        </div>
      </div>
    </section>
  );
}
