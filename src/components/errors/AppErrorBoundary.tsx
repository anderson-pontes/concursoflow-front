import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type State = { hasError: boolean };

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Erro inesperado na interface", error, info.componentStack);
  }

  private retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-background p-6">
        <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 text-center shadow-sm" role="alert">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-foreground">Não foi possível exibir esta página</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seus dados continuam seguros. Tente novamente e, se o problema persistir, recarregue a aplicação.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button type="button" onClick={this.retry}>
              <RefreshCw aria-hidden />
              Tentar novamente
            </Button>
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Recarregar aplicação
            </Button>
          </div>
        </section>
      </main>
    );
  }
}
