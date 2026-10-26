import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

/** Centered card used by admin sign-in and password recovery screens. */
export function AdminAuthCard({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="admin-app flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-admin-line bg-admin-paper p-7 sm:p-10">
        <Logo className="h-7 text-admin-ink" />
        <h1 className="mt-7 text-[1.625rem] font-semibold tracking-[-0.015em] text-admin-ink">{title}</h1>
        {intro ? <p className="mt-2 text-[0.9375rem] leading-relaxed text-admin-muted">{intro}</p> : null}
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}
