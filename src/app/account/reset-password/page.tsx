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
        <p className="mt-4 text-body-lg text-taupe">
          Use at least 8 characters. After saving you will be signed in.
        </p>
        <div className="mt-8 border border-hairline bg-paper p-6 sm:p-8">
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
