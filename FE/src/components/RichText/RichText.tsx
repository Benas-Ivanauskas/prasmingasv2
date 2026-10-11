import { sanitizeHtml, toRichHtml } from "./richTextUtils";
import "./RichText.css";

interface RichTextProps {
  value: string | string[] | undefined | null;
  className?: string;
}

// Renders admin-authored rich text (or legacy plain text / string lists).
export default function RichText({ value, className }: RichTextProps) {
  const html = sanitizeHtml(toRichHtml(value));
  if (!html) return null;
  return (
    <div
      className={`rich-text${className ? ` ${className}` : ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
