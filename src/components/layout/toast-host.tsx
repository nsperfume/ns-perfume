"use client";

import { useEffect, useRef } from "react";
import { animate } from "@/lib/animate";
import { useUi, type ToastItem } from "@/context/ui";
import { useCart } from "@/context/cart";
import { XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    animate(
      ref.current,
      [
        { opacity: 0, transform: "translateY(16px) scale(0.96)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 380 },
    );
  }, []);

  return (
    <div
      ref={ref}
      role="status"
      className={cn(
        "pointer-events-auto flex min-w-[16rem] max-w-sm items-center gap-3 rounded-md border border-hairline bg-paper px-4 py-3 text-ink shadow-modal",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          toast.kind === "cart" && "bg-brass",
          toast.kind === "wishlist" && "bg-rosewood",
          toast.kind === "info" && "bg-ink",
        )}
        aria-hidden
      />
      <p className="flex-1 text-body-sm font-medium leading-snug">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-mr-1.5 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-taupe transition-colors hover:bg-muted hover:text-ink"
      >
        <XIcon size={16} />
      </button>
    </div>
  );
}

export function ToastHost() {
  const { toasts: all, dismissToast } = useUi();
  const { isOpen: cartOpen } = useCart();
  // The open drawer already confirms an add; a cart toast on top of it covers Check out on phones.
  const toasts = cartOpen ? all.filter((t) => t.kind !== "cart") : all;

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-90 flex flex-col items-center gap-2 px-4 sm:bottom-8">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}
