import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your NS Perfume account.",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <section className="bg-canvas section-y">
      <div className="container-ns max-w-lg">
        <p className="mb-2 text-eyebrow text-taupe">
          Account
        </p>
        <h1 className="text-display-lg text-balance text-ink">Choose a new password</h1>
        {/* The form renders the intro, so it can drop it when the link has no token. */}
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </section>
  );
}
