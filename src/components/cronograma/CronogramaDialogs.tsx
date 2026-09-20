import { BlocoFormModal } from "@/components/cronograma/BlocoFormModal";
import { CronogramaAgendaHojeDialog } from "@/components/cronograma/CronogramaAgendaHojeDialog";
import {
  CronogramaModoSelectorModal,
  type CronogramaModo,
} from "@/components/cronograma/CronogramaModoSelectorModal";
import {
  CronogramaRemoverDialog,
  type RemoverScope,
} from "@/components/cronograma/CronogramaRemoverDialog";
import {
  CronogramaSimplificadoEditModal,
  type SimplificadoEditPayload,
} from "@/components/cronograma/CronogramaSimplificadoEditModal";
import { CronogramaSimplificadoModal } from "@/components/cronograma/CronogramaSimplificadoModal";
import { GerarCronogramaAutoModal } from "@/components/cronograma/GerarCronogramaAutoModal";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import {
  blocoTopicoIds,
  type Bloco,
  type DisciplinaOption,
  type FormState,
  type SimplificadoFormState,
} from "@/lib/cronograma/types";

export interface CronogramaRemoveTarget {
  bloco: Bloco;
  dataAlvo: string;
  diaLabel: string;
}

interface CronogramaDialogsProps {
  blocos: Bloco[];
  disciplinas: DisciplinaOption[];
  hasConcursoAtivo: boolean;
  disciplinaNome: (id: string) => string;
  agendaHojeOpen: boolean;
  modoSelectorOpen: boolean;
  createOpen: boolean;
  autoOpen: boolean;
  simplificadaOpen: boolean;
  editBloco: Bloco | null;
  removeTarget: CronogramaRemoveTarget | null;
  openRegistro: boolean;
  createPending: boolean;
  updatePending: boolean;
  simplifiedPending: boolean;
  removePending: boolean;
  onCloseAgenda: () => void;
  onCreateCronograma: () => void;
  onCloseModoSelector: () => void;
  onModoSelect: (modo: CronogramaModo) => void;
  onCloseCreate: () => void;
  onCreate: (form: FormState) => void;
  onCloseEdit: () => void;
  onUpdate: (id: string, payload: FormState | SimplificadoEditPayload) => void;
  onCloseAuto: () => void;
  onAutoSaved: () => void;
  onCloseSimplificada: () => void;
  onCreateSimplificada: (form: SimplificadoFormState) => void;
  onCloseRemove: () => void;
  onRemove: (id: string, scope: RemoverScope, data: string) => void;
  onCloseRegistro: () => void;
}

function editTitleForModo(modo: string | undefined): string {
  if (modo === "automatica") return "Editar horário (Automática)";
  if (modo === "simplificada") return "Editar horário (Simplificada)";
  return "Editar horário (Analítica)";
}

export function CronogramaDialogs({
  blocos,
  disciplinas,
  hasConcursoAtivo,
  disciplinaNome,
  agendaHojeOpen,
  modoSelectorOpen,
  createOpen,
  autoOpen,
  simplificadaOpen,
  editBloco,
  removeTarget,
  openRegistro,
  createPending,
  updatePending,
  simplifiedPending,
  removePending,
  onCloseAgenda,
  onCreateCronograma,
  onCloseModoSelector,
  onModoSelect,
  onCloseCreate,
  onCreate,
  onCloseEdit,
  onUpdate,
  onCloseAuto,
  onAutoSaved,
  onCloseSimplificada,
  onCreateSimplificada,
  onCloseRemove,
  onRemove,
  onCloseRegistro,
}: CronogramaDialogsProps) {
  return (
    <>
      <CronogramaAgendaHojeDialog open={agendaHojeOpen} onClose={onCloseAgenda} blocos={blocos} disciplinaNome={disciplinaNome} onCriarCronograma={onCreateCronograma} />
      <CronogramaModoSelectorModal open={modoSelectorOpen} onClose={onCloseModoSelector} onSelect={onModoSelect} />
      <BlocoFormModal open={createOpen} onClose={onCloseCreate} onSave={onCreate} disciplinas={disciplinas} title="Novo horário (Analítica)" isSaving={createPending} />

      {editBloco?.modo_criacao === "simplificada" ? (
        <CronogramaSimplificadoEditModal open onClose={onCloseEdit} onSave={(payload) => onUpdate(editBloco.id, payload)} bloco={editBloco} disciplinas={disciplinas} isSaving={updatePending} />
      ) : null}
      {editBloco && editBloco.modo_criacao !== "simplificada" ? (
        <BlocoFormModal
          open
          onClose={onCloseEdit}
          onSave={(form) => onUpdate(editBloco.id, form)}
          disciplinas={disciplinas}
          initialValues={{
            disciplina_id: editBloco.disciplina_id,
            dia_semana: editBloco.dia_semana,
            hora_inicio: editBloco.hora_inicio.slice(0, 5),
            hora_fim: editBloco.hora_fim.slice(0, 5),
            tipo: editBloco.tipo,
            ativo: editBloco.ativo,
            topico_ids: blocoTopicoIds(editBloco),
          }}
          title={editTitleForModo(editBloco.modo_criacao)}
          isSaving={updatePending}
        />
      ) : null}

      <GerarCronogramaAutoModal open={autoOpen} onClose={onCloseAuto} disciplinas={disciplinas} hasConcursoAtivo={hasConcursoAtivo} onSaved={onAutoSaved} />
      <CronogramaSimplificadoModal open={simplificadaOpen} onClose={onCloseSimplificada} onSave={onCreateSimplificada} disciplinas={disciplinas} isSaving={simplifiedPending} />

      {removeTarget ? (
        <CronogramaRemoverDialog
          open
          onClose={onCloseRemove}
          bloco={removeTarget.bloco}
          dataAlvo={removeTarget.dataAlvo}
          diaLabel={removeTarget.diaLabel}
          isPending={removePending}
          onConfirm={(scope) => onRemove(removeTarget.bloco.id, scope, removeTarget.dataAlvo)}
        />
      ) : null}

      <RegistroEstudoModal open={openRegistro} onClose={onCloseRegistro} defaultDisciplinaId={null} />
    </>
  );
}
