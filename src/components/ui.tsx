"use client";
import type { ReactNode } from "react";
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  hint,
  min = 0,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="number-wrap">
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          min={min}
          max={max}
          step={step}
        />
        {suffix && <span>{suffix}</span>}
      </div>
    </Field>
  );
}
export async function api(path: string, method = "GET", data?: unknown) {
  const res = await fetch(`/api/${path}`, {
    method,
    headers: method === "GET" ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) {
    if (res.status === 401 && path !== "login") location.assign("/login");
    throw new Error(result.error || "No se pudo completar la operación.");
  }
  return result;
}
export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
