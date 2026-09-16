"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, X, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/5 bg-night-900/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-right"
      >
        <span className="flex items-center gap-2 text-sm font-extrabold text-slate-100">
          <span className="text-gold-400">{icon}</span>
          {title}
          {badge && <span className="chip border-gold-500/30 bg-gold-500/10 text-gold-300">{badge}</span>}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="animate-fadeUp space-y-3.5 px-4 pb-4">{children}</div>}
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/5 bg-night-950/60 px-3 py-2.5 transition hover:border-gold-500/20">
      <span className="text-xs font-semibold text-slate-200">
        {label}
        {hint && <span className="mt-0.5 block text-[10px] font-normal text-slate-500">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-700"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "right-0.5" : "right-[22px]"}`} />
      </button>
    </label>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400">{label}</span>
        <span className="rounded-md bg-night-950 px-2 py-0.5 text-[11px] font-bold text-gold-300">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ["--pct" as any]: `${pct}%` }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export function SelectField<T extends string | number>({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="label flex items-center gap-1">
        {icon && <span className="text-emerald-400">{icon}</span>}
        {label}
      </label>
      <select className="field" value={value} onChange={(e) => onChange((typeof value === "number" ? Number(e.target.value) : e.target.value) as T)}>
        {options.map((o) => (
          <option key={String(o.value)} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, cols = 3 }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; sub?: string }[]; cols?: number }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className={value === o.value ? "seg-on" : "seg-off"}>
          {o.label}
          {o.sub && <span className="block text-[9px] font-medium opacity-70">{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

// ───────────── Toasts ─────────────
export type ToastKind = "success" | "error" | "info";
export interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const push = (kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  };
  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  return { toasts, push, remove };
}

export function Toasts({ items, onClose }: { items: ToastItem[]; onClose: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex animate-fadeUp items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm shadow-panel backdrop-blur-xl ${
            t.kind === "success"
              ? "border-emerald-500/40 bg-emerald-950/85 text-emerald-100"
              : t.kind === "error"
              ? "border-red-500/40 bg-red-950/85 text-red-100"
              : "border-gold-500/40 bg-night-900/90 text-slate-100"
          }`}
        >
          {t.kind === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : t.kind === "error" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Info className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="flex-1 leading-relaxed">{t.text}</span>
          <button onClick={() => onClose(t.id)} className="opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** حفظ حالة في localStorage */
export function useLocalState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state, loaded]);
  return [state, setState];
}
