"use client";

import { AppErrorPanel } from "@/components/layout/app-error-panel";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppErrorPanel error={error} reset={reset} variant="store" />;
}
