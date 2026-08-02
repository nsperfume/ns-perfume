"use client";

import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  href?: string;
  children: ReactNode;
  className?: string;
  asChild?: boolean;
};

/**
 * Slide CTAs. Button label: Ubuntu. Hover fill: brand gold #A9873C.
 */
export function Button({
  variant = "primary",
  href,
  children,
  className,
  type = "button",
  disabled,
  asChild,
  onClick,
  ...props
}: ButtonProps) {
  if (variant === "ghost") {
    const ghostClass = cn(
      "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-transparent px-4 py-3 font-display text-eyebrow text-brass underline-offset-4 transition-colors duration-300 hover:text-brass hover:underline disabled:cursor-not-allowed disabled:opacity-50",
      className,
    );
    if (href) {
      return (
        <Link href={href} className={ghostClass} onClick={onClick as never}>
          {children}
        </Link>
      );
    }
    if (asChild) {
      return (
        <Slot className={ghostClass} onClick={onClick} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        type={type}
        disabled={disabled}
        className={ghostClass}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    );
  }

  const shell = cn(
    "group relative inline-flex h-12 min-h-11 w-full max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border font-display font-medium outline-none",
    "transition-[border-color] duration-300 ease-out",
    "focus-visible:ring-2 focus-visible:ring-brass/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 sm:w-auto",
    variant === "primary" && "border-ink bg-ink text-paper hover:border-brass",
    variant === "secondary" && "border-ink bg-paper text-ink hover:border-brass",
    className,
  );

  const fill = cn(
    "pointer-events-none absolute inset-0 z-0 translate-y-[101%] bg-brass transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
    "group-hover:translate-y-0 group-disabled:translate-y-[101%]",
    "motion-reduce:transition-none motion-reduce:group-hover:translate-y-0",
  );

  // text-current so shell/className color reaches the label (e.g. on-dark hero CTAs)
  const label = cn(
    "relative z-10 inline-flex h-full w-full items-center justify-center gap-2 px-7 font-display text-eyebrow tracking-[0.14em]",
    "text-current transition-colors duration-300 group-hover:text-paper",
    "motion-reduce:transition-none",
  );

  const content = (
    <>
      <span className={fill} aria-hidden />
      <span className={label}>{children}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(shell, disabled && "pointer-events-none opacity-50")}
        aria-disabled={disabled}
        onClick={onClick as never}
      >
        {content}
      </Link>
    );
  }

  if (asChild) {
    return (
      <Slot className={shell} onClick={onClick} {...props}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={shell}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}

export default Button;
