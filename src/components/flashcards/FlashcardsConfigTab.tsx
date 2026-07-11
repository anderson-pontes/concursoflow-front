import { toast } from "sonner";

import {
  FlashCfgAccordion,
  FlashCfgFloatRow,
  FlashCfgIntRow,
} from "@/components/flashcards/FlashcardConfigForms";
import { ANKI_DEFAULTS, FLASH_CARD_SHADOW } from "@/lib/flashcards/constants";
import type { FlashcardConfig } from "@/lib/flashcards/types";

type Props = {
  loading: boolean;
  configDraft: Partial<FlashcardConfig>;
  configErrors: Partial<Record<keyof FlashcardConfig, string>>;
  configDirtyFields: (keyof FlashcardConfig)[];
  configDirtyCount: number;
  cfgSections: { limits: boolean; algorithm: boolean; penalties: boolean };
  saving: boolean;
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
  onToggleSection,
  onConfigChange,
  onRestoreDefaults,
  onSave,
}: Props) {
  if (loading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando configurações…</div>;
  }

  return (
    <div className="space-y-4 pb-4">
      <div
        className="rounded-[12px] border border-neutral-100 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
        style={{ boxShadow: FLASH_CARD_SHADOW }}
      >
        <h2 className="text-lg font-bold text-foreground dark:text-neutral-100">Repetição espaçada</h2>
        <p className="mt-1 text-sm text-muted-foreground dark:text-neutral-400">
          Ajuste limites diários e o algoritmo estilo Anki. Valores inválidos aparecem em vermelho.
        </p>
      </div>

      <FlashCfgAccordion
        title="📊 Limites diários"
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
        title="⚙️ Algoritmo de intervalos"
        open={cfgSections.algorithm}
        onToggle={() => onToggleSection("algorithm")}
      >
        <FlashCfgFloatRow
          label="Multiplicador Difícil"
          tooltip="Multiplica o intervalo atual ao marcar Difícil. Valores maiores = intervalos mais longos mesmo com dificuldade."
          value={configDraft.intervalo_dificil_mult ?? ANKI_DEFAULTS.intervalo_dificil_mult}
          onChange={(v) => onConfigChange({ intervalo_dificil_mult: v })}
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
          min={1}
          max={5}
          step={0.1}
          decimals={1}
          dirty={configDirtyFields.includes("facilidade_minima")}
          error={configErrors.facilidade_minima}
        />
      </FlashCfgAccordion>

      <FlashCfgAccordion
        title="🎯 Penalidades e bônus"
        open={cfgSections.penalties}
        onToggle={() => onToggleSection("penalties")}
      >
        <FlashCfgFloatRow
          label="Penalidade Difícil (EF)"
          tooltip="Quanto o fator de facilidade cai ao marcar Difícil."
          value={configDraft.penalidade_dificil ?? ANKI_DEFAULTS.penalidade_dificil}
          onChange={(v) => onConfigChange({ penalidade_dificil: v })}
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
          min={0}
          max={1}
          step={0.01}
          decimals={2}
          dirty={configDirtyFields.includes("bonus_facilidade_facil")}
          error={configErrors.bonus_facilidade_facil}
        />
      </FlashCfgAccordion>

      <div className="sticky bottom-0 z-30 mt-6 flex flex-col gap-3 rounded-t-xl border border-border bg-card px-4 py-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          {configDirtyCount > 0 ? (
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              ⚠️ {configDirtyCount} alteraç{configDirtyCount === 1 ? "ão" : "ões"} não salva
              {configDirtyCount === 1 ? "" : "s"}
            </span>
          ) : (
            <span className="text-muted-foreground dark:text-neutral-400">Nenhuma alteração pendente.</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRestoreDefaults}
            className="rounded-[10px] border-2 border-neutral-200 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Restaurar padrões
          </button>
          <button
            type="button"
            disabled={saving || Object.keys(configErrors).length > 0}
            onClick={() => {
              if (Object.keys(configErrors).length > 0) {
                toast.error("Corrija os campos em vermelho antes de salvar.");
                return;
              }
              onSave();
            }}
            className="rounded-[10px] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-50 bg-primary"
          >
            {saving ? "Salvando…" : "Salvar configurações"}
          </button>
        </div>
      </div>

      <div className="rounded-[12px] border border-neutral-100 bg-violet-50/50 p-4 text-xs text-muted-foreground dark:border-violet-900/30 dark:bg-violet-950/20 dark:text-neutral-400">
        <p className="font-semibold text-foreground dark:text-neutral-200">Lembretes rápidos</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li><span className="font-medium text-red-600">Errei</span> — reinicia o cartão.</li>
          <li><span className="font-medium text-orange-600">Difícil</span> — intervalo × mult. difícil.</li>
          <li><span className="font-medium text-blue-600">Bom</span> — SM-2 padrão.</li>
          <li><span className="font-medium text-emerald-600">Fácil</span> — intervalo com bônus.</li>
        </ul>
      </div>
    </div>
  );
}
