"use client";

import type { ComponentProps } from "react";
import { Button as BaseButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type BaseProps = ComponentProps<typeof BaseButton>;

export type AdminButtonSize = "sm" | "md";

type AdminButtonProps = Omit<BaseProps, "variant"> & {
  variant?: BaseProps["variant"] | "danger-outline";
  /** md = 44px (default, primary actions). sm = 40px (table rows, toolbars). */
  size?: AdminButtonSize;
};

/*
 * The storefront Button speaks in 12px wide-tracked capitals (a brand eyebrow).
 * In the console that reads small and shouty, so admin buttons use a 14px
 * semibold sentence-case label at 40/44px. Same API as the shared Button.
 */
const LABEL =
  "[&>span:last-child]:font-sans! [&>span:last-child]:text-[0.875rem]! [&>span:last-child]:font-semibold! [&>span:last-child]:normal-case! [&>span:last-child]:tracking-[0.005em]! [&>span:last-child]:leading-none!";

export function Button({
  size = "md",
  variant = "primary",
  className,
  ...props
}: AdminButtonProps) {
  if (variant === "ghost") {
    return (
      <BaseButton
        variant="ghost"
        className={cn(
          "min-h-10! rounded-md! px-3! py-2! font-sans! text-[0.875rem]! font-semibold! normal-case! tracking-normal! text-admin-accent! no-underline! hover:bg-admin-soft hover:text-admin-ink! hover:no-underline!",
          className,
        )}
        {...props}
      />
    );
  }

  const outlineDanger = variant === "danger-outline";

  return (
    <BaseButton
      variant={outlineDanger ? "secondary" : variant}
      className={cn(
        LABEL,
        size === "sm"
          ? "h-10! min-h-10! [&>span:last-child]:px-4!"
          : "h-11! min-h-11! [&>span:last-child]:px-5!",
        "px-0! active:scale-[0.985]!",
        variant === "danger" &&
          "border-admin-danger! bg-admin-danger! text-admin-paper! hover:border-admin-danger-hover! [&>span:first-child]:bg-admin-danger-hover!",
        outlineDanger &&
          "border-admin-danger/45! text-admin-danger! hover:border-admin-danger! [&>span:first-child]:bg-admin-danger!",
        className,
      )}
      {...props}
    />
  );
}

export default Button;
