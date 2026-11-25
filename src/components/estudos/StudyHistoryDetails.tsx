import { lazy, Suspense, useRef, useState } from "react";
import { History } from "lucide-react";

import { DisciplineColorIndicator, disciplineColorStyle } from "@/components/disciplinas/DisciplineColorIndicator";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = { concursoId: string; disciplinaId: string; disciplinaNome: string; disciplinaCor?: string | null; planoId?: string; compact?: boolean };

const StudyHistoryContent = lazy(() => import("@/components/estudos/StudyHistoryContent"));

export function StudyHistoryDetails(props: Props) {
  const [open, setOpen] = useState(false);
  const panelTitle = useRef<HTMLHeadingElement>(null);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className={cn("min-h-11 px-2", props.compact && "lg:h-8 lg:min-h-8")}
          aria-label={`Histórico de estudo de ${props.disciplinaNome}`}>
          <History aria-hidden />
          {props.compact ? "Histórico" : "Histórico de estudo"}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-dvh w-full max-w-none flex-col gap-0 overflow-hidden border-l-0 p-0 sm:max-w-none md:w-[min(100%,40rem)] md:border-l [&>button]:flex [&>button]:size-11 [&>button]:items-center [&>button]:justify-center"
        onOpenAutoFocus={(event) => { event.preventDefault(); panelTitle.current?.focus(); }}>
        <header className="flex shrink-0 items-start gap-3 border-b border-border bg-card py-4 pl-4 pr-16 sm:pl-6">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <History className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <SheetTitle ref={panelTitle} tabIndex={-1} className="text-xl leading-tight outline-none">Histórico de estudo</SheetTitle>
            <p style={disciplineColorStyle(props.disciplinaId, props.disciplinaCor)}
              className="flex min-w-0 items-baseline gap-2 text-sm font-semibold text-[color-mix(in_srgb,var(--card-foreground)_78%,var(--discipline-color))] [overflow-wrap:anywhere]">
              <DisciplineColorIndicator disciplinaId={props.disciplinaId} shape="dot" customColor={props.disciplinaCor} />
              {props.disciplinaNome}
            </p>
            <SheetDescription className="text-[13px]">Consulte suas sessões e retome de onde parou.</SheetDescription>
          </div>
        </header>
        {open && (
          <Suspense fallback={
            <div className="p-4 sm:p-6" role="status">
              <span className="sr-only">Carregando histórico de estudo</span>
              <Skeleton className="h-36 rounded-xl" />
            </div>
          }>
            <StudyHistoryContent {...props} />
          </Suspense>
        )}
      </SheetContent>
    </Sheet>
  );
}
