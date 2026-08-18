import * as React from "react";
import { Clock3 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type TimePickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
};

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

function parseTime(value: string) {
  const [rawHour = "00", rawMinute = "00"] = value.split(":");
  return {
    hour: HOURS.includes(rawHour) ? rawHour : "00",
    minute: MINUTES.includes(rawMinute) ? rawMinute : "00",
  };
}

export function TimePicker({
  value,
  onValueChange,
  disabled,
  className,
  id,
  "aria-label": ariaLabel = "Horário",
  "aria-invalid": ariaInvalid,
}: TimePickerProps) {
  const { hour, minute } = parseTime(value);

  return (
    <div
      id={id}
      role="group"
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
      className={cn(
        "grid min-h-11 w-full grid-cols-[1fr_auto_1fr_auto] items-center rounded-lg border border-input bg-background shadow-sm transition-colors",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive/20",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <Select value={hour} onValueChange={(nextHour) => onValueChange(`${nextHour}:${minute}`)} disabled={disabled}>
        <SelectTrigger
          aria-label={`${ariaLabel}: hora`}
          className="min-h-10 min-w-0 border-0 bg-transparent px-3 font-medium shadow-none focus:ring-0 [&>svg]:hidden"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72 min-w-20">
          {HOURS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
        </SelectContent>
      </Select>

      <span className="font-semibold text-muted-foreground" aria-hidden>:</span>

      <Select value={minute} onValueChange={(nextMinute) => onValueChange(`${hour}:${nextMinute}`)} disabled={disabled}>
        <SelectTrigger
          aria-label={`${ariaLabel}: minutos`}
          className="min-h-10 min-w-0 border-0 bg-transparent px-3 font-medium shadow-none focus:ring-0 [&>svg]:hidden"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72 min-w-20">
          {MINUTES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
        </SelectContent>
      </Select>

      <Clock3 className="mr-3 size-4 text-muted-foreground" aria-hidden />
    </div>
  );
}
