import React from "react";

import { cn } from "@/lib/utils";

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

function hasInputValue(value: string | number | readonly string[] | undefined) {
  return String(value ?? "").length > 0;
}

export type FloatingLabelInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> & {
  label: React.ReactNode;
  error?: boolean;
  /** auth = login/cadastro; form = modais Aprovingo */
  variant?: "auth" | "form";
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
};

export const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  function FloatingLabelInput(
    {
      id,
      label,
      error = false,
      variant = "form",
      leftSlot,
      rightSlot,
      className,
      containerClassName,
      labelClassName,
      disabled,
      value,
      defaultValue,
      onFocus,
      onBlur,
      onChange,
      ...props
    },
    ref,
  ) {
    const innerRef = React.useRef<HTMLInputElement>(null);
    const [focused, setFocused] = React.useState(false);
    const [filled, setFilled] = React.useState(
      () => hasInputValue(value as string | undefined) || hasInputValue(defaultValue as string | undefined),
    );

    React.useLayoutEffect(() => {
      const el = innerRef.current;
      if (el) setFilled(hasInputValue(el.value));
    }, [value, defaultValue]);

    React.useEffect(() => {
      if (value !== undefined) setFilled(hasInputValue(value as string | undefined));
    }, [value]);

    const floated = focused || filled;
    const isAuth = variant === "auth";

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setFilled(hasInputValue(e.target.value));
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilled(hasInputValue(e.target.value));
      onChange?.(e);
    };

    const labelLeft = leftSlot ? (isAuth ? "left-11" : "left-11") : "left-4";

    return (
      <div className={cn("relative", containerClassName)}>
        {leftSlot ? (
          <span
            className={cn(
              "pointer-events-none absolute z-10 flex items-center justify-center transition-colors duration-150",
              isAuth
                ? cn(
                    "left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[15px] leading-none",
                    error ? "text-destructive" : "text-muted-foreground",
                    focused && !error && "text-primary",
                  )
                : cn(
                    "left-3.5 top-1/2 -translate-y-1/2 text-base",
                    error ? "text-destructive" : "text-muted-foreground",
                    focused && !error && "text-primary",
                  ),
            )}
            aria-hidden
          >
            {leftSlot}
          </span>
        ) : null}

        <input
          ref={mergeRefs(ref, innerRef)}
          id={id}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          placeholder=" "
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={cn(
            "peer w-full outline-none transition-all duration-150 placeholder:text-transparent",
            isAuth
              ? cn(
                  "box-border h-14 min-h-[56px] rounded-xl border-[1.5px] pb-2 pt-[22px] text-[15px] leading-normal text-foreground",
                  "focus:border-primary focus:bg-surface focus:ring-[3px] focus:ring-primary/15",
                  error ? "border-destructive bg-destructive/5" : "border-input bg-surface-muted",
                  leftSlot ? "pl-11" : "pl-4",
                  rightSlot ? "pr-11" : "pr-4",
                )
              : cn(
                  "h-14 rounded-lg border-[1.5px] border-border bg-surface px-4 pb-2.5 pt-5 text-sm text-foreground",
                  "focus:border-primary focus:ring-[3px] focus:ring-primary/15",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                ),
            className,
          )}
          {...props}
        />

        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute z-20 origin-left transition-all duration-150 ease-out",
            labelLeft,
            floated
              ? isAuth
                ? "top-2 translate-y-0 text-[11px] font-semibold text-primary"
                : "top-3 translate-y-0 text-[11px] font-medium text-primary"
              : isAuth
                ? "top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground"
                : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
            labelClassName,
          )}
        >
          {label}
        </label>

        {rightSlot}
      </div>
    );
  },
);

FloatingLabelInput.displayName = "FloatingLabelInput";
