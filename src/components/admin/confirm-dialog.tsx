"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useEffect, useState } from "react";
import { Button } from "@/components/admin/button";

type AdminConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  /** danger = rosewood confirm for deletes, cancels, disables */
  tone?: "danger" | "default";
  loading?: boolean;
};

/**
 * Confirmation for destructive or irreversible actions. Renders inside
 * `.admin-app` (not <body>) so it picks up the console theme tokens.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  tone = "danger",
  loading = false,
}: AdminConfirmDialogProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setContainer(document.querySelector<HTMLElement>(".admin-app"));
  }, []);

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal container={container ?? undefined}>
        <AlertDialog.Overlay className="fixed inset-0 z-100 bg-black/45 backdrop-blur-[1px]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-101 w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-admin-line bg-admin-paper p-6 text-admin-ink shadow-modal outline-none">
          <AlertDialog.Title className="text-lg font-semibold text-admin-ink">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-[0.9375rem] leading-relaxed text-admin-muted">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                className="sm:w-auto"
              >
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                type="button"
                variant={tone === "danger" ? "danger" : "primary"}
                disabled={loading}
                className="sm:w-auto"
                onClick={(e) => {
                  e.preventDefault();
                  void onConfirm();
                }}
              >
                {loading ? "Working…" : confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export default ConfirmDialog;
