import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { toRichHtml } from "./richTextUtils";
import "./RichText.css";
import "./RichTextEditor.css";

interface RichTextEditorProps {
  value: string | string[] | undefined;
  onChange: (html: string) => void;
  minHeight?: number;
}

const SIZES = [
  { label: "Mažas", value: "0.85rem" },
  { label: "Įprastas", value: "" },
  { label: "Didelis", value: "1.2rem" },
  { label: "Labai didelis", value: "1.5rem" },
];

// Rich text input for admin descriptions. Output is an HTML string; legacy
// plain text / string lists passed in are converted on load.
export default function RichTextEditor({ value, onChange, minHeight = 140 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      TextStyleKit,
    ],
    content: toRichHtml(value),
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
    editorProps: {
      attributes: { class: "rich-text-editor-content rich-text" },
    },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            link: e.isActive("link"),
            color: (e.getAttributes("textStyle").color as string | undefined) ?? "",
            size: (e.getAttributes("textStyle").fontSize as string | undefined) ?? "",
          }
        : null,
  });

  if (!editor || !state) return null;

  const btn = (active: boolean, label: string, title: string, onClick: () => void) => (
    <button
      type="button"
      title={title}
      className={`rte-btn${active ? " is-active" : ""}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {label}
    </button>
  );

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Nuoroda (palikite tuščią, kad pašalintumėte)", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div className="rte">
      <div className="rte-toolbar">
        {btn(state.bold, "B", "Paryškinti", () => editor.chain().focus().toggleBold().run())}
        {btn(state.italic, "I", "Pasvirasis", () => editor.chain().focus().toggleItalic().run())}
        {btn(state.underline, "U", "Pabraukti", () => editor.chain().focus().toggleUnderline().run())}
        <span className="rte-sep" />
        {btn(state.h2, "H2", "Didelė antraštė", () =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        )}
        {btn(state.h3, "H3", "Maža antraštė", () =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        )}
        <span className="rte-sep" />
        {btn(state.bullet, "• Sąrašas", "Sąrašas su ženklais", () =>
          editor.chain().focus().toggleBulletList().run()
        )}
        {btn(state.ordered, "1. Sąrašas", "Numeruotas sąrašas", () =>
          editor.chain().focus().toggleOrderedList().run()
        )}
        {btn(state.link, "Nuoroda", "Pridėti nuorodą", setLink)}
        <span className="rte-sep" />

        <label className="rte-control" title="Teksto spalva">
          Spalva
          <input
            type="color"
            value={state.color || "#173b3a"}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>
        <select
          className="rte-select"
          title="Teksto dydis"
          value={state.size}
          onChange={(e) => {
            const size = e.target.value;
            if (size) editor.chain().focus().setFontSize(size).run();
            else editor.chain().focus().unsetFontSize().run();
          }}
        >
          {SIZES.map((s) => (
            <option key={s.label} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {btn(false, "Išvalyti", "Išvalyti formatavimą", () =>
          editor.chain().focus().unsetAllMarks().clearNodes().run()
        )}
      </div>

      <div className="rte-body" style={{ minHeight }} onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
