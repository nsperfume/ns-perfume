import type { Metadata } from "next";
import { Suspense } from "react";
import AccountClient from "./account-client";
import { BrandLoaderBlock } from "@/components/brand/brand-loader";

export const metadata: Metadata = {
  title: "Account",
  description:
    "Sign in to NS Perfume for order history, repeat orders, and a simple profile.",
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <>
      {/* Account UI renders on the client after the session check, so the H1 lives here. */}
      <h1 className="sr-only">Your NS Perfume account</h1>
      <Suspense
        fallback={
          <BrandLoaderBlock label="Loading your account" />
        }
      >
        <AccountClient />
      </Suspense>
    </>
  );
}
