"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductReviewForm } from "@/components/product/review-form";

/**
 * "Write a review" button that expands the form inline. Opens on its own when
 * the page is reached through a #write-review link (e.g. from the buy box).
 */
export function ReviewComposer({
  productHandle,
  productName,
}: {
  productHandle: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#write-review") setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (!open || window.location.hash !== "#write-review") return;
    document
      .getElementById("write-review")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [open]);

  return (
    <div
      id="write-review"
      className="scroll-mt-[calc(var(--spacing-chrome-height)+1rem)]"
    >
      {open ? (
        <div>
          <ProductReviewForm
            productHandle={productHandle}
            productName={productName}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex min-h-10 cursor-pointer items-center text-caption text-taupe underline decoration-hairline underline-offset-4 hover:text-ink"
          >
            Close the form
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full sm:w-auto"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          Write a review
        </Button>
      )}
    </div>
  );
}
