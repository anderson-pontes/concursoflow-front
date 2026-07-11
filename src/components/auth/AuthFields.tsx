import React from "react";
import { Eye, EyeOff } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

import googleIcon from "@/assets/icons/google.svg";
import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { cn } from "@/lib/utils";

export function AuthSeparatorOu() {
  return (
    <div className="my-5 flex items-center gap-0">
      <span className="h-px flex-1 bg-border" />
      <span className="px-3 text-[13px] text-muted-foreground">ou</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function GoogleSignInButton({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-label="Continuar com Google"
        className="flex min-h-[50px] w-full items-center justify-center gap-3 rounded-xl border-[1.5px] border-border bg-surface text-[15px] font-semibold text-foreground shadow-sm transition-all hover:-translate-y-px hover:border-border hover:bg-surface-muted hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
      >
        <img src={googleIcon} alt="" className="h-5 w-5 shrink-0" aria-hidden />
        Continuar com Google
      </button>
      {disabled ? <p className="text-center text-xs text-muted-foreground">Login com Google em breve</p> : null}
    </div>
  );
}

type AuthEmailFieldProps = {
  id: string;
  registration: UseFormRegisterReturn<string>;
  error?: string;
};

export function AuthEmailField({ id, registration, error }: AuthEmailFieldProps) {
  const hasError = Boolean(error);
  return (
    <div className="space-y-1.5">
      <FloatingLabelInput
        id={id}
        type="email"
        autoComplete="email"
        variant="auth"
        label="E-mail"
        error={hasError}
        leftSlot="✉️"
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        {...registration}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type AuthPasswordFieldProps = {
  id: string;
  registration: UseFormRegisterReturn<string>;
  error?: string;
  label?: string;
  placeholderDots?: string;
};

export function AuthPasswordField({
  id,
  registration,
  error,
  label = "Senha",
  placeholderDots = "••••••••",
}: AuthPasswordFieldProps) {
  const [show, setShow] = React.useState(false);
  const hasError = Boolean(error);
  return (
    <div className="space-y-1.5">
      <FloatingLabelInput
        id={id}
        type={show ? "text" : "password"}
        autoComplete="current-password"
        variant="auth"
        label={label}
        error={hasError}
        leftSlot="🔒"
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        rightSlot={
          <button
            type="button"
            tabIndex={-1}
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShow((s) => !s)}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        {...registration}
      />
      <span className="sr-only">{placeholderDots}</span>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type AuthTextFieldProps = {
  id: string;
  registration: UseFormRegisterReturn<string>;
  error?: string;
  label: string;
  type?: string;
  autoComplete?: string;
  icon?: string;
};

export function AuthTextField({
  id,
  registration,
  error,
  label,
  type = "text",
  autoComplete,
  icon,
}: AuthTextFieldProps) {
  const hasError = Boolean(error);
  return (
    <div className="space-y-1.5">
      <FloatingLabelInput
        id={id}
        type={type}
        autoComplete={autoComplete}
        variant="auth"
        label={label}
        error={hasError}
        leftSlot={icon}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        {...registration}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type AuthPrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
};

export function AuthPrimaryButton({
  children,
  loading,
  loadingLabel = "Entrando...",
  className,
  disabled,
  type = "submit",
  ...props
}: AuthPrimaryButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        "flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-md transition-all",
        "hover:-translate-y-px hover:bg-primary-700 hover:shadow-lg",
        "active:translate-y-0 active:shadow-md",
        "disabled:cursor-not-allowed disabled:opacity-85",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
            aria-hidden
          />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthLinkButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "text-[13px] font-medium text-primary transition-colors hover:text-primary-700 hover:underline dark:hover:text-primary-400",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthSecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-[50px] w-full items-center justify-center rounded-xl border-[1.5px] border-primary bg-primary-muted text-[15px] font-semibold text-primary transition-all hover:bg-accent",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
