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
  const source = (html || "").trim();
  if (!source) return null;

  // Plain text: React escapes it; sanitizing would turn "&" into a visible "&amp;".
  if (!isRichHtml(source)) {
    return (
      <Tag className={className}>
        <p>{source}</p>
      </Tag>
    );
  }

  let clean = "";
  try {
    clean = sanitizeRichHtml(source);
  } catch {
    clean = "";
  }
  if (!clean) return null;

  return (
    <Tag
      className={cn("prose-ns", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
