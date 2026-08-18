import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMPTY_VALUE = "__empty_option__";

export type SelectFieldOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
};

export function SelectField({ value, onValueChange, options, placeholder = "Selecione", disabled, className, id, "aria-label": ariaLabel }: SelectFieldProps) {
  const hasEmptyOption = options.some((option) => option.value === "");
  const selectValue = value === "" && hasEmptyOption ? EMPTY_VALUE : value || undefined;

  return (
    <Select value={selectValue} onValueChange={(next) => onValueChange(next === EMPTY_VALUE ? "" : next)} disabled={disabled}>
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn(className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value || EMPTY_VALUE} value={option.value || EMPTY_VALUE} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
