import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
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
        label ? "flex flex-col gap-2 text-sm font-semibold text-taupe" : "contents"
      }
    >
      {label ? <span className="text-ink/80">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "min-h-12 w-full rounded-xs border border-[#d6cfbf] bg-paper px-4 py-3 font-sans text-base text-ink outline-none transition-colors placeholder:text-[#8a8f99] hover:border-ink/40 focus:border-brass focus:ring-2 focus:ring-brass/25",
          error &&
            "border-rosewood focus:border-rosewood focus:ring-rosewood/20",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm font-medium text-rosewood">{error}</span> : null}
    </label>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const inputId = id || props.name;
  return (
    <label
      className={
        label ? "flex flex-col gap-2 text-sm font-semibold text-taupe" : "contents"
      }
    >
      {label ? <span className="text-ink/80">{label}</span> : null}
      <textarea
        id={inputId}
        className={cn(
          "min-h-[7.5rem] w-full resize-y rounded-xs border border-[#d6cfbf] bg-paper px-4 py-3 font-sans text-base leading-relaxed text-ink outline-none transition-colors placeholder:text-[#8a8f99] hover:border-ink/40 focus:border-brass focus:ring-2 focus:ring-brass/25",
          error &&
            "border-rosewood focus:border-rosewood focus:ring-rosewood/20",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm font-medium text-rosewood">{error}</span> : null}
    </label>
  );
}
