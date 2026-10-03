import type { EditalVersaoCatalogo } from "@/types/editaisCatalogo";

export type ClassificationDraft = {
  sphere: string;
  selectedAreas: string[];
  year: string;
  source: string;
  sourceRef: string;
  revision: number;
};

export function classificationDraft(version: EditalVersaoCatalogo): ClassificationDraft {
  const value = version.classificacao;
  return {
    sphere: value.esfera?.chave ?? "none",
    selectedAreas: value.areas.map((item) => item.chave),
    year: value.ano_edital?.toString() ?? "",
    source: value.fonte_tipo ?? "manual_validado",
    sourceRef: value.fonte_ref ?? "",
    revision: value.revision,
  };
}

export function classificationIssue(value: ClassificationDraft): string | null {
  if (value.year && (!Number.isInteger(Number(value.year)) || Number(value.year) < 1900 || Number(value.year) > new Date().getFullYear() + 2)) {
    return "Informe um ano válido para a classificação do catálogo.";
  }
  if ((value.sphere !== "none" || value.selectedAreas.length || value.year) && !value.sourceRef.trim()) {
    return "Informe a referência da fonte da classificação para o catálogo.";
  }
  return null;
}

export function classificationInput(value: ClassificationDraft) {
  return {
    esfera_chave: value.sphere === "none" ? null : value.sphere,
    area_chaves: value.selectedAreas,
    ano_edital: value.year ? Number(value.year) : null,
    fonte_tipo: value.sphere !== "none" || value.selectedAreas.length || value.year ? value.source : null,
    fonte_ref: value.sourceRef.trim() || null,
    expected_revision: value.revision,
  };
}
