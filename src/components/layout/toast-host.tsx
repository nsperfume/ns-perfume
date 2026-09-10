"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useUi, type ToastItem } from "@/context/ui";
import { cn } from "@/lib/cn";

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(el, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    gsap.fromTo(
      el,
      { opacity: 0, y: 16, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: "power3.out" },
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
      <p className="flex-1 font-serif text-[0.95rem] font-medium leading-snug">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 cursor-pointer font-display text-[10px] uppercase tracking-[0.12em] text-taupe hover:text-ink"
      >
        Close
      </button>
    </div>
  );
}

export function ToastHost() {
  const { toasts, dismissToast } = useUi();

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-90 flex flex-col items-center gap-2 px-4 sm:bottom-8">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}
