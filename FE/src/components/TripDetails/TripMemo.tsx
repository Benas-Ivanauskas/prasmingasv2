import type { ReactNode } from "react";
import "./TripMemo.css";

type MemoBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string; footer: boolean }
  | { type: "divider" }
  | { type: "list"; items: { text: string; children: string[] }[] };

const DIVIDER_RE = /^\.{10,}$/;

// Admin-pasted plain text, not markdown — but it follows a consistent
// pattern (ALL-CAPS section titles, "• "/"- " bullets, a dotted-line
// divider before the signature block), so a small line-by-line classifier
// gets real structure out of it without needing a rich-text editor yet.
function parseMemo(raw: string): MemoBlock[] {
  const lines = raw.split("\n").map((l) => l.trim());
  const blocks: MemoBlock[] = [];
  let currentList: { text: string; children: string[] }[] | null = null;
  let afterDivider = false;

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      blocks.push({ type: "list", items: currentList });
    }
    currentList = null;
  };

  for (const line of lines) {
    if (!line) continue; // blank lines are just block separators, not rendered

    if (DIVIDER_RE.test(line)) {
      flushList();
      blocks.push({ type: "divider" });
      afterDivider = true;
      continue;
    }

    if (line.startsWith("• ")) {
      if (!currentList) currentList = [];
      currentList.push({ text: line.slice(2).trim(), children: [] });
      continue;
    }

    if (line.startsWith("- ") && currentList && currentList.length > 0) {
      currentList[currentList.length - 1].children.push(line.slice(2).trim());
      continue;
    }

    flushList();

    const letters = line.replace(/[^\p{L}]/gu, "");
    const isHeading = letters.length > 3 && letters === letters.toLocaleUpperCase("lt-LT");
    blocks.push(
      isHeading ? { type: "heading", text: line } : { type: "paragraph", text: line, footer: afterDivider }
    );
  }

  flushList();
  return blocks;
}

const URL_RE = /(https?:\/\/\S+)/g;

function linkify(text: string): ReactNode {
  const parts = text.split(URL_RE);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    URL_RE.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function TripMemo({ text }: { text: string }) {
  const blocks = parseMemo(text);

  return (
    <div className="trip-memo">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h3 key={i} className="trip-memo-heading">
              {block.text}
            </h3>
          );
        }
        if (block.type === "divider") {
          return <hr key={i} className="trip-memo-divider" />;
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="trip-memo-list">
              {block.items.map((item, j) => (
                <li key={j}>
                  {linkify(item.text)}
                  {item.children.length > 0 && (
                    <ul className="trip-memo-sublist">
                      {item.children.map((child, k) => (
                        <li key={k}>{linkify(child)}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className={block.footer ? "trip-memo-footer-line" : undefined}>
            {linkify(block.text)}
          </p>
        );
      })}
    </div>
  );
}
