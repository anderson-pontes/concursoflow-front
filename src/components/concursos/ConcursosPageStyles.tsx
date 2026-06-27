export function ConcursosPageStyles() {
  return (
    <style>{`
      @keyframes concurso-dot-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.92); }
      }
      .concurso-dot-pulse { animation: concurso-dot-pulse 1.6s ease-in-out infinite; }
    `}</style>
  );
}
