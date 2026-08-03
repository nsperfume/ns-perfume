"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDownIcon } from "@animateicons/react/lucide";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
  triggerClassName?: string;
  /** Dark chrome (nav) vs light page surfaces */
  tone?: "light" | "dark";
  disabled?: boolean;
  "aria-label"?: string;
};

/**
 * Themed Radix Select. Light: paper/ink. Dark: glass-on-nav style.
 */
export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select",
  label,
  id,
  className,
  triggerClassName,
  tone = "light",
  disabled,
  "aria-label": ariaLabel,
}: SelectProps) {
  const dark = tone === "dark";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={id}
          className="font-display text-sm font-medium text-ink/80"
        >
          {label}
        </label>
      ) : null}
      <SelectPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id}
          aria-label={ariaLabel ?? label}
          className={cn(
            "group inline-flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-3.5 py-2.5 font-display text-base font-medium outline-none transition-colors",
            "focus-visible:ring-2 focus-visible:ring-brass/25 disabled:cursor-not-allowed disabled:opacity-50",
            "data-[placeholder]:text-[#9aa1ad]",
            dark
              ? "border-white/25 bg-white/5 text-paper backdrop-blur-md hover:border-white/50 data-[state=open]:border-white/50"
              : "border-[#d8dbe2] bg-paper text-ink hover:border-ink/30 data-[state=open]:border-brass",
            triggerClassName,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDownIcon
              size={16}
              color="currentColor"
              className="shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180"
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              "scrollbar-panel z-[80] max-h-[min(18rem,70vh)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-hairline bg-paper text-ink shadow-modal",
            )}
          >
            <SelectPrimitive.Viewport
              className="p-1"
              style={{
                // Prevent popper from forcing page height under scroll parents
                minWidth: "var(--radix-select-trigger-width)",
              }}
            >
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-xs px-3 py-2.5 font-serif text-[15px] font-medium outline-none",
                    "data-[highlighted]:bg-ink data-[highlighted]:text-paper",
                    "data-[state=checked]:bg-ink data-[state=checked]:text-paper",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                  )}
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}

/** Compact select for toolbars (sort, etc.) without stacked label */
export function SelectInline({
  value,
  onValueChange,
  options,
  prefix,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  prefix?: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {prefix}
      <Select
        value={value}
        onValueChange={onValueChange}
        options={options}
        aria-label={ariaLabel}
        triggerClassName="min-w-[11rem] sm:min-w-[13rem]"
      />
    </div>
  );
}
