"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("field", className)}>
      <span className="flabel">
        {label}
        {required && <em className="req">*</em>}
      </span>
      {children}
      {hint && <span className="fhit">{hint}</span>}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="textarea" {...props} />;
}

export function Select({
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select className="input select" {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SubmitBtn({
  children,
  pending,
  className,
  variant = "primary",
  onClick,
}: {
  children: ReactNode;
  pending?: string;
  className?: string;
  variant?: "primary" | "ghost" | "danger";
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
}) {
  const { pending: formPending } = useFormStatus();
  const busy = formPending || Boolean(pending);
  const label =
    busy && pending
      ? pending
      : busy
        ? "SAVING…"
        : children;
  return (
    <button
      type="submit"
      disabled={busy}
      onClick={onClick}
      className={cn("btn", `btn-${variant}`, className)}
    >
      {label}
    </button>
  );
}

export function ActionBtn({
  children,
  variant = "ghost",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button type="button" className={cn("btn", `btn-${variant}`, className)} {...props}>
      {children}
    </button>
  );
}

export function Card({
  title,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card", className)}>
      {(title || actions) && (
        <header className="card-head">
          <h2 className="card-title">{title}</h2>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PUBLISHED: "badge-green",
    DRAFT: "badge-gray",
    ARCHIVED: "badge-red",
    NEW: "badge-green",
    READ: "badge-gray",
  };
  return <span className={cn("badge", map[status] ?? "badge-gray")}>{status}</span>;
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="empty">
      <span className="empty-title">{title}</span>
      {text && <span className="empty-text">{text}</span>}
    </div>
  );
}

export function CheckRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="check-row">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="check-text">
        <span>{label}</span>
        {hint && <em>{hint}</em>}
      </span>
    </label>
  );
}