"use client";

import { AppErrorPanel } from "@/components/layout/app-error-panel";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="admin-app min-h-dvh">
      <AppErrorPanel error={error} reset={reset} variant="admin" />
    </div>
  );
}
