import { Check, Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { TopicoOpt } from "@/components/estudos/registroEstudoSupport";

type Props = {
  topics: TopicoOpt[];
  selected: TopicoOpt[];
  search: string;
  newTopic: string;
  onSearchChange: (value: string) => void;
  onNewTopicChange: (value: string) => void;
  onToggle: (topic: TopicoOpt) => void;
  onCreate: () => void;
  onRemove: (id: string) => void;
};

export function RegistroTopicosSection({ topics, selected, search, newTopic, onSearchChange, onNewTopicChange, onToggle, onCreate, onRemove }: Props) {
  const selectedIds = new Set(selected.map((topic) => topic.id));
  return (
    <section className="rounded-xl border-[0.5px] border-slate-200/90 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">Tópicos estudados</p>
      <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-neutral-500">
        Em Teoria, aparecem primeiro os tópicos ainda não finalizados. Nas outras modalidades, todos os tópicos da disciplina ficam disponíveis.
      </p>
      <label className="relative mt-3 block">
        <span className="sr-only">Buscar tópico</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Buscar tópico..." className="pl-10" />
      </label>
      <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border-[0.5px] border-slate-200/90 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {topics.length === 0 ? <p className="px-3 py-4 text-sm text-slate-500">Nenhum tópico encontrado.</p> : (
          <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
            {topics.map((topic, index) => (
              <li key={topic.id} className="flex min-h-11 items-center gap-3 px-3 py-2">
                <Checkbox checked={selectedIds.has(topic.id)} onCheckedChange={() => onToggle(topic)} aria-label={`Selecionar tópico ${topic.nome}`} />
                <span className="w-4 text-xs text-slate-400">{index + 1}</span>
                <span className="text-sm text-slate-800 dark:text-neutral-200">{topic.nome}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">{selected.length} selecionado(s)</p>
        <div className="flex min-w-0 gap-2">
          <Input value={newTopic} onChange={(event) => onNewTopicChange(event.target.value)} placeholder="Novo tópico" className="min-w-0" />
          <Button type="button" variant="outline" onClick={onCreate} disabled={!newTopic.trim()}><Plus />Adicionar</Button>
        </div>
      </div>
      {selected.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((topic) => (
            <span key={topic.id} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-primary/20 bg-primary/10 pl-3 text-xs font-medium text-primary">
              <Check className="h-3 w-3" />{topic.nome}
              <button type="button" onClick={() => onRemove(topic.id)} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/15" aria-label={`Remover ${topic.nome}`}><X className="h-3.5 w-3.5" /></button>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
