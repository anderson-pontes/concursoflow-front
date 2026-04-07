import React from "react";

import aprovinhoUrl from "@/assets/aprovinho.svg";
import { AprovingoLogo } from "@/components/branding/AprovingoLogo";

type AuthShellProps = {
  children: React.ReactNode;
};

/**
 * Layout 50/50 auth: hero (gradiente + logo + mascote) + coluna do formulário.
 * Logo Aprovingo e imagem Aprovinho: mesmos assets/componentes do projeto (sem alteração).
 */
export function AuthShell({ children }: AuthShellProps) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] box-border flex w-full flex-col overflow-hidden md:flex-row"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        height: "100vh",
        maxHeight: "100vh",
      }}
    >
      <style>{`
        @keyframes auth-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .auth-mascot-float {
          animation: auth-float 3s ease-in-out infinite;
        }
        @keyframes auth-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .auth-form-shake {
          animation: auth-shake 0.4s ease-out;
        }
        .auth-form-col-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .auth-form-col-scroll::-webkit-scrollbar {
          display: none;
        }
        @media (max-height: 699px) {
          .auth-hero-headline {
            font-size: 24px !important;
          }
          .auth-hero-mascot {
            max-height: 140px !important;
          }
          .auth-hero-features {
            gap: 6px !important;
          }
          .auth-hero-feature-item {
            padding: 9px 14px !important;
          }
        }
      `}</style>

      {/* Coluna esquerda — hero (oculta &lt; md) */}
      <aside
        className="relative box-border hidden h-[100vh] max-h-[100vh] w-1/2 flex-col overflow-hidden md:flex"
        style={{
          background: "linear-gradient(145deg, #4C1D95 0%, #6C3FC5 45%, #7C3AED 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 320,
            height: 320,
            background: "rgba(255,255,255,0.06)",
            top: -80,
            right: -80,
          }}
        />
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            background: "rgba(255,255,255,0.04)",
            bottom: -60,
            left: -60,
          }}
        />

        <div className="relative z-10 box-border flex h-[100vh] max-h-[100vh] min-h-0 flex-col overflow-hidden">
          <div className="box-border shrink-0 px-10 pb-0 pt-8">
            <AprovingoLogo className="h-12 w-auto max-w-[min(100%,220px)] shrink-0 sm:h-14" />
            <div className="h-8" aria-hidden />
          </div>

          <div className="box-border flex min-h-0 flex-1 flex-col overflow-hidden px-10">
            <h2
              className="auth-hero-headline mb-2.5 max-w-[420px] font-extrabold leading-[1.2] text-white"
              style={{ fontSize: 30, fontWeight: 800 }}
            >
              Sua aprovação começa com{" "}
              <span className="border-b-[3px] border-white/40 pb-0.5">organização</span>.
            </h2>
            <p
              className="mt-2 max-w-[380px] text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              Gerencie seus estudos, acompanhe seu progresso e alcance sua meta com mais foco.
            </p>

            <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden">
              <div className="relative mx-0 my-4 box-border h-[200px] shrink-0 overflow-visible">
                <div
                  className="absolute z-10 max-w-[min(100%,260px)] rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-[8px]"
                  style={{ top: 10, right: -10 }}
                >
                  <p
                    className="text-[15px] font-medium text-white"
                    style={{ fontFamily: "'Segoe Script', 'Brush Script MT', 'Apple Chancery', cursive" }}
                  >
                    Aprovinho · a ararinha estudiosa
                  </p>
                </div>
                <div className="flex h-full items-end justify-start">
                  <img
                    src={aprovinhoUrl}
                    alt="Aprovinho"
                    className="auth-hero-mascot auth-mascot-float relative z-0 max-h-[180px] w-auto object-contain"
                    style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.25))" }}
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="auth-hero-features mt-auto box-border flex shrink-0 flex-col gap-2 space-y-0 px-10 pb-8 pt-0">
            {[
              {
                bg: "#22C55E",
                icon: "✓",
                text: "+1.200 concurseiros já usam",
              },
              {
                bg: "#F59E0B",
                icon: "⏱",
                text: "Pomodoro, cronograma e simulados",
              },
              {
                bg: "#6366F1",
                icon: "📊",
                text: "Heatmap e métricas de evolução",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="auth-hero-feature-item flex cursor-default items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-[11px] backdrop-blur-[8px] transition-all duration-200 ease-out hover:translate-x-1 hover:bg-white/16"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: item.bg }}
                  aria-hidden
                >
                  {item.icon}
                </span>
                <span className="text-[13px] font-medium text-white">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Coluna direita — formulário */}
      <main
        className="auth-form-col-scroll relative box-border flex h-[100vh] max-h-[100vh] min-h-0 w-full flex-col overflow-y-auto bg-white md:w-1/2"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10 md:px-16 md:py-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
        <p className="pointer-events-none shrink-0 px-4 pb-6 pt-2 text-center text-[11px] text-[#9CA3AF] md:pb-6">
          © 2025 Aprovingo · Todos os direitos reservados
        </p>
      </main>
    </div>
  );
}
