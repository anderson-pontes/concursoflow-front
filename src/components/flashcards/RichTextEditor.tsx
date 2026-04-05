import React from "react";
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Undo, Redo,
} from "lucide-react";

import { toast } from "sonner";
import { api } from "@/services/api";

/* ─── ResizableImage node view ────────────────────────────────────────────── */
function ResizableImageView({
  node, updateAttributes, deleteNode, selected,
}: NodeViewProps) {
  const [hovering, setHovering] = React.useState(false);
  const src = node.attrs.src as string;
  const widthPct: number = (node.attrs.widthPct as number | null) ?? 100;

  const showControls = hovering || selected;

  return (
    <NodeViewWrapper contentEditable={false} style={{ display: "block", position: "relative" }}>
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{ display: "inline-block", position: "relative", width: `${widthPct}%`, maxWidth: "100%" }}
      >
        <img
          src={src}
          alt=""
          style={{
            display: "block",
            width: "100%",
            maxWidth: "100%",
            borderRadius: 8,
            outline: selected ? "3px solid #6C3FC5" : showControls ? "2px solid #c4b5fd" : "none",
            transition: "outline 0.15s",
          }}
        />

        {showControls ? (
          <button
            type="button"
            title="Excluir imagem"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteNode(); }}
            style={{
              position: "absolute", top: 6, right: 6,
              width: 24, height: 24,
              background: "#ef4444", color: "#fff",
              border: "none", borderRadius: "50%",
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, lineHeight: 1,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              zIndex: 10,
            }}
          >
            ×
          </button>
        ) : null}

        {showControls ? (
          <div
            style={{
              position: "absolute", bottom: 6, left: "50%",
              transform: "translateX(-50%)",
              display: "flex", gap: 4,
              background: "rgba(0,0,0,0.72)",
              borderRadius: 8, padding: "4px 8px",
              zIndex: 10,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); updateAttributes({ widthPct: p }); }}
                style={{
                  background: widthPct === p ? "#6C3FC5" : "rgba(255,255,255,0.15)",
                  color: "#fff", border: "none", borderRadius: 5,
                  padding: "2px 7px", fontSize: 11, cursor: "pointer", fontWeight: 600,
                }}
              >
                {p}%
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      widthPct: {
        default: 100,
        parseHTML: (el) => {
          const style = el.getAttribute("data-width-pct");
          return style ? Number(style) : 100;
        },
        renderHTML: (attrs) => ({
          "data-width-pct": String(attrs.widthPct ?? 100),
          style: `width:${attrs.widthPct ?? 100}%; max-width:100%;`,
        }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

const TB = "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm transition-colors duration-200 ease-out";

function ToolBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={[
        TB,
        active
          ? "bg-[#F3F0FF] text-[#6C3FC5]"
          : "text-[#6B7280] hover:bg-[#F3F0FF] hover:text-[#6C3FC5]",
        disabled ? "opacity-40" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

const TEXT_COLORS = [
  "#000000", "#374151", "#dc2626", "#ea580c", "#ca8a04",
  "#16a34a", "#2563eb", "#7c3aed", "#db2777", "#ffffff",
];
const HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#e9d5ff", "#fecaca",
  "#fed7aa", "#ccfbf1", "#fce7f3",
];

function ColorPicker({
  colors, onSelect, title, variant = "text",
}: { colors: string[]; onSelect: (c: string) => void; title: string; variant?: "text" | "highlight" }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        title={title}
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className={`${TB} text-[#6B7280] hover:bg-[#F3F0FF] hover:text-[#6C3FC5]`}
      >
        {variant === "highlight" ? (
          <span className="text-xs font-bold leading-none">
            <span className="rounded-sm bg-yellow-300 px-0.5 text-[10px] text-neutral-900">A</span>
          </span>
        ) : (
          <span className="text-xs font-bold underline decoration-neutral-800 decoration-2 underline-offset-2">
            A
          </span>
        )}
      </button>
      {open ? (
        <div
          className="absolute left-0 top-9 z-50 flex flex-wrap gap-1 rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-lg"
          style={{ width: 140 }}
          onMouseLeave={() => setOpen(false)}
        >
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(c); setOpen(false); }}
              className="h-5 w-5 rounded border border-neutral-200/60 transition-transform hover:scale-110"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const IMG_TOOLTIP =
  "Inserir imagem · Depois, passe o mouse para redimensionar (25–100%) ou excluir";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Digite o conteúdo...",
  minHeight = 220,
  maxHeight = 380,
}: RichTextEditorProps) {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      ResizableImage.configure({ allowBase64: true }),
    ],
    content: value,
    onUpdate({ editor: e }) {
      onChange(e.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/flashcards/upload-imagem", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url: string = res.data.url;
      editor?.chain().focus().setImage({ src: url }).run();
    } catch {
      toast.error("Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  if (!editor) return null;

  return (
    <div
      className="overflow-hidden rounded-[10px] border-[1.5px] border-[#E5E7EB] bg-white transition-[border-color,box-shadow] duration-200 ease-out focus-within:border-[#6C3FC5] focus-within:shadow-[0_0_0_3px_#EDE9FE]"
      style={{ boxSizing: "border-box" }}
    >
      <div
        className="flex flex-nowrap items-center gap-0.5 overflow-x-auto border-b border-[#E5E7EB] bg-[#FAFAFA] px-1.5 py-1.5"
        style={{ scrollbarWidth: "thin" }}
      >
          <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Desfazer · Ctrl+Z" disabled={!editor.can().undo()}>
            <Undo className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Refazer · Ctrl+Shift+Z" disabled={!editor.can().redo()}>
            <Redo className="h-4 w-4" />
          </ToolBtn>

          <div className="mx-1 h-6 w-px shrink-0 bg-[#E5E7EB]" aria-hidden />

          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito · Ctrl+B">
            <Bold className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico · Ctrl+I">
            <Italic className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Sublinhado · Ctrl+U">
            <UnderlineIcon className="h-4 w-4" />
          </ToolBtn>
          <ColorPicker
            colors={TEXT_COLORS}
            title="Cor do texto"
            onSelect={(c) => editor.chain().focus().setColor(c).run()}
            variant="text"
          />
          <ColorPicker
            colors={HIGHLIGHT_COLORS}
            title="Cor de destaque (marca-texto)"
            onSelect={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
            variant="highlight"
          />

          <div className="mx-1 h-6 w-px shrink-0 bg-[#E5E7EB]" aria-hidden />

          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista com marcadores">
            <List className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">
            <ListOrdered className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => fileInputRef.current?.click()}
            title={IMG_TOOLTIP}
            disabled={uploading}
          >
            <span className="text-lg leading-none" aria-hidden>🖼</span>
          </ToolBtn>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageUpload(file);
              e.target.value = "";
            }}
          />
        </div>

        <div
          className="cursor-text px-4 py-4"
          style={{
            maxHeight: maxHeight,
            minHeight: minHeight,
            overflowY: "auto",
            boxSizing: "border-box",
          }}
          onClick={() => editor.commands.focus()}
        >
          <div
            className="flashcard-rtc-content prose prose-sm relative max-w-none text-[15px] leading-[1.7] text-[#1A1A2E]"
            style={{ position: "relative" }}
          >
            {editor.isEmpty ? (
              <p
                className="pointer-events-none select-none text-[15px] text-[#9CA3AF]"
                style={{ position: "absolute", left: 0, top: 0, right: 0 }}
              >
                {placeholder}
              </p>
            ) : null}
            <EditorContent editor={editor} />
          </div>
        </div>
      <style>{`
        .ProseMirror { outline: none; min-height: ${minHeight}px; font-size: 15px; line-height: 1.7; }
        .ProseMirror p { margin: 0 0 0.5em; }
        .ProseMirror ul { list-style: disc; padding-left: 1.4em; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.4em; }
        .ProseMirror [data-node-view-wrapper] { display: block; margin: 6px 0; }
      `}</style>
    </div>
  );
}
