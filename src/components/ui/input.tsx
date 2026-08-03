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
        label ? "flex flex-col gap-2 text-sm font-medium text-taupe" : "contents"
      }
    >
      {label ? <span className="text-ink/80">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "min-h-11 w-full rounded-md border border-[#d8dbe2] bg-paper px-3.5 py-3 text-base text-ink outline-none transition-colors placeholder:text-[#9aa1ad] focus:border-brass focus:ring-2 focus:ring-brass/20",
          error &&
            "border-rosewood focus:border-rosewood focus:ring-rosewood/20",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-rosewood">{error}</span> : null}
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
        label ? "flex flex-col gap-2 text-sm font-medium text-taupe" : "contents"
      }
    >
      {label ? <span className="text-ink/80">{label}</span> : null}
      <textarea
        id={inputId}
        className={cn(
          "min-h-[6.5rem] w-full resize-y rounded-md border border-[#d8dbe2] bg-paper px-3.5 py-3 text-base text-ink outline-none transition-colors placeholder:text-[#9aa1ad] focus:border-brass focus:ring-2 focus:ring-brass/20",
          error &&
            "border-rosewood focus:border-rosewood focus:ring-rosewood/20",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-rosewood">{error}</span> : null}
    </label>
  );
}
