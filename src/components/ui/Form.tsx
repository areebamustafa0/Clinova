"use client";

import clsx from "clsx";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export const controlClass =
  "w-full rounded-xl border border-fg/10 bg-fg/[0.04] px-4 text-sm text-fg placeholder:text-fog-dark transition focus:border-mint-400/70 focus:bg-fg/[0.07] focus:outline-none focus:ring-4 focus:ring-mint-400/10 disabled:cursor-not-allowed disabled:opacity-50";

type FieldShell = { label?: string; error?: string | null; hint?: string; required?: boolean; className?: string };

function Shell({ id, label, error, hint, required, className, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div className={clsx("block", className)}>
      {label && (
        <label htmlFor={id} className="mb-2 block text-[12px] font-medium uppercase tracking-[0.12em] text-fog">
          {label}
          {required && <span className="ml-1 text-mint-400">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[12.5px] text-rose-300">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12.5px] text-fog-dark">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = FieldShell & InputHTMLAttributes<HTMLInputElement>;
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, className, required, ...rest }, ref) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={clsx(controlClass, "h-12", error && "border-rose-400/60")}
        {...rest}
      />
    </Shell>
  );
});

type SelectProps = FieldShell & SelectHTMLAttributes<HTMLSelectElement>;
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, hint, className, required, children, ...rest }, ref) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <select
        ref={ref}
        id={id}
        required={required}
        aria-invalid={!!error}
        className={clsx(controlClass, "select-arrow h-12 appearance-none pr-10", error && "border-rose-400/60")}
        {...rest}
      >
        {children}
      </select>
    </Shell>
  );
});

type TextareaProps = FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>;
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, hint, className, required, ...rest }, ref) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} required={required} className={className}>
      <textarea
        ref={ref}
        id={id}
        required={required}
        aria-invalid={!!error}
        className={clsx(controlClass, "min-h-[110px] resize-y py-3.5 leading-relaxed", error && "border-rose-400/60")}
        {...rest}
      />
    </Shell>
  );
});

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx("relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-mint-400" : "bg-fg/15")}
    >
      <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px] bg-ink-950" : "left-0.5")} />
    </button>
  );
}
