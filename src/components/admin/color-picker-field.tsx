"use client";

import { useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import * as Popover from "@radix-ui/react-popover";
import { AdminFieldLabel } from "@/components/admin/form-section";
import { AdminFieldError } from "@/components/admin/form-validation";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  error?: string;
  tip?: string;
  required?: boolean;
  className?: string;
  /** Field key for validation focus */
  name?: string;
};

/** Warm brand swatches so most picks need no fiddling. */
const SWATCHES = [
  { hex: "#F3EDE2", name: "Ivory" },
  { hex: "#E8DFC8", name: "Sand" },
  { hex: "#D9C3A0", name: "Oat" },
  { hex: "#C9A46A", name: "Honey" },
  { hex: "#A9873C", name: "Brass" },
  { hex: "#D9B8B0", name: "Blush" },
  { hex: "#8B4A45", name: "Rosewood" },
  { hex: "#6B645A", name: "Smoke" },
  { hex: "#2B2823", name: "Charcoal" },
] as const;

function normalizeHex(input: string) {
  let next = (input || "").trim();
  if (!next.startsWith("#")) next = `#${next}`;
  if (/^#[0-9A-Fa-f]{3}$/.test(next)) {
    const [, r, g, b] = next;
    next = `#${r}${r}${g}${g}${b}${b}`;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(next)) return null;
  return next.toUpperCase();
}

function swatchName(hex: string | null) {
  if (!hex) return "Choose a colour";
  return SWATCHES.find((s) => s.hex === hex)?.name ?? "Custom colour";
}

/**
 * Admin colour field: a swatch button that opens brand presets and a picker.
 * No hex typing needed.
 */
export function AdminColorPickerField({
  label,
  value,
  onChange,
  error,
  tip,
  required,
  className,
  name,
}: Props) {
  const [open, setOpen] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const normalized = normalizeHex(value);
  const safe = normalized || "#E8DFC8";

  useEffect(() => {
    setContainer(document.querySelector<HTMLElement>(".admin-app"));
  }, []);

  return (
    <div className={cn("block", className)} data-field={name}>
      <AdminFieldLabel tip={tip} required={required}>
        {label}
      </AdminFieldLabel>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-invalid={error ? true : undefined}
            aria-label={`${label}: ${swatchName(normalized)}`}
            className={cn(
              "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md border border-admin-input-border bg-admin-soft-2 px-2 text-left text-base text-admin-ink outline-none transition-colors",
              "hover:border-admin-muted focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/20",
            )}
          >
            <span
              className="h-8 w-8 shrink-0 rounded-md border border-black/10 shadow-inner"
              style={{ backgroundColor: safe }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">
              {swatchName(normalized)}
            </span>
            <span className="pr-1.5 text-sm font-semibold text-admin-accent">
              Change
            </span>
          </button>
        </Popover.Trigger>
        <Popover.Portal container={container ?? undefined}>
          <Popover.Content
            align="start"
            sideOffset={6}
            collisionPadding={16}
            className="z-200 w-[15.5rem] rounded-lg border border-admin-line bg-admin-paper p-3 text-admin-ink shadow-modal outline-none"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-admin-muted">
              Brand colours
            </p>
            <div className="grid grid-cols-5 gap-2">
              {SWATCHES.map((s) => (
                <button
                  key={s.hex}
                  type="button"
                  title={s.name}
                  aria-label={s.name}
                  aria-pressed={normalized === s.hex}
                  onClick={() => onChange(s.hex)}
                  className={cn(
                    "h-9 w-9 cursor-pointer rounded-md border border-black/10 outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brass/40",
                    normalized === s.hex &&
                      "ring-2 ring-admin-ink ring-offset-2 ring-offset-admin-paper",
                  )}
                  style={{ backgroundColor: s.hex }}
                />
              ))}
            </div>
            <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-admin-muted">
              Custom
            </p>
            <HexColorPicker
              color={safe}
              onChange={(hex) => onChange(hex.toUpperCase())}
              style={{ width: "100%", height: "9rem" }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <AdminFieldError message={error} />
    </div>
  );
}
