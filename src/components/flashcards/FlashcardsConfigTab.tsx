import { toast } from "sonner";
import { SlidersHorizontal, TimerReset, Gauge, Info, AlertCircle, CheckCircle2, Circle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  FlashCfgAccordion,
  FlashCfgFloatRow,
  FlashCfgIntRow,
} from "@/components/flashcards/FlashcardConfigForms";
import { ANKI_DEFAULTS } from "@/lib/flashcards/constants";
import type { FlashcardConfig } from "@/lib/flashcards/types";

type Props = {
  loading: boolean;
  configDraft: Partial<FlashcardConfig>;
  configErrors: Partial<Record<keyof FlashcardConfig, string>>;
  configDirtyFields: (keyof FlashcardConfig)[];
  configDirtyCount: number;
  cfgSections: { limits: boolean; algorithm: boolean; penalties: boolean };
  saving: boolean;
  saveStatus?: "idle" | "pending" | "success" | "error";
  onToggleSection: (section: "limits" | "algorithm" | "penalties") => void;
  onConfigChange: (patch: Partial<FlashcardConfig>) => void;
  onRestoreDefaults: () => void;
  onSave: () => void;
};

export function FlashcardsConfigTab({
  loading,
  configDraft,
  configErrors,
  configDirtyFields,
  configDirtyCount,
  cfgSections,
  saving,
  saveStatus = "idle",
  onToggleSection,
  onConfigChange,
  onRestoreDefaults,
  onSave,
}: Props) {
  if (loading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando configurações…</div>;
  }

  return (
    <fieldset disabled={saving} className="flash-settings w-full min-w-0 space-y-3 pb-4">
      <div
        className="rounded-xl border border-border bg-card p-4"
      >
        <h2 className="text-lg font-bold text-foreground dark:text-neutral-100">Repetição espaçada</h2>
        <p className="mt-1 text-sm text-muted-foreground dark:text-neutral-400">
          Ajuste limites diários e o algoritmo estilo Anki. Valores inválidos aparecem em vermelho.
        </p>
      </div>

      <FlashCfgAccordion
        title="Limites diários"
        icon={SlidersHorizontal}
        columns
        open={cfgSections.limits}
        onToggle={() => onToggleSection("limits")}
      >
        <FlashCfgIntRow
          label="Novos cartões por dia"
          tooltip="Teto de cartões novos introduzidos por dia. Afeta quantos você vê na fila."
          value={configDraft.novos_por_dia ?? ANKI_DEFAULTS.novos_por_dia}
          onChange={(v) => onConfigChange({ novos_por_dia: v })}
          min={1}
          max={100}
          dirty={configDirtyFields.includes("novos_por_dia")}
          error={configErrors.novos_por_dia}
          defaultVal={ANKI_DEFAULTS.novos_por_dia}
          onChipReset={() => onConfigChange({ novos_por_dia: ANKI_DEFAULTS.novos_por_dia })}
        />
        <FlashCfgIntRow
          label="Máximo de revisões por dia"
          tooltip="Limite total de revisões (novos + pendentes) por dia. Evita sobrecarga. Use o número à direita para valores acima do fim do slider (até 9999)."
          value={configDraft.max_revisoes_dia ?? ANKI_DEFAULTS.max_revisoes_dia}
          onChange={(v) => onConfigChange({ max_revisoes_dia: v })}
          min={1}
          max={9999}
          sliderMax={300}
          dirty={configDirtyFields.includes("max_revisoes_dia")}
          error={configErrors.max_revisoes_dia}
          defaultVal={ANKI_DEFAULTS.max_revisoes_dia}
          onChipReset={() => onConfigChange({ max_revisoes_dia: ANKI_DEFAULTS.max_revisoes_dia })}
        />
      </FlashCfgAccordion>

      <FlashCfgAccordion
        title="Algoritmo de intervalos"
        icon={TimerReset}
        columns
        open={cfgSections.algorithm}
        onToggle={() => onToggleSection("algorithm")}
      >
        <FlashCfgFloatRow
          label="Multiplicador Difícil"
          tooltip="Multiplica o intervalo atual ao marcar Difícil. Valores maiores = intervalos mais longos mesmo com dificuldade."
          value={configDraft.intervalo_dificil_mult ?? ANKI_DEFAULTS.intervalo_dificil_mult}
          onChange={(v) => onConfigChange({ intervalo_dificil_mult: v })}
          defaultVal={ANKI_DEFAULTS.intervalo_dificil_mult}
          onChipReset={() => onConfigChange({ intervalo_dificil_mult: ANKI_DEFAULTS.intervalo_dificil_mult })}
          min={1}
          max={5}
          step={0.05}
          decimals={2}
          dirty={configDirtyFields.includes("intervalo_dificil_mult")}
          error={configErrors.intervalo_dificil_mult}
        />
        <FlashCfgFloatRow
          label="Bônus Fácil"
          tooltip="Fator extra no intervalo ao marcar Fácil. Aumenta o espaçamento de cartões que você domina."
          value={configDraft.bonus_facil_mult ?? ANKI_DEFAULTS.bonus_facil_mult}
          onChange={(v) => onConfigChange({ bonus_facil_mult: v })}
          defaultVal={ANKI_DEFAULTS.bonus_facil_mult}
          onChipReset={() => onConfigChange({ bonus_facil_mult: ANKI_DEFAULTS.bonus_facil_mult })}
          min={1}
          max={5}
          step={0.05}
          decimals={2}
          dirty={configDirtyFields.includes("bonus_facil_mult")}
          error={configErrors.bonus_facil_mult}
        />
        <FlashCfgFloatRow
          label="Facilidade inicial (EF)"
          tooltip="Fator de facilidade inicial dos cartões novos. Anki usa 2,5."
          value={configDraft.facilidade_inicial ?? ANKI_DEFAULTS.facilidade_inicial}
          onChange={(v) => onConfigChange({ facilidade_inicial: v })}
          defaultVal={ANKI_DEFAULTS.facilidade_inicial}
          onChipReset={() => onConfigChange({ facilidade_inicial: ANKI_DEFAULTS.facilidade_inicial })}
          min={1.3}
          max={9.9}
          step={0.1}
          decimals={1}
          dirty={configDirtyFields.includes("facilidade_inicial")}
          error={configErrors.facilidade_inicial}
        />
        <FlashCfgFloatRow
          label="Facilidade mínima"
          tooltip="Piso do EF: evita que intervalos fiquem ridiculamente curtos após muitas dificuldades."
          value={configDraft.facilidade_minima ?? ANKI_DEFAULTS.facilidade_minima}
          onChange={(v) => onConfigChange({ facilidade_minima: v })}
          defaultVal={ANKI_DEFAULTS.facilidade_minima}
          onChipReset={() => onConfigChange({ facilidade_minima: ANKI_DEFAULTS.facilidade_minima })}
          min={1}
          max={5}
          step={0.1}
          decimals={1}
          dirty={configDirtyFields.includes("facilidade_minima")}
          error={configErrors.facilidade_minima}
        />
      </FlashCfgAccordion>

      <FlashCfgAccordion
        title="Penalidades e bônus"
        icon={Gauge}
        columns
        open={cfgSections.penalties}
        onToggle={() => onToggleSection("penalties")}
      >
        <FlashCfgFloatRow
          label="Penalidade Difícil (EF)"
          tooltip="Quanto o fator de facilidade cai ao marcar Difícil."
          value={configDraft.penalidade_dificil ?? ANKI_DEFAULTS.penalidade_dificil}
          onChange={(v) => onConfigChange({ penalidade_dificil: v })}
          defaultVal={ANKI_DEFAULTS.penalidade_dificil}
          onChipReset={() => onConfigChange({ penalidade_dificil: ANKI_DEFAULTS.penalidade_dificil })}
          min={0}
          max={1}
          step={0.01}
          decimals={2}
          dirty={configDirtyFields.includes("penalidade_dificil")}
          error={configErrors.penalidade_dificil}
        />
        <FlashCfgFloatRow
          label="Bônus Fácil (EF)"
          tooltip="Quanto o EF sobe ao marcar Fácil, recompensando cartões fáceis."
          value={configDraft.bonus_facilidade_facil ?? ANKI_DEFAULTS.bonus_facilidade_facil}
          onChange={(v) => onConfigChange({ bonus_facilidade_facil: v })}
          defaultVal={ANKI_DEFAULTS.bonus_facilidade_facil}
          onChipReset={() => onConfigChange({ bonus_facilidade_facil: ANKI_DEFAULTS.bonus_facilidade_facil })}
          min={0}
          max={1}
          step={0.01}
          decimals={2}
          dirty={configDirtyFields.includes("bonus_facilidade_facil")}
          error={configErrors.bonus_facilidade_facil}
        />
      </FlashCfgAccordion>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="status" aria-live="polite" className="min-w-0 text-sm">
          {Object.keys(configErrors).length > 0 ? <span className="flex items-center gap-2 text-destructive"><XCircle className="size-4 shrink-0" aria-hidden />Corrija os valores indicados antes de salvar.</span>
            : saving ? <span className="text-muted-foreground">Salvando configurações…</span>
            : saveStatus === "error" ? <span className="flex items-center gap-2 text-destructive"><AlertCircle className="size-4 shrink-0" aria-hidden />Não foi possível salvar. Suas alterações foram mantidas. Tente novamente.</span>
            : configDirtyCount > 0 ? <span className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"><AlertCircle className="size-4 shrink-0" aria-hidden />Existem alterações não salvas.</span>
            : saveStatus === "success" ? <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-4 shrink-0" aria-hidden />Configurações salvas. Nenhuma alteração pendente.</span>
            : <span className="text-muted-foreground">Nenhuma alteração pendente.</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onRestoreDefaults}
            variant="outline" className="min-h-11"
          >
            Restaurar padrões
          </Button>
          <Button
            type="button"
            disabled={saving || configDirtyCount === 0 || Object.keys(configErrors).length > 0}
            onClick={() => {
              if (Object.keys(configErrors).length > 0) {
                toast.error("Corrija os campos em vermelho antes de salvar.");
                return;
              }
              onSave();
            }}
            className="min-h-11"
          >
            {saving ? "Salvando…" : "Salvar configurações"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground"><Info className="size-4 shrink-0 text-primary" aria-hidden />Como funciona a repetição espaçada</p>
        <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <li className="flex items-start gap-2"><Circle className="mt-0.5 size-3 shrink-0 fill-red-500 text-red-500" aria-hidden /><span><strong className="text-foreground">Errei</strong> — reinicia o cartão.</span></li>
          <li className="flex items-start gap-2"><Circle className="mt-0.5 size-3 shrink-0 fill-amber-500 text-amber-500" aria-hidden /><span><strong className="text-foreground">Difícil</strong> — aplica o multiplicador de dificuldade ao intervalo.</span></li>
          <li className="flex items-start gap-2"><Circle className="mt-0.5 size-3 shrink-0 fill-blue-500 text-blue-500" aria-hidden /><span><strong className="text-foreground">Bom</strong> — segue o comportamento padrão do algoritmo.</span></li>
          <li className="flex items-start gap-2"><Circle className="mt-0.5 size-3 shrink-0 fill-emerald-500 text-emerald-500" aria-hidden /><span><strong className="text-foreground">Fácil</strong> — aplica o bônus ao intervalo.</span></li>
        </ul>
      </div>
    </fieldset>
  );
}
