import { cn } from "@/lib/cn";
import { isRichHtml } from "@/lib/plain-text";

type Props = {
  /** Must already be sanitized on the server (mappers and store-data do this). */
  html: string;
  className?: string;
  as?: "div" | "section";
};

/** Client-safe rich text: renders pre-sanitized HTML without bundling sanitize-html. */
export function TrustedHtml({ html, className, as: Tag = "div" }: Props) {
  const source = (html || "").trim();
  if (!source) return null;
  if (!isRichHtml(source)) {
    return (
      <Tag className={className}>
        <p>{source}</p>
      </Tag>
    );
  }
  return <Tag className={cn("prose-ns", className)} dangerouslySetInnerHTML={{ __html: source }} />;
}
