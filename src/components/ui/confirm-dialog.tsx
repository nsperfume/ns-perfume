"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  /** danger = red confirm for deletes */
  tone?: "danger" | "default";
  loading?: boolean;
};

/**
 * Radix Alert Dialog for destructive / confirm flows.
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
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-ink/45 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <AlertDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[101] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2",
            "rounded-lg border border-[#e4e6ea] bg-paper p-6 shadow-modal outline-none",
          )}
        >
          <AlertDialog.Title className="font-display text-xl font-medium text-ink">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-base leading-relaxed text-[#5c6370]">
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
