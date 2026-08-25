import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DayButton, type DropdownProps, type Locale } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function Calendar({ className, classNames, showOutsideDays = true, locale, components, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      className={cn("w-fit bg-popover p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "space-y-4",
        month_caption: "relative flex h-10 items-center justify-center px-10",
        caption_label: "flex h-9 items-center gap-1 rounded-md px-2 text-sm font-semibold capitalize text-foreground",
        dropdowns: "flex items-center justify-center gap-1",
        dropdown_root: "relative rounded-md border border-input bg-background shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        dropdown: "absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed",
        months_dropdown: "font-medium",
        years_dropdown: "font-medium tabular-nums",
        nav: "absolute inset-x-0 top-3 z-10 flex items-center justify-between px-3",
        button_previous: "inline-flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        button_next: "inline-flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-10 py-1 text-center text-xs font-medium text-muted-foreground",
        week: "mt-1 flex w-full",
        day: "relative size-10 p-0 text-center",
        today: "rounded-md bg-primary-muted font-semibold text-primary",
        outside: "text-muted-foreground opacity-45",
        disabled: "pointer-events-none text-muted-foreground opacity-35",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...iconProps }) => {
          const Icon = orientation === "left" ? ChevronLeft : orientation === "right" ? ChevronRight : ChevronDown;
          return <Icon className={cn("size-4", iconClassName)} {...iconProps} />;
        },
        DayButton: (dayProps) => <CalendarDayButton locale={locale} {...dayProps} />,
        Dropdown: CalendarDropdown,
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDropdown({ options, value, onChange, disabled, "aria-label": ariaLabel }: DropdownProps) {
  const isMonthSelector = options?.length === 12;

  return (
    <Select
      value={String(value)}
      disabled={disabled}
      onValueChange={(nextValue) => {
        onChange?.({ target: { value: nextValue } } as React.ChangeEvent<HTMLSelectElement>);
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "h-10 min-h-10 rounded-md px-2.5 text-sm font-semibold capitalize shadow-sm",
          isMonthSelector ? "w-28" : "w-24",
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="z-[10070] max-h-72 min-w-[var(--radix-select-trigger-width)]">
        {options?.map((option) => (
          <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CalendarDayButton({ className, day, modifiers, locale, ...props }: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected={modifiers.selected || undefined}
      className={cn(
        "size-10 rounded-md p-0 font-normal text-foreground hover:bg-primary-muted hover:text-primary focus-visible:ring-2 data-[selected=true]:bg-primary data-[selected=true]:font-semibold data-[selected=true]:text-primary-foreground data-[selected=true]:hover:bg-primary",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
