import React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { FloatingLabelInput } from "@/components/ui/FloatingLabelInput";
import { cn } from "@/lib/utils";

export function AuthSeparatorOu() {
  return (
    <div className="my-5 flex items-center gap-0">
      <span className="h-px flex-1 bg-[#E5E7EB]" />
      <span className="px-3 text-[13px] text-[#9CA3AF]">ou</span>
      <span className="h-px flex-1 bg-[#E5E7EB]" />
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
        className="flex h-[50px] w-full items-center justify-center gap-3 rounded-xl border-[1.5px] border-[#E5E7EB] bg-white text-[15px] font-semibold text-[#374151] shadow-sm transition-all duration-200 ease-out hover:-translate-y-px hover:border-[#D1D5DB] hover:bg-[#F9FAFB] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continuar com Google
      </button>
      {disabled ? <p className="text-center text-xs text-[#9CA3AF]">Login com Google em breve</p> : null}
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
        <p id={`${id}-error`} className="text-xs text-[#EF4444]" role="alert">
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
            className="absolute right-[14px] top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-[#6B7280] transition-colors hover:bg-[#F3F4F6]"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShow((s) => !s)}
          >
            {show ? "🙈" : "👁"}
          </button>
        }
        {...registration}
      />
      <span className="sr-only">{placeholderDots}</span>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-[#EF4444]" role="alert">
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
        <p id={`${id}-error`} className="text-xs text-[#EF4444]" role="alert">
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
  style,
  type: _ignoredType,
  ...props
}: AuthPrimaryButtonProps) {
  return (
    <button
      {...props}
      type="submit"
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        "flex h-[50px] w-full items-center justify-center gap-2 rounded-xl text-base font-bold text-white shadow-[0_4px_16px_rgba(108,63,197,0.35)] transition-all duration-200 ease-out",
        "hover:brightness-[1.08] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(108,63,197,0.4)]",
        "active:translate-y-0 active:shadow-[0_2px_10px_rgba(108,63,197,0.3)]",
        "disabled:cursor-not-allowed disabled:opacity-85",
        className,
      )}
      style={{
        background: "linear-gradient(135deg, #6C3FC5, #7C3AED)",
        ...style,
      }}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent"
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
