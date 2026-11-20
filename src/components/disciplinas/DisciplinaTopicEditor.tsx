import { memo, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseTopicosLinhas } from "@/components/disciplinas/TopicosModal";

const PAGE_SIZE = 30;

export function duplicateTopicos(items: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return duplicates;
}

export const DisciplinaTopicEditor = memo(function DisciplinaTopicEditor({
  value, onChange, disabled, onEditingChange,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  onEditingChange: (editing: boolean) => void;
}) {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ index: number; text: string } | null>(null);
  const stopEditing = () => { setEditing(null); onEditingChange(false); };
  const items = useMemo(() => parseTopicosLinhas(value), [value]);
  const duplicates = useMemo(() => duplicateTopicos(items), [items]);
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * PAGE_SIZE;

  const changeItem = (index: number, nextIndex?: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    if (nextIndex !== undefined) {
      next.splice(nextIndex, 0, item);
      setPage(Math.floor(nextIndex / PAGE_SIZE) + 1);
    }
    onChange(next.join("\n"));
  };

  return <>
    <section className="space-y-3 rounded-xl border bg-card p-4 sm:p-6">
      <label htmlFor="disc-topicos" className="block font-semibold">Novos tópicos</label>
      <p id="disc-topicos-help" className="text-sm text-muted-foreground">Digite ou cole um tópico por linha. Linhas vazias serão ignoradas.</p>
      <Textarea id="disc-topicos" aria-describedby="disc-topicos-help" className="min-h-56" value={value} disabled={disabled || editing !== null}
        onChange={(event) => { setPage(1); onChange(event.target.value); }} placeholder={"1. Conceitos fundamentais\n2. Introdução ao assunto"} />
    </section>
    <section aria-labelledby="disc-preview-title" className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="disc-preview-title" className="font-semibold">Pré-visualização</h2>
        <span className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? "tópico" : "tópicos"}</span>
      </div>
      {duplicates.size > 0 && <p role="alert" className="text-sm text-destructive">Edite ou remova os tópicos repetidos antes de salvar.</p>}
      {items.length === 0 ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Os tópicos digitados acima aparecem aqui na ordem em que serão cadastrados.</p> :
        <ol className="divide-y rounded-lg border" start={start + 1}>
          {items.slice(start, start + PAGE_SIZE).map((item, offset) => {
            const index = start + offset;
            return <li key={index} className="flex min-w-0 flex-col gap-2 p-3 sm:flex-row sm:items-start">
              <span className="text-sm tabular-nums text-muted-foreground">{index + 1}.</span>
              {editing?.index === index ? <Input aria-label={`Editar tópico ${index + 1}`} autoFocus value={editing.text}
                onChange={(event) => setEditing({ index, text: event.target.value })} /> :
                <p className="min-w-0 flex-1 text-sm [overflow-wrap:anywhere]">{item}{duplicates.has(item.toLowerCase()) && <span className="ml-2 text-xs font-medium text-destructive">Repetido</span>}</p>}
              <div className="flex shrink-0 flex-wrap items-center gap-1">
                {editing?.index === index ? <>
                  <Button type="button" size="sm" variant="outline" onClick={stopEditing}>Cancelar</Button>
                  <Button type="button" size="sm" disabled={!editing.text.trim()} onClick={() => {
                    onChange(items.map((text, position) => position === index ? editing.text.trim() : text).join("\n"));
                    stopEditing();
                  }}>Aplicar</Button>
                </> : <>
                  <Button type="button" variant="ghost" size="sm" disabled={disabled || Boolean(editing)} onClick={() => {
                    setEditing({ index, text: item });
                    onEditingChange(true);
                  }}>Editar</Button>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Subir tópico ${index + 1}`} disabled={disabled || Boolean(editing) || index === 0} onClick={() => changeItem(index, index - 1)}><ArrowUp /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Descer tópico ${index + 1}`} disabled={disabled || Boolean(editing) || index === items.length - 1} onClick={() => changeItem(index, index + 1)}><ArrowDown /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Remover tópico ${index + 1}`} disabled={disabled || Boolean(editing)} onClick={() => changeItem(index)}><Trash2 /></Button>
                </>}
              </div>
            </li>;
          })}
        </ol>}
      {pages > 1 && <nav aria-label="Páginas da pré-visualização" className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" size="sm" variant="outline" disabled={currentPage === 1 || Boolean(editing)} onClick={() => setPage(currentPage - 1)}>Anterior</Button>
        <span className="text-sm text-muted-foreground">{currentPage} de {pages}</span>
        <Button type="button" size="sm" variant="outline" disabled={currentPage === pages || Boolean(editing)} onClick={() => setPage(currentPage + 1)}>Próxima</Button>
      </nav>}
    </section>
  </>;
});
