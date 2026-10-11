import DOMPurify from "dompurify";

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Descriptions used to be plain text (or, for inclusions/exclusions, a list
// of strings). Anything that isn't already HTML is converted so old data and
// new editor output both flow through the same renderer/editor.
export function toRichHtml(value: string | string[] | undefined | null): string {
  if (!value) return "";

  if (Array.isArray(value)) {
    const items = value.map((v) => v.trim()).filter(Boolean);
    return items.length ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>` : "";
  }

  if (/^\s*</.test(value)) return value;

  return value
    .split(/\n{2,}|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

export function isHtml(value: string | undefined | null): boolean {
  return Boolean(value && /^\s*</.test(value));
}

let hooked = false;

// Admin-authored HTML is still sanitized before it reaches the public site:
// formatting (bold, colors, sizes, lists, links) survives, scripts and event
// handlers do not. Links always open in a new tab safely.
export function sanitizeHtml(html: string): string {
  if (!hooked) {
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (node.tagName === "A") {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    });
    hooked = true;
  }
  return DOMPurify.sanitize(html, { ADD_ATTR: ["target"] });
}

// Plain-text version for places that can't show markup (cards, SEO, etc.).
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
