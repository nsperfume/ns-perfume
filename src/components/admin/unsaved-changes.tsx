"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

/**
 * Warn before leaving a form with unsaved changes: browser close/reload
 * (native prompt) and in-app link clicks (console confirm dialog).
 *
 *   const leaveGuard = useUnsavedChangesGuard(dirty && !saving);
 *   return <>{form}{leaveGuard}</>;
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) return;

    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = (e.target as Element | null)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      )
        return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(url.pathname + url.search + url.hash);
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  return (
    <ConfirmDialog
      open={pendingHref !== null}
      onOpenChange={(o) => {
        if (!o) setPendingHref(null);
      }}
      title="Leave without saving?"
      description="Your changes on this page will be lost."
      confirmLabel="Leave page"
      cancelLabel="Keep editing"
      onConfirm={() => {
        const href = pendingHref;
        setPendingHref(null);
        if (href) router.push(href);
      }}
    />
  );
}
