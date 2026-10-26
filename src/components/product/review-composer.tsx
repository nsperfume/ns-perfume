"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { XIcon } from "@/components/ui/icons";
import { ProductReviewForm } from "@/components/product/review-form";

/**
 * "Write a review" button that opens the form in a modal dialog (a bottom
 * sheet on phones). Also opens when the page is reached through a
 * #write-review link, e.g. "Be the first to review" in the buy box.
 */
export function ReviewComposer({
  productHandle,
  productName,
}: {
  productHandle: string;
  productName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  // Remount the form on every open so a sent review starts fresh next time.
  const [session, setSession] = useState(0);

  const show = useCallback(() => {
    if (dialogRef.current?.open) return;
    setSession((n) => n + 1);
    setOpen(true);
  }, []);

  // Open after the form has rendered so focus lands inside it.
  useEffect(() => {
    const d = dialogRef.current;
    if (!open || !d || d.open) return;
    d.showModal();
    document.documentElement.style.overflow = "hidden";
  }, [open]);

  const close = useCallback(() => dialogRef.current?.close(), []);

  // Never leave the page scroll-locked if we unmount while open.
  useEffect(() => () => {
    document.documentElement.style.overflow = "";
  }, []);

  useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#write-review") show();
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [show]);

  const onClosed = () => {
    setOpen(false);
    document.documentElement.style.overflow = "";
    // Drop the hash so the same link can open the dialog again.
    if (window.location.hash === "#write-review") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  return (
    <div id="write-review" className="scroll-mt-[calc(var(--spacing-chrome-height)+1rem)]">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full sm:w-auto"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={show}
      >
        Write a review
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="review-dialog-title"
        onClose={onClosed}
        onClick={(e) => {
          // A click on the backdrop lands on the <dialog> element itself.
          if (e.target === e.currentTarget) close();
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] max-w-none overflow-y-auto overscroll-contain rounded-2xl border border-hairline bg-paper p-0 text-ink backdrop:bg-ink/55 max-sm:mb-0 max-sm:max-h-[92dvh] max-sm:w-full max-sm:rounded-b-none max-sm:rounded-t-3xl"
      >
        {open ? (
          <div className="relative px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-eyebrow text-taupe">Write a review</p>
                <h2 id="review-dialog-title" className="mt-1.5 text-display-sm text-ink">
                  {productName}
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-taupe transition-colors hover:bg-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-brass/60"
              >
                <XIcon size={20} />
              </button>
            </div>
            <ProductReviewForm
              key={session}
              productHandle={productHandle}
              productName={productName}
              onDone={close}
            />
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
