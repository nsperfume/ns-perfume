"use client";

import { useEffect, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { AdminFieldLabel } from "@/components/admin/form-section";
import { cn } from "@/lib/cn";
import { sanitizeRichHtml } from "@/lib/rich-text";

type Props = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  tip?: string;
  error?: string;
  required?: boolean;
  className?: string;
  /** Tailwind min-height for the editing surface */
  minHeightClass?: string;
};

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded transition-colors",
        active
          ? "bg-admin-ink text-admin-paper"
          : "text-admin-muted hover:bg-admin-soft hover:text-admin-ink",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function IconBold() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 5h6a3.5 3.5 0 0 1 0 7H7V5Zm0 7h7a3.5 3.5 0 0 1 0 7H7v-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconItalic() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 5h-5M15 19H10M12.5 5 9.5 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconUnderline() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 5v6a5 5 0 0 0 10 0V5M6 19h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconH2() {
  return (
    <span className="font-display text-[11px] font-bold leading-none">H2</span>
  );
}
function IconH3() {
  return (
    <span className="font-display text-[10px] font-bold leading-none">H3</span>
  );
}
function IconList() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconOrdered() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 6h10M11 12h10M11 18h10M4 6h1v4M4 10h2M5 14l-1 4h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconQuote() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 17a4 4 0 0 1-4-4V8h5v5H7a2 2 0 0 0 2 2v2Zm10 0a4 4 0 0 1-4-4V8h5v5h-2a2 2 0 0 0 2 2v2Z"
        fill="currentColor"
      />
    </svg>
  );
}
function IconLink() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 14a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L11 5.93M14 10a5 5 0 0 0-7.07 0L4.81 12.12a5 5 0 0 0 7.07 7.07L13 18.07"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconSeparator() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12h16M8 7v2M16 7v2M8 15v2M16 15v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconClear() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * TipTap rich text editor for admin descriptive copy.
 */
export function AdminRichTextEditor({
  label,
  value,
  onChange,
  placeholder = "Write clearly. Keep paragraphs short.",
  tip,
  error,
  required,
  className,
  minHeightClass = "min-h-52",
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        // TipTap v3 StarterKit already ships link + underline.
        // Disable them here so the dedicated extensions below are not duplicated.
        link: false,
        underline: false,
      }),
      Underline,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn(
          "admin-rich-editor prose-ns max-w-none px-3.5 py-3 text-base text-admin-ink outline-none",
          minHeightClass,
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(sanitizeRichHtml(ed.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (sanitizeRichHtml(current) !== sanitizeRichHtml(next)) {
      editor.commands.setContent(next || "", { emitUpdate: false });
    }
  }, [editor, value]);

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmed })
      .run();
  }

  return (
    <div className={cn("block", className)}>
      <AdminFieldLabel tip={tip} required={required}>
        {label}
      </AdminFieldLabel>
      <div
        className={cn(
          "admin-rte-shell overflow-hidden rounded-md border border-admin-input-border bg-admin-soft-2",
          "focus-within:border-brass focus-within:ring-2 focus-within:ring-brass/20",
          error && "border-rosewood focus-within:ring-rosewood/20",
        )}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-admin-line px-1.5 py-1.5">
          <ToolbarButton
            label="Bold"
            active={editor?.isActive("bold")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <IconBold />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editor?.isActive("italic")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <IconItalic />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={editor?.isActive("underline")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <IconUnderline />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-admin-line" aria-hidden />
          <ToolbarButton
            label="Heading 2"
            active={editor?.isActive("heading", { level: 2 })}
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <IconH2 />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3"
            active={editor?.isActive("heading", { level: 3 })}
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <IconH3 />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-admin-line" aria-hidden />
          <ToolbarButton
            label="Bullet list"
            active={editor?.isActive("bulletList")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <IconList />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            active={editor?.isActive("orderedList")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <IconOrdered />
          </ToolbarButton>
          <ToolbarButton
            label="Quote"
            active={editor?.isActive("blockquote")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <IconQuote />
          </ToolbarButton>
          <ToolbarButton
            label="Separator"
            active={editor?.isActive("horizontalRule")}
            disabled={!editor}
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          >
            <IconSeparator />
          </ToolbarButton>
          <span className="mx-1 h-5 w-px bg-admin-line" aria-hidden />
          <ToolbarButton
            label="Link"
            active={editor?.isActive("link")}
            disabled={!editor}
            onClick={setLink}
          >
            <IconLink />
          </ToolbarButton>
          <ToolbarButton
            label="Clear formatting"
            disabled={!editor}
            onClick={() =>
              editor?.chain().focus().unsetAllMarks().clearNodes().run()
            }
          >
            <IconClear />
          </ToolbarButton>
        </div>
        <EditorContent editor={editor} className={cn("block", minHeightClass)} />
      </div>
      {error ? (
        <p className="mt-1.5 text-sm text-rosewood">{error}</p>
      ) : null}
    </div>
  );
}
