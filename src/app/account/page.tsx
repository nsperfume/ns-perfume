import type { Metadata } from "next";
import { Suspense } from "react";
import AccountClient from "./account-client";

export const metadata: Metadata = {
  title: "Account",
  description:
    "Sign in to NS Perfume for order history, repeat orders, and a simple profile.",
};

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <section className="bg-canvas section-y">
          <div className="container-ns max-w-lg">
            <p className="font-serif text-taupe">Loading your account…</p>
          </div>
        </section>
      }
    >
      <AccountClient />
    </Suspense>
  );
}
