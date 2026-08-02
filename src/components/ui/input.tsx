import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <label
      className={
        label
          ? "flex flex-col gap-2 text-caption text-taupe"
          : "contents"
      }
    >
      {label ? <span>{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "min-h-11 w-full rounded-xs border border-hairline bg-paper px-3 py-3 text-body text-ink outline-none transition-colors placeholder:text-taupe focus:border-brass",
          error && "border-rosewood",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-rosewood">{error}</span> : null}
    </label>
  );
}
