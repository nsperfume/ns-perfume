"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, isValid, parseISO } from "date-fns";
import * as Popover from "@radix-ui/react-popover";
import { AdminFieldLabel } from "@/components/admin/form-section";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  tip?: string;
  required?: boolean;
  className?: string;
};

function toDate(value: string) {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

function CalendarGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

/**
 * Admin date field. Portals into `.admin-app` so theme tokens apply,
 * and uses an opaque panel so form fields never show through.
 */
export function AdminDatePickerField({
  label,
  value,
  onChange,
  error,
  tip,
  required,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [panelBg, setPanelBg] = useState("#181b22");
  const selected = useMemo(() => toDate(value), [value]);
  const display = selected ? format(selected, "d MMM yyyy") : "Pick a date";

  useEffect(() => {
    const app = document.querySelector(".admin-app") as HTMLElement | null;
    setPortalEl(app);
    if (app) {
      const paper = getComputedStyle(app)
        .getPropertyValue("--admin-paper")
        .trim();
      if (paper) setPanelBg(paper);
    }
  }, []);

  return (
    <div className={cn("relative block", className)}>
      <AdminFieldLabel tip={tip} required={required}>
        {label}
      </AdminFieldLabel>
      <Popover.Root open={open} onOpenChange={setOpen} modal>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md border bg-[var(--admin-soft-2)] px-3.5 text-left text-sm outline-none transition-colors",
              "border-[var(--admin-input-border)] text-[var(--admin-ink)]",
              "hover:border-[var(--admin-muted)] focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/20",
              error && "border-rosewood focus-visible:ring-rosewood/20",
              !selected && "text-[var(--admin-faint)]",
            )}
          >
            <span className="truncate">{display}</span>
            <CalendarGlyph className="h-[18px] w-[18px] shrink-0 opacity-70" />
          </button>
        </Popover.Trigger>

        {open ? (
          <div
            className="fixed inset-0 z-[190]"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            aria-hidden
            onClick={() => setOpen(false)}
          />
        ) : null}

        <Popover.Portal container={portalEl ?? undefined}>
          <Popover.Content
            align="start"
            side="bottom"
            sideOffset={8}
            collisionPadding={20}
            avoidCollisions
            className={cn(
              "admin-date-popover z-[200] w-[min(100vw-2rem,19.5rem)] rounded-lg border p-3 outline-none",
              "border-[var(--admin-line)] text-[var(--admin-ink)]",
              "shadow-[0_16px_48px_rgba(0,0,0,0.45)]",
            )}
            style={{
              backgroundColor: panelBg,
              opacity: 1,
            }}
          >
            <DayPicker
              mode="single"
              selected={selected}
              defaultMonth={selected}
              onSelect={(day) => {
                if (!day) return;
                onChange(format(day, "yyyy-MM-dd"));
                setOpen(false);
              }}
              classNames={{
                root: "admin-rdp w-full",
                months: "relative flex w-full flex-col",
                month: "w-full space-y-3",
                month_caption:
                  "relative flex h-10 items-center justify-center px-10",
                caption_label:
                  "font-display text-sm font-semibold tracking-wide text-[var(--admin-ink)]",
                nav: "absolute inset-x-0 top-0 flex h-10 items-center justify-between",
                button_previous:
                  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[var(--admin-ink)] hover:bg-[var(--admin-soft)]",
                button_next:
                  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[var(--admin-ink)] hover:bg-[var(--admin-soft)]",
                month_grid: "w-full border-collapse",
                weekdays: "grid w-full grid-cols-7",
                weekday:
                  "h-8 text-center font-display text-[10px] font-medium uppercase tracking-wide text-[var(--admin-faint)]",
                weeks: "w-full",
                week: "mt-1 grid w-full grid-cols-7",
                day: "relative flex items-center justify-center p-0 text-center",
                day_button: cn(
                  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md",
                  "font-serif text-sm text-[var(--admin-ink)]",
                  "hover:bg-[var(--admin-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/50",
                ),
                selected:
                  "[&>button]:bg-brass [&>button]:font-semibold [&>button]:text-white [&>button]:hover:bg-brass [&>button]:hover:text-white",
                today: "[&>button]:font-semibold [&>button]:text-brass",
                outside:
                  "[&>button]:text-[var(--admin-faint)] [&>button]:opacity-40",
                disabled: "[&>button]:opacity-25 [&>button]:cursor-not-allowed",
                hidden: "invisible",
                chevron: "fill-[var(--admin-ink)]",
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {error ? (
        <p className="mt-1.5 text-sm text-rosewood">{error}</p>
      ) : null}
    </div>
  );
}
