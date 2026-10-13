import React from "react";
import { UNSAFE_LocationContext, UNSAFE_NavigationContext } from "react-router-dom";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

/** BrowserRouter-compatible guard. Query-only changes keep the current editor draft. */
export function useUnsavedChanges(dirty: boolean) {
  const context = React.useContext(UNSAFE_NavigationContext);
  const locationContext = React.useContext(UNSAFE_LocationContext);
  const currentRoute = React.useRef(locationContext?.location.pathname ?? window.location.pathname);
  currentRoute.current = locationContext?.location.pathname ?? window.location.pathname;
  const { requestConfirmation, confirmDialog } = useConfirmDialog();
  const dirtyRef = React.useRef(dirty);
  dirtyRef.current = dirty;
  const pending = React.useRef(false);
  const ask = React.useCallback(async (proceed: () => void) => {
    if (pending.current) return;
    pending.current = true;
    const confirmed = await requestConfirmation({ title: "Descartar alterações?", description: "Há alterações não salvas. Volte ao formulário para salvar ou confirme para sair e descartar o rascunho.", confirmLabel: "Descartar e sair", cancelLabel: "Continuar editando", variant: "destructive" });
    pending.current = false;
    if (confirmed) proceed();
  }, [requestConfirmation]);

  React.useEffect(() => {
    const onUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  React.useEffect(() => {
    if (!context) return;
    const navigator = context.navigator;
    const push = navigator.push;
    const replace = navigator.replace;
    const go = navigator.go;
    let currentIndex = window.history.state?.idx as number | undefined;
    let currentPath = currentRoute.current;
    let restoring = false;
    let approvedPop = false;
    const destinationPath = (to: Parameters<typeof push>[0]) => typeof to === "string" ? new URL(to, window.location.href).pathname : to.pathname ?? currentPath;
    const guard = (operation: typeof push) => (...args: Parameters<typeof push>) => {
      const proceed = () => { const nextPath = destinationPath(args[0]); operation.apply(navigator, args); currentIndex = window.history.state?.idx; currentPath = nextPath; };
      if (dirtyRef.current && destinationPath(args[0]) !== currentPath) void ask(proceed);
      else proceed();
    };
    const guardedPush = guard(push);
    const guardedReplace = guard(replace);
    navigator.push = guardedPush;
    navigator.replace = guardedReplace;
    navigator.go = (delta) => {
      const proceed = () => { approvedPop = true; go.call(navigator, delta); };
      if (dirtyRef.current) void ask(proceed); else proceed();
    };
    const onPop = (event: PopStateEvent) => {
      const target = event.state?.idx as number | undefined;
      if (restoring) { event.stopImmediatePropagation(); restoring = false; return; }
      if (approvedPop || !dirtyRef.current || currentPath === window.location.pathname || currentIndex === undefined || target === undefined) {
        approvedPop = false; currentIndex = target; currentPath = window.location.pathname; return;
      }
      // Stop Router from unmounting the editor while the accessible confirmation is open.
      event.stopImmediatePropagation();
      const delta = target - currentIndex;
      if (!delta) return;
      restoring = true;
      go.call(navigator, -delta);
      void ask(() => { approvedPop = true; go.call(navigator, delta); });
    };
    window.addEventListener("popstate", onPop, true);
    return () => {
      if (navigator.push === guardedPush) navigator.push = push;
      if (navigator.replace === guardedReplace) navigator.replace = replace;
      navigator.go = go;
      window.removeEventListener("popstate", onPop, true);
    };
  }, [context, ask]);
  return { confirmDialog, markSaved: () => { dirtyRef.current = false; } };
}
