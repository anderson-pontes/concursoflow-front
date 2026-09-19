import type { TopicoEditalItem } from "@/types/editalVerticalizado";

export type EditalActionId = "review" | "study" | "register" | "open_topic";
export type EditalActionState = "primary" | "available" | "disabled" | "hidden";
export type EditalActionReason =
  | "CONTEST_NOT_ACTIVE"
  | "INVALID_DURATION"
  | "REVIEW_NOT_ELIGIBLE";

export type EditalAction = {
  id: EditalActionId;
  state: EditalActionState;
  reason?: EditalActionReason;
};

type EditalActionFacts = {
  concursoStatus: string;
  item: Pick<TopicoEditalItem, "dominio" | "proxima_revisao_id" | "proxima_revisao_versao">;
  hasValidDuration: boolean;
};

export function mapEditalActions({ concursoStatus, item, hasValidDuration }: EditalActionFacts): EditalAction[] {
  const contestActive = concursoStatus === "ativo";
  const reviewEligible = Boolean(
    contestActive
      && item.proxima_revisao_id
      && item.proxima_revisao_versao
      && item.proxima_revisao_versao >= 1
      && item.dominio >= 5,
  );

  const review: EditalAction = !item.proxima_revisao_id
    ? { id: "review", state: "hidden", reason: "REVIEW_NOT_ELIGIBLE" }
    : !contestActive
      ? { id: "review", state: "disabled", reason: "CONTEST_NOT_ACTIVE" }
      : !reviewEligible
        ? { id: "review", state: "disabled", reason: "REVIEW_NOT_ELIGIBLE" }
        : !hasValidDuration
          ? { id: "review", state: "disabled", reason: "INVALID_DURATION" }
          : { id: "review", state: "primary" };

  const study: EditalAction = !contestActive
    ? { id: "study", state: "disabled", reason: "CONTEST_NOT_ACTIVE" }
    : !hasValidDuration
      ? { id: "study", state: "disabled", reason: "INVALID_DURATION" }
      : { id: "study", state: review.state === "primary" ? "available" : "primary" };

  const register: EditalAction = contestActive
    ? { id: "register", state: "available" }
    : { id: "register", state: "disabled", reason: "CONTEST_NOT_ACTIVE" };

  return [review, study, register, { id: "open_topic", state: "available" }];
}

export function findPrimaryEditalAction(actions: EditalAction[]): EditalAction | undefined {
  return actions.find((action) => action.state === "primary");
}
