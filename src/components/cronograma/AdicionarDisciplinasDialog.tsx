import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DisciplinaOption } from "@/lib/cronograma/types";

export function AdicionarDisciplinasDialog({ open, onClose, onSave, disciplinas, addedIds, isSaving }: { open: boolean; onClose: () => void; onSave: (ids: string[]) => void; disciplinas: DisciplinaOption[]; addedIds: string[]; isSaving: boolean }) {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  React.useEffect(() => { if (open) { setSearch(""); setSelected([]); } }, [open]);
  const rows = disciplinas.filter(d => d.nome.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  const available = rows.filter(d => !addedIds.includes(d.id));
  return <Dialog open={open} onOpenChange={v => !v && onClose()}><DialogContent className="max-h-[90dvh] sm:max-w-lg"><DialogHeader><DialogTitle>Adicionar disciplinas ao cronograma</DialogTitle><DialogDescription>Selecione uma ou várias disciplinas do concurso. Seu planejamento e histórico serão mantidos.</DialogDescription></DialogHeader>
    <Input aria-label="Buscar disciplinas" placeholder="Buscar disciplinas…" value={search} onChange={e => setSearch(e.target.value)} />
    <Button variant="outline" onClick={() => setSelected(s => [...new Set([...s, ...available.map(d => d.id)])])} disabled={!available.length}>Selecionar todas as disponíveis</Button>
    <div className="max-h-[45dvh] space-y-2 overflow-y-auto">{rows.map(d => { const added = addedIds.includes(d.id); return <label key={d.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"><input type="checkbox" disabled={added || isSaving} checked={added || selected.includes(d.id)} onChange={e => setSelected(s => e.target.checked ? [...s, d.id] : s.filter(id => id !== d.id))} /><span className="flex-1">{d.nome}</span>{added && <span className="text-xs text-muted-foreground">Já adicionada</span>}</label>; })}{!rows.length && <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma disciplina encontrada.</p>}</div>
    <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!selected.length || isSaving} onClick={() => onSave(selected)}>{isSaving ? "Adicionando…" : `Adicionar ${selected.length} ${selected.length === 1 ? "disciplina" : "disciplinas"}`}</Button></div>
  </DialogContent></Dialog>;
}
