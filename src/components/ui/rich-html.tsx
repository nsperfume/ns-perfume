import { cn } from "@/lib/cn";
import { isRichHtml, sanitizeRichHtml } from "@/lib/rich-text";

type Props = {
  html: string;
  className?: string;
  as?: "div" | "section";
};

/**
 * Sanitized rich-text render for storefront descriptive copy.
 */
export function RichHtml({ html, className, as: Tag = "div" }: Props) {
  let clean = "";
  try {
    clean = sanitizeRichHtml(html || "");
  } catch {
    clean = "";
  }
  if (!clean) return null;

  if (!isRichHtml(clean)) {
    return (
      <Tag className={className}>
        <p>{clean}</p>
      </Tag>
    );
  }

  return (
    <Tag
      className={cn("prose-ns", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
