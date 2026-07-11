import React from "react";

import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import { CalendarioDiaDetalheDialog } from "@/components/calendario/CalendarioDiaDetalheDialog";
import { CalendarioLegenda } from "@/components/calendario/CalendarioLegenda";
import { CalendarioMensalGrid } from "@/components/calendario/CalendarioMensalGrid";
import { CalendarioMesToolbar } from "@/components/calendario/CalendarioMesToolbar";
import { CalendarioResumoMes } from "@/components/calendario/CalendarioResumoMes";
import { useCalendarioMensal } from "@/hooks/useCalendarioMensal";
import { useConcursoAtivoId } from "@/stores/concursoStore";

export function CalendarioEstudos() {
  const concursoAtivoId = useConcursoAtivoId();
  const now = new Date();
  const [ano, setAno] = React.useState(now.getFullYear());
  const [mes, setMes] = React.useState(now.getMonth() + 1);
  const [diaSel, setDiaSel] = React.useState<string | null>(null);
  const [detalheOpen, setDetalheOpen] = React.useState(false);
  const [registroOpen, setRegistroOpen] = React.useState(false);
  const [registroData, setRegistroData] = React.useState<string | null>(null);

  const { dias, resumo, isLoading, isError } = useCalendarioMensal(ano, mes, concursoAtivoId);

  const shiftMonth = (delta: number) => {
    const d = new Date(ano, mes - 1 + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth() + 1);
  };

  const goToday = () => {
    const t = new Date();
    setAno(t.getFullYear());
    setMes(t.getMonth() + 1);
  };

  const openDia = (data: string) => {
    setDiaSel(data);
    setDetalheOpen(true);
  };

  const openRegistro = (data: string) => {
    setRegistroData(data);
    setDetalheOpen(false);
    setRegistroOpen(true);
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Calendário de estudos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe cumprimento do plano mês a mês</p>
      </div>

      <CalendarioMesToolbar
        ano={ano}
        mes={mes}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        onToday={goToday}
      />

      <CalendarioResumoMes resumo={resumo} />

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : isError ? (
          <p className="py-12 text-center text-sm text-destructive">Erro ao carregar calendário.</p>
        ) : (
          <CalendarioMensalGrid ano={ano} mes={mes} dias={dias} onDiaClick={openDia} />
        )}
        <CalendarioLegenda className="mt-4 border-t border-border pt-4" />
      </section>

      <CalendarioDiaDetalheDialog
        data={diaSel}
        concursoId={concursoAtivoId}
        open={detalheOpen}
        onClose={() => setDetalheOpen(false)}
        onRegistrar={openRegistro}
      />

      <RegistroEstudoModal
        open={registroOpen}
        onClose={() => {
          setRegistroOpen(false);
          setRegistroData(null);
        }}
        defaultDataReferencia={registroData}
      />
    </div>
  );
}
