import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function QuoteBlock({
  quote,
  attribution,
  className,
}: {
  quote: string;
  attribution: string;
  className?: string;
}) {
  return (
    <figure className={cn("flex flex-col gap-4", className)}>
      <div className="h-px w-12 bg-brass" aria-hidden />
      <blockquote className="text-display-md text-ink">“{quote}”</blockquote>
      <figcaption className="text-caption text-taupe">{attribution}</figcaption>
    </figure>
  );
}

export function FeaturePanel({
  title,
  body,
  action,
  muted = false,
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  /** Soft muted ivory band instead of paper white */
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xs border border-hairline p-7 sm:p-10 xl:p-14",
        muted ? "bg-canvas text-ink" : "bg-paper text-ink",
        className,
      )}
    >
      <h2 className="mb-5 text-display-md">{title}</h2>
      <p className="max-w-[40rem] text-body-lg text-taupe">{body}</p>
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}
