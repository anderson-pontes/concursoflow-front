import React from "react";
import ReactDOM from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Play, Pause, Square, RotateCcw, Save, StopCircle, BookMarked, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/services/api";
import { usePomodoroStore } from "@/stores/pomodoroStore";
import { RegistroEstudoModal } from "@/components/estudos/RegistroEstudoModal";
import type { RegistroDefaultTopico } from "@/components/estudos/RegistroEstudoModal";

type Phase = "foco" | "pausa";
type TopicoOpt = { id: string; descricao: string; status: string };

/* ─── Formatters ─────────────────────────────────────────────────────────── */
function pad(n: number) { return String(n).padStart(2, "0"); }
function formatMMSS(s: number) {
  const a = Math.abs(s);
  return `${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}
function formatHHMMSS(s: number) {
  const a = Math.abs(s);
  const h = Math.floor(a / 3600);
  const m = Math.floor((a % 3600) / 60);
  const sec = a % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/* ─── Sound helpers ──────────────────────────────────────────────────────── */
function getAudioCtx() {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Ctx();
}

/** Toca uma nota com envelope ADSR suave */
function playNote(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  gainPeak = 0.35,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.03);
  gain.gain.setValueAtTime(gainPeak, startTime + duration - 0.06);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Bipe simples de alerta (pausa entre ciclos) */
function playBeep() {
  try {
    const ctx = getAudioCtx();
    playNote(ctx, 880, ctx.currentTime, 0.28);
    setTimeout(() => ctx.close(), 600);
  } catch { /* no audio env */ }
}

/**
 * Som de conclusão de sessão — acorde ascendente tipo "achievement".
 * Toca 4 notas: Mi4 → Sol4 → Si4 → Mi5
 */
function playCompletionSound() {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;
    const notes = [329.63, 392.0, 493.88, 659.25]; // E4, G4, B4, E5
    notes.forEach((freq, i) => {
      playNote(ctx, freq, t + i * 0.18, 0.55, 0.3);
    });
    // nota longa final de sustain
    playNote(ctx, 659.25, t + notes.length * 0.18, 0.9, 0.2);
    setTimeout(() => ctx.close(), 3000);
  } catch { /* no audio env */ }
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
type RegistroSnapshot = {
  duracaoSegundos: number;
  topicoDefaultList: RegistroDefaultTopico[] | null;
  isPartial: boolean;
};

/* ─── Theme ──────────────────────────────────────────────────────────────── */
type Theme = {
  bg: string;
  glow: string;
  bar: string;
  accent: string;
  accentMuted: string;
  chipBg: string;
  chipText: string;
  modeLabel: string;
  subLabel: string;
};
function getTheme(phase: Phase, isCronometro: boolean): Theme {
  if (isCronometro)
    return {
      bg: "linear-gradient(160deg, #020d09 0%, #031a10 40%, #042318 100%)",
      glow: "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(16,185,129,0.18) 0%, transparent 70%)",
      bar: "#10b981",
      accent: "#34d399",
      accentMuted: "rgba(52,211,153,0.15)",
      chipBg: "rgba(52,211,153,0.15)",
      chipText: "#6ee7b7",
      modeLabel: "CRONÔMETRO",
      subLabel: "SESSÃO LIVRE",
    };
  if (phase === "pausa")
    return {
      bg: "linear-gradient(160deg, #0d0700 0%, #1c0f00 40%, #2a1600 100%)",
      glow: "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(245,158,11,0.18) 0%, transparent 70%)",
      bar: "#f59e0b",
      accent: "#fbbf24",
      accentMuted: "rgba(251,191,36,0.15)",
      chipBg: "rgba(251,191,36,0.15)",
      chipText: "#fde68a",
      modeLabel: "PAUSA",
      subLabel: "DESCANSE",
    };
  return {
    bg: "linear-gradient(160deg, #06040f 0%, #0e0b1e 40%, #150f2e 100%)",
    glow: "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(99,102,241,0.2) 0%, transparent 70%)",
    bar: "#6366f1",
    accent: "#818cf8",
    accentMuted: "rgba(129,140,248,0.15)",
    chipBg: "rgba(129,140,248,0.15)",
    chipText: "#c7d2fe",
    modeLabel: "POMODORO",
    subLabel: "FOCO",
  };
}

/* ─── Circular progress arc ──────────────────────────────────────────────── */
function CircularArc({
  progress, size, stroke, color,
}: { progress: number; size: number; stroke: number; color: string }) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }} aria-hidden>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
      />
    </svg>
  );
}

/* ─── Circular button ────────────────────────────────────────────────────── */
function CircleBtn({
  onClick, title, size = 64, bg, children,
}: { onClick: () => void; title?: string; size?: number; bg: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: bg, border: "1.5px solid rgba(255,255,255,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "transform 0.15s, opacity 0.15s",
        backdropFilter: "blur(6px)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.93)"; }}
      onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)"; }}
    >
      {children}
    </button>
  );
}

/* ─── Props ──────────────────────────────────────────────────────────────── */
type PomodoroTimerProps = {
  onActiveChange?: (active: boolean) => void;
  disciplinaNome?: string;
};

/* ─── Main component ─────────────────────────────────────────────────────── */
export function PomodoroTimer({ onActiveChange, disciplinaNome }: PomodoroTimerProps) {
  const {
    mode, focusMinutes, shortBreakMinutes, longBreakMinutes,
    cyclesTarget, disciplinaId, topicoId,
  } = usePomodoroStore();

  const qc = useQueryClient();

  const [isRunning, setIsRunning] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("foco");
  const [cycleIndex, setCycleIndex] = React.useState(0);
  const [remainingSeconds, setRemainingSeconds] = React.useState(focusMinutes * 60);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [showTopico, setShowTopico] = React.useState(false);

  const focusStartRef = React.useRef<number | null>(null);
  const partialSaveStartRef = React.useRef<number | null>(null);

  const [registroOpen, setRegistroOpen] = React.useState(false);
  const [registroSnapshot, setRegistroSnapshot] = React.useState<RegistroSnapshot | null>(null);

  const canStart = Boolean(disciplinaId);
  const isCronometro = mode === "cronometro";
  const hasStarted = focusStartRef.current !== null;
  const isActive = isRunning || hasStarted;

  React.useEffect(() => { onActiveChange?.(isActive); }, [isActive, onActiveChange]);

  /* ─── Tópicos ─────────────────────────────────────────────────────────── */
  const { data: topicos } = useQuery({
    queryKey: ["disciplina-topicos-registro", disciplinaId],
    enabled: Boolean(disciplinaId) && isActive,
    queryFn: async () => {
      const res = await api.get(`/disciplinas/${disciplinaId}/topicos`);
      return (res.data as TopicoOpt[]).map((t) => ({
        id: String(t.id), descricao: t.descricao, status: t.status,
      }));
    },
  });

  const topicoDefaultList = React.useMemo<RegistroDefaultTopico[] | null>(() => {
    if (!topicoId) return null;
    const found = topicos?.find((t) => t.id === topicoId);
    return [{ id: topicoId, nome: found?.descricao ?? "" }];
  }, [topicoId, topicos]);

  /* ─── Sync on mode/focusMinutes ─────────────────────────────────────────── */
  React.useEffect(() => {
    if (!isRunning && !isCronometro) setRemainingSeconds(focusMinutes * 60);
    if (!isRunning && isCronometro) setElapsedSeconds(0);
    setPhase("foco"); setCycleIndex(0);
    focusStartRef.current = null; partialSaveStartRef.current = null;
  }, [mode, isCronometro, focusMinutes]);

  React.useEffect(() => {
    if (!isRunning && focusStartRef.current === null && !isCronometro)
      setRemainingSeconds(focusMinutes * 60);
  }, [focusMinutes, isRunning, isCronometro]);

  /* ─── Tick ───────────────────────────────────────────────────────────────── */
  React.useEffect(() => {
    if (!isRunning) return;
    const tick = setInterval(() => {
      if (isCronometro) setElapsedSeconds((s) => s + 1);
      else setRemainingSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(tick);
  }, [isRunning, isCronometro]);

  /* ─── Track focus start ──────────────────────────────────────────────────── */
  React.useEffect(() => {
    if (!isRunning || phase !== "foco") return;
    if (focusStartRef.current == null) {
      focusStartRef.current = Date.now();
      partialSaveStartRef.current = Date.now();
    }
  }, [isRunning, phase]);

  /* ─── Break duration ─────────────────────────────────────────────────────── */
  const breakSeconds = React.useMemo(() => {
    if (mode !== "pomodoro") return shortBreakMinutes * 60;
    return ((cycleIndex + 1) % 4 === 0 ? longBreakMinutes : shortBreakMinutes) * 60;
  }, [cycleIndex, longBreakMinutes, shortBreakMinutes, mode]);

  /* ─── Auto-save for countdown cycles ────────────────────────────────────── */
  const autoSaveSession = React.useCallback(
    async (opts: { startMs: number; endMs: number; pomodorosCount: number }) => {
      if (!disciplinaId) return;
      const duracaoMinutos = Math.max(1, Math.round((opts.endMs - opts.startMs) / 60000));
      const segundos = Math.round((opts.endMs - opts.startMs) / 1000);
      try {
        await api.post("/sessoes-estudo", {
          disciplina_id: disciplinaId,
          topico_id: topicoId || null,
          topico_ids: topicoId ? [topicoId] : [],
          inicio: new Date(opts.startMs).toISOString(),
          fim: new Date(opts.endMs).toISOString(),
          duracao_minutos: duracaoMinutos,
          tempo_estudo_segundos: segundos,
          tipo: mode === "pomodoro" ? "pomodoro" : "livre",
          pomodoros_concluidos: opts.pomodorosCount,
          anotacoes: null,
        });
        qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
        qc.invalidateQueries({ queryKey: ["dashboard-resumo"] });
        qc.invalidateQueries({ queryKey: ["sessoes-stats"] });
        toast.success(`Sessão registrada (${duracaoMinutos} min).`);
      } catch { toast.error("Erro ao registrar sessão."); }
    },
    [disciplinaId, topicoId, mode, qc],
  );

  /* ─── Countdown finish ───────────────────────────────────────────────────── */
  React.useEffect(() => {
    if (isCronometro || !isRunning || remainingSeconds > 0) return;
    const handleFinish = async () => {
      if (phase === "foco") {
        // sessão de foco concluída — som de achievement
        playCompletionSound();
        const startMs = focusStartRef.current;
        if (startMs) await autoSaveSession({ startMs, endMs: Date.now(), pomodorosCount: mode === "pomodoro" ? 1 : 0 });
        focusStartRef.current = null; partialSaveStartRef.current = null;
        if (mode === "livre") { setIsRunning(false); setPhase("foco"); setCycleIndex(0); setRemainingSeconds(focusMinutes * 60); return; }
        const next = cycleIndex + 1;
        if (next >= cyclesTarget) { setIsRunning(false); setPhase("foco"); setCycleIndex(0); setRemainingSeconds(focusMinutes * 60); return; }
        setCycleIndex(next); setPhase("pausa"); setRemainingSeconds(breakSeconds);
        return;
      }
      // pausa concluída — bipe simples
      playBeep();
      setPhase("foco"); setRemainingSeconds(focusMinutes * 60);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    handleFinish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, isRunning, phase, isCronometro]);

  /* ─── Controls ───────────────────────────────────────────────────────────── */
  const start = () => {
    if (!canStart) return;
    setIsRunning(true); setPhase("foco"); setCycleIndex(0);
    focusStartRef.current = Date.now(); partialSaveStartRef.current = Date.now();
    if (isCronometro) setElapsedSeconds(0);
    else setRemainingSeconds(focusMinutes * 60);
  };

  const resume = () => {
    if (!canStart || isRunning) return;
    setIsRunning(true);
    if (phase === "foco" && focusStartRef.current == null) {
      focusStartRef.current = Date.now(); partialSaveStartRef.current = Date.now();
    }
  };

  const reset = () => {
    setIsRunning(false); setPhase("foco"); setCycleIndex(0);
    focusStartRef.current = null; partialSaveStartRef.current = null;
    setElapsedSeconds(0); setRemainingSeconds(focusMinutes * 60);
    setShowTopico(false);
  };

  /* ─── Open modal ─────────────────────────────────────────────────────────── */
  const openModalWithSnapshot = React.useCallback(
    (isPartial: boolean) => {
      const startMs = partialSaveStartRef.current ?? focusStartRef.current;
      if (!startMs || !disciplinaId) return;
      const duracaoSegundos = Math.max(1, Math.round((Date.now() - startMs) / 1000));
      setRegistroSnapshot({ duracaoSegundos, topicoDefaultList, isPartial });
      setIsRunning(false);
      setRegistroOpen(true);
    },
    [disciplinaId, topicoDefaultList],
  );

  /* ─── After modal saved ──────────────────────────────────────────────────── */
  const handleModalSaved = React.useCallback(() => {
    setRegistroOpen(false);
    qc.invalidateQueries({ queryKey: ["disciplina-dashboard", disciplinaId] });
    qc.invalidateQueries({ queryKey: ["dashboard-resumo"] });
    qc.invalidateQueries({ queryKey: ["sessoes-stats"] });
    if (registroSnapshot?.isPartial) {
      partialSaveStartRef.current = null; focusStartRef.current = null;
      setElapsedSeconds(0);
      if (!isCronometro) setRemainingSeconds(focusMinutes * 60);
      setRegistroSnapshot(null);
    } else {
      reset(); setRegistroSnapshot(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroSnapshot, isCronometro, focusMinutes, disciplinaId, qc]);

  /* ─── Arc progress ───────────────────────────────────────────────────────── */
  const arcProgress = React.useMemo(() => {
    if (isCronometro) return (elapsedSeconds % (25 * 60)) / (25 * 60);
    if (phase === "foco") return 1 - remainingSeconds / (focusMinutes * 60);
    const breakTotal = mode === "pomodoro" ? breakSeconds : shortBreakMinutes * 60;
    return 1 - remainingSeconds / breakTotal;
  }, [isCronometro, elapsedSeconds, phase, remainingSeconds, focusMinutes, breakSeconds, shortBreakMinutes, mode]);

  const theme = getTheme(phase, isCronometro);
  const displayTime = isCronometro ? formatHHMMSS(elapsedSeconds) : formatMMSS(remainingSeconds);
  const topicoAtual = topicoId ? topicos?.find((t) => t.id === topicoId)?.descricao : null;

  /* ─── Idle card (before session starts) ─────────────────────────────────── */
  const idleCard = (
    <div
      style={{
        background: theme.bg,
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
        minWidth: 320,
        width: "100%",
      }}
    >
      {/* glow */}
      <div style={{ position: "absolute", inset: 0, background: theme.glow, pointerEvents: "none" }} />

      {/* top bar */}
      <div style={{ height: 3, background: theme.bar, opacity: 0.6 }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 32px 36px" }}>
        {/* mode chip */}
        <span style={{
          background: theme.chipBg, color: theme.chipText,
          borderRadius: 999, padding: "4px 16px",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
          marginBottom: 32,
        }}>
          {isCronometro ? "Cronômetro" : mode === "pomodoro" ? "Pomodoro" : "Tempo Livre"}
        </span>

        {/* arc */}
        <div style={{ position: "relative", width: 240, height: 240 }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <CircularArc progress={0} size={240} stroke={10} color={theme.accent} />
          </div>
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontFamily: "monospace", fontSize: 54, fontWeight: 900,
              letterSpacing: "-2px", color: "rgba(255,255,255,0.9)",
              lineHeight: 1,
            }}>
              {isCronometro ? "00:00" : formatMMSS(focusMinutes * 60)}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
              {isCronometro ? "pronto para iniciar" : `${focusMinutes} min de foco`}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 36 }}>
          {!canStart ? (
            <p style={{ color: "rgba(251,191,36,0.8)", fontSize: 13, textAlign: "center" }}>
              Selecione uma disciplina para iniciar
            </p>
          ) : (
            <button
              type="button"
              onClick={start}
              style={{
                background: `linear-gradient(135deg, ${theme.bar} 0%, ${theme.accent} 100%)`,
                color: "#fff", border: "none", borderRadius: 16,
                padding: "14px 40px", fontSize: 15, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                boxShadow: `0 6px 28px ${theme.bar}55`,
                transition: "transform 0.15s",
              }}
            >
              <Play style={{ width: 18, height: 18, fill: "currentColor" }} />
              Iniciar sessão
            </button>
          )}
        </div>
      </div>

      <RegistroEstudoModal
        open={registroOpen}
        onClose={() => { setRegistroOpen(false); setRegistroSnapshot(null); }}
        defaultDisciplinaId={disciplinaId}
        defaultTopicos={registroSnapshot?.topicoDefaultList ?? null}
        defaultDuracaoSegundos={registroSnapshot?.duracaoSegundos ?? null}
        onSaved={handleModalSaved}
      />
    </div>
  );

  /* ─── Full-screen overlay ────────────────────────────────────────────────── */
  const fullscreenOverlay = ReactDOM.createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: theme.bg,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* ambient glow */}
      <div style={{ position: "absolute", inset: 0, background: theme.glow, pointerEvents: "none" }} />

      {/* ── top progress bar ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: "rgba(255,255,255,0.06)",
      }}>
        <div style={{
          height: "100%",
          width: `${arcProgress * 100}%`,
          background: theme.bar,
          transition: "width 0.7s ease-out",
          boxShadow: `0 0 10px ${theme.bar}`,
        }} />
      </div>

      {/* ── top info bar ── */}
      <div style={{
        position: "absolute", top: 16, left: 0, right: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px",
      }}>
        {/* live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isRunning ? (
            <>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: theme.accent,
                boxShadow: `0 0 8px ${theme.accent}`,
                animation: "pulse 1.5s infinite",
              }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.08em" }}>
                AO VIVO
              </span>
            </>
          ) : (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.08em" }}>
              PAUSADO
            </span>
          )}
        </div>

        {/* cycle badge */}
        {mode === "pomodoro" && !isCronometro ? (
          <span style={{
            background: theme.chipBg, color: theme.chipText,
            borderRadius: 999, padding: "3px 12px",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          }}>
            Ciclo {cycleIndex + 1} / {cyclesTarget}
          </span>
        ) : null}
      </div>

      {/* ── center content ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {/* discipline + topic */}
        {disciplinaNome ? (
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
              {disciplinaNome}
              {topicoAtual ? (
                <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: 8 }}>· {topicoAtual}</span>
              ) : null}
            </p>
          </div>
        ) : null}

        {/* arc + time */}
        <div style={{ position: "relative", width: 320, height: 320 }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <CircularArc progress={arcProgress} size={320} stroke={14} color={theme.accent} />
          </div>

          {/* inner glow ring */}
          <div style={{
            position: "absolute",
            top: 14, left: 14, right: 14, bottom: 14,
            borderRadius: "50%",
            background: theme.accentMuted,
            border: `1px solid ${theme.accent}22`,
          }} />

          {/* time text */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontFamily: "'SF Mono', 'Fira Mono', 'Roboto Mono', monospace",
              fontSize: 72, fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-3px",
              lineHeight: 1,
              textShadow: `0 0 40px ${theme.accent}60`,
            }}>
              {displayTime}
            </span>
            <span style={{
              fontSize: 11, color: "rgba(255,255,255,0.3)",
              marginTop: 10, letterSpacing: "0.1em",
            }}>
              {isCronometro ? "TEMPO DECORRIDO" : phase === "foco" ? "TEMPO RESTANTE" : "EM PAUSA"}
            </span>
          </div>
        </div>

        {/* mode label */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{
            fontSize: 22, fontWeight: 800, letterSpacing: "0.18em",
            color: theme.accent, textTransform: "uppercase", lineHeight: 1,
          }}>
            {theme.modeLabel}
          </p>
          <p style={{
            fontSize: 12, fontWeight: 600, letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginTop: 4,
          }}>
            {theme.subLabel}
          </p>
        </div>

        {/* ── controls ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 44 }}>
          {isRunning ? (
            <>
              {/* Pause */}
              <CircleBtn onClick={() => setIsRunning(false)} title="Pausar" bg="rgba(255,255,255,0.1)">
                <Pause style={{ width: 24, height: 24, color: "#fff" }} />
              </CircleBtn>

              {/* Save now */}
              <CircleBtn onClick={() => openModalWithSnapshot(true)} title="Salvar agora" size={56} bg={theme.accentMuted}>
                <Save style={{ width: 20, height: 20, color: theme.accent }} />
              </CircleBtn>

              {/* Stop & save — main CTA */}
              <button
                type="button"
                onClick={() => openModalWithSnapshot(false)}
                style={{
                  height: 64, borderRadius: 32, padding: "0 28px",
                  background: "#ffffff", border: "none",
                  color: "#0a0a0a", fontSize: 14, fontWeight: 800,
                  display: "flex", alignItems: "center", gap: 8,
                  cursor: "pointer", letterSpacing: "0.02em",
                  boxShadow: "0 4px 24px rgba(255,255,255,0.18)",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              >
                <StopCircle style={{ width: 18, height: 18 }} />
                Encerrar e salvar
              </button>

              {/* Cancel */}
              <CircleBtn onClick={reset} title="Cancelar sessão" size={56} bg="rgba(255,255,255,0.06)">
                <Square style={{ width: 18, height: 18, color: "rgba(255,255,255,0.4)" }} />
              </CircleBtn>
            </>
          ) : (
            <>
              {/* Resume */}
              <CircleBtn onClick={resume} title="Retomar" bg={theme.accent} size={72}>
                <Play style={{ width: 26, height: 26, color: "#fff", fill: "currentColor" }} />
              </CircleBtn>

              {/* Stop & save */}
              <button
                type="button"
                onClick={() => openModalWithSnapshot(false)}
                style={{
                  height: 60, borderRadius: 30, padding: "0 24px",
                  background: "rgba(255,255,255,0.1)",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 8,
                  cursor: "pointer", backdropFilter: "blur(8px)",
                  transition: "transform 0.15s",
                }}
              >
                <StopCircle style={{ width: 16, height: 16 }} />
                Encerrar e salvar
              </button>

              {/* Reset */}
              <CircleBtn onClick={reset} title="Reiniciar" size={56} bg="rgba(255,255,255,0.06)">
                <RotateCcw style={{ width: 18, height: 18, color: "rgba(255,255,255,0.4)" }} />
              </CircleBtn>
            </>
          )}
        </div>

        {/* ── tópico selector ── */}
        {disciplinaId ? (
          <div style={{ marginTop: 36, width: 360, maxWidth: "90vw" }}>
            <button
              type="button"
              onClick={() => setShowTopico((s) => !s)}
              style={{
                width: "100%", background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, padding: "10px 16px",
                color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "space-between", letterSpacing: "0.04em",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BookMarked style={{ width: 14, height: 14, color: theme.accent }} />
                {topicoAtual ?? "Selecionar tópico"}
              </span>
              <ChevronDown style={{
                width: 14, height: 14,
                transform: showTopico ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }} />
            </button>

            {showTopico && topicos && topicos.length > 0 ? (
              <div style={{
                marginTop: 6, background: "rgba(10,10,20,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, overflow: "hidden",
                backdropFilter: "blur(12px)",
              }}>
                {[{ id: "", descricao: "Sem tópico específico", status: "" }, ...topicos].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      usePomodoroStore.getState().setTopicoId(t.id || null);
                      setShowTopico(false);
                    }}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "10px 16px", fontSize: 13, fontWeight: 500,
                      color: t.id === (topicoId ?? "") ? theme.accent : "rgba(255,255,255,0.7)",
                      background: t.id === (topicoId ?? "") ? theme.chipBg : "transparent",
                      border: "none", cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    {t.descricao}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Registro modal */}
      <RegistroEstudoModal
        open={registroOpen}
        onClose={() => { setRegistroOpen(false); setRegistroSnapshot(null); }}
        defaultDisciplinaId={disciplinaId}
        defaultTopicos={registroSnapshot?.topicoDefaultList ?? null}
        defaultDuracaoSegundos={registroSnapshot?.duracaoSegundos ?? null}
        onSaved={handleModalSaved}
      />

      {/* pulse keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>,
    document.body,
  );

  return (
    <>
      {idleCard}
      {isActive ? fullscreenOverlay : null}
    </>
  );
}
