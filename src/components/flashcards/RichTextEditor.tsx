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
  List, ListOrdered, Undo, Redo, ImageIcon, Link2Off,
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
            outline: selected ? "3px solid #6366f1" : showControls ? "2px solid #a5b4fc" : "none",
            transition: "outline 0.15s",
          }}
        />

        {/* Delete button */}
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

        {/* Width controls */}
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
                  background: widthPct === p ? "#6366f1" : "rgba(255,255,255,0.15)",
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

/* ─── ResizableImage extension ────────────────────────────────────────────── */
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

/* ─── Toolbar button ──────────────────────────────────────────────────────── */
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
        "inline-flex h-7 w-7 items-center justify-center rounded text-sm transition-colors",
        active
          ? "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
          : "text-muted-foreground hover:bg-muted hover:text-card-foreground",
        disabled ? "opacity-40" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ─── Color palette ───────────────────────────────────────────────────────── */
const TEXT_COLORS = [
  "#000000", "#374151", "#dc2626", "#ea580c", "#ca8a04",
  "#16a34a", "#2563eb", "#7c3aed", "#db2777", "#ffffff",
];
const HIGHLIGHT_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#e9d5ff", "#fecaca",
  "#fed7aa", "#ccfbf1", "#fce7f3",
];

function ColorPicker({
  colors, onSelect, title,
}: { colors: string[]; onSelect: (c: string) => void; title: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        title={title}
        onMouseDown={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className="inline-flex h-7 w-7 items-center justify-center rounded text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-card-foreground"
      >
        <span className="text-xs font-bold">A</span>
      </button>
      {open ? (
        <div
          className="absolute left-0 top-8 z-50 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-2 shadow-lg"
          style={{ width: 140 }}
          onMouseLeave={() => setOpen(false)}
        >
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(c); setOpen(false); }}
              className="h-5 w-5 rounded border border-border/40 transition-transform hover:scale-110"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ─── Props ───────────────────────────────────────────────────────────────── */
type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

/* ─── Editor ──────────────────────────────────────────────────────────────── */
export function RichTextEditor({
  value, onChange, placeholder = "Digite o conteúdo...", minHeight = 140,
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

  /* sync value on external reset */
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
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5">
        {/* History */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Desfazer" disabled={!editor.can().undo()}>
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Refazer" disabled={!editor.can().redo()}>
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Text style */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito">
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico">
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Sublinhado">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Color */}
        <ColorPicker
          colors={TEXT_COLORS}
          title="Cor do texto"
          onSelect={(c) => editor.chain().focus().setColor(c).run()}
        />
        <ColorPicker
          colors={HIGHLIGHT_COLORS}
          title="Destaque (fundo)"
          onSelect={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
        />
        <ToolBtn
          onClick={() => editor.chain().focus().unsetColor().unsetHighlight().run()}
          title="Remover cor e destaque"
        >
          <Link2Off className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista">
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>

        <div className="mx-1 h-5 w-px bg-border" />

        {/* Image upload */}
        <ToolBtn
          onClick={() => fileInputRef.current?.click()}
          title="Inserir imagem (clique sobre ela para redimensionar ou excluir)"
          disabled={uploading}
        >
          <ImageIcon className="h-3.5 w-3.5" />
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
        {uploading ? (
          <span className="ml-1 text-[10px] text-muted-foreground">Enviando...</span>
        ) : null}
      </div>

      {/* Hint */}
      <div className="border-b border-border/40 bg-muted/10 px-3 py-1 text-[10px] text-muted-foreground/70">
        Passe o mouse sobre uma imagem para redimensioná-la (25% / 50% / 75% / 100%) ou excluí-la.
      </div>

      {/* Editor area */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none cursor-text px-4 py-3"
        style={{ minHeight, position: "relative" }}
        onClick={() => editor.commands.focus()}
      >
        {editor.isEmpty ? (
          <p
            className="select-none text-sm text-muted-foreground/60"
            style={{ position: "absolute", pointerEvents: "none" }}
          >
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror { outline: none; min-height: ${minHeight}px; }
        .ProseMirror p { margin: 0 0 0.5em; }
        .ProseMirror ul { list-style: disc; padding-left: 1.4em; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.4em; }
        .ProseMirror [data-node-view-wrapper] { display: block; margin: 6px 0; }
      `}</style>
    </div>
  );
}

