"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import * as Popover from "@radix-ui/react-popover";
import { AdminFieldLabel } from "@/components/admin/form-section";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  error?: string;
  tip?: string;
  required?: boolean;
  className?: string;
};

function normalizeHex(input: string) {
  let next = input.trim();
  if (!next.startsWith("#")) next = `#${next}`;
  if (/^#[0-9A-Fa-f]{3}$/.test(next)) {
    const [, r, g, b] = next;
    next = `#${r}${r}${g}${g}${b}${b}`;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(next)) return null;
  return next.toUpperCase();
}

/**
 * Admin color field with react-colorful picker + hex input.
 */
export function AdminColorPickerField({
  label,
  value,
  onChange,
  error,
  tip,
  required,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const safe = normalizeHex(value) || "#E8DFC8";

  return (
    <div className={cn("block", className)}>
      <AdminFieldLabel tip={tip} required={required}>
        {label}
      </AdminFieldLabel>
      <div className="flex gap-2">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label="Open color picker"
              className={cn(
                "h-11 w-12 shrink-0 cursor-pointer rounded-md border border-admin-input-border shadow-inner outline-none",
                "focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/20",
              )}
              style={{ backgroundColor: safe }}
            />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={6}
              className="z-80 rounded-lg border border-admin-line bg-admin-paper p-3 shadow-lg outline-none"
            >
              <HexColorPicker
                color={safe}
                onChange={(hex) => onChange(hex.toUpperCase())}
              />
              <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-admin-muted">
                {safe}
              </p>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <input
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw);
            const normalized = normalizeHex(raw);
            if (normalized) onChange(normalized);
          }}
          onBlur={() => {
            const normalized = normalizeHex(value);
            if (normalized) onChange(normalized);
          }}
          spellCheck={false}
          className={cn(
            "h-11 min-w-0 flex-1 rounded-md border border-admin-input-border bg-admin-soft-2 px-3.5 font-mono text-sm text-admin-ink outline-none",
            "focus:border-brass focus:ring-2 focus:ring-brass/20",
            error && "border-rosewood focus:ring-rosewood/20",
          )}
          placeholder="#E8DFC8"
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-sm text-rosewood">{error}</p>
      ) : null}
    </div>
  );
}
