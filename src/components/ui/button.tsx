"use client";

import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** md: 48px tall (default). sm: 40px for dense toolbars and menus. */
  size?: ButtonSize;
  href?: string;
  /** With `href`: render a plain anchor that downloads (e.g. a signed invoice PDF URL). */
  download?: boolean | string;
  children: ReactNode;
  className?: string;
  asChild?: boolean;
};

/**
 * Slide CTAs. Label: Manrope 600, sentence case, 15px (14px small).
 * Hover fill: brand gold #A9873C (danger uses red fill). Pill shaped.
 */
export function Button({
  variant = "primary",
  size = "md",
  href,
  download,
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
      "group/nsghost inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full py-2 text-label text-ink underline decoration-ink/25 decoration-1 underline-offset-[6px] outline-none transition-colors duration-300",
      "hover:text-brass-ink hover:decoration-brass focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    );
    if (href && download) {
      return (
        <a
          href={href}
          download={download === true ? "" : download}
          className={ghostClass}
          onClick={onClick as never}
        >
          {children}
        </a>
      );
    }
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

  const isDanger = variant === "danger";
  const small = size === "sm";

  // Named group so hover fill is not stolen by ancestor `.group`
  const shell = cn(
    "group/nsbtn relative inline-flex w-full max-w-full cursor-pointer select-none items-center justify-center overflow-hidden rounded-full border font-sans outline-none",
    small ? "h-10 min-h-10" : "h-12 min-h-12",
    "transition-[border-color,transform,box-shadow] duration-300 ease-out",
    "focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 sm:w-auto",
    "active:scale-[0.98]",
    variant === "primary" && "border-ink bg-ink text-paper hover:border-brass",
    variant === "secondary" && "border-ink bg-paper text-ink hover:border-brass",
    isDanger &&
      "border-[#c62828] bg-[#c62828] text-paper hover:border-[#b71c1c] focus-visible:ring-[#c62828]/40",
    className,
  );

  const fill = cn(
    "pointer-events-none absolute inset-0 z-0 translate-y-[101%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
    "group-hover/nsbtn:translate-y-0 group-disabled/nsbtn:translate-y-[101%]",
    "motion-reduce:transition-none motion-reduce:group-hover/nsbtn:translate-y-0",
    isDanger ? "bg-[#9a1b1b]" : "bg-brass-ink",
  );

  const label = cn(
    "relative z-10 inline-flex h-full w-full items-center justify-center gap-2 text-center font-semibold leading-tight",
    small ? "px-5 text-sm" : "px-7 text-[0.9375rem] sm:px-8",
    "text-current transition-colors duration-300 group-hover/nsbtn:text-paper",
    "motion-reduce:transition-none",
  );

  const content = (
    <>
      <span className={fill} aria-hidden />
      <span className={label}>{children}</span>
    </>
  );

  if (href && download) {
    return (
      <a
        href={href}
        download={download === true ? "" : download}
        className={cn(shell, disabled && "pointer-events-none opacity-50")}
        aria-disabled={disabled}
        onClick={onClick as never}
      >
        {content}
      </a>
    );
  }

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
