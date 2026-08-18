import * as React from "react";
import { CalendarDays, X } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  allowClear?: boolean;
  min?: string;
  max?: string;
};

function parseDate(value?: string) {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function DatePicker({ value, onValueChange, placeholder = "Selecione uma data", disabled, className, id, "aria-label": ariaLabel, allowClear = true, min, max }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseDate(value);

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn("min-h-11 w-full justify-start gap-2 px-3 text-left font-normal", !selected && "text-muted-foreground", allowClear && selected && "pr-11")}
          >
            <CalendarDays className="size-4 text-primary" aria-hidden />
            <span>{selected ? format(selected, "dd/MM/yyyy", { locale: ptBR }) : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (!date) return;
              onValueChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
            locale={ptBR}
            disabled={[...(min ? [{ before: parseDate(min)! }] : []), ...(max ? [{ after: parseDate(max)! }] : [])]}
          />
        </PopoverContent>
      </Popover>
      {allowClear && selected && !disabled ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0.5 top-0.5 size-10 text-muted-foreground"
          aria-label={ariaLabel ? `Limpar ${ariaLabel.toLowerCase()}` : "Limpar data"}
          onClick={() => onValueChange("")}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
