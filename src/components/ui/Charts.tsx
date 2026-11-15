"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export type Point = { label: string; total: number; completed: number; cancelled: number };

/** Stacked bars: completed / other live bookings / cancelled. */
export function BarChart({ data, height = 220 }: { data: Point[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.total + d.cancelled));
  return (
    <div>
      <div className="relative flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {[0, 0.5, 1].map((g) => (
          <div key={g} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-fg/[0.07]" style={{ bottom: `${g * 100}%` }} />
        ))}
        {data.map((d, i) => {
          const pct = (v: number) => `${(v / max) * 100}%`;
          return (
            <div key={d.label} className="relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {hover === i && (
                <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-fg/10 bg-ink-950 px-3 py-2 text-xs shadow-card">
                  <p className="font-medium text-fg">{d.label}</p>
                  <p className="text-mint-300">{d.completed} completed</p>
                  <p className="text-fog">{d.total} active/total</p>
                  <p className="text-rose-300">{d.cancelled} cancelled</p>
                </div>
              )}
              <motion.div initial={{ height: 0 }} whileInView={{ height: pct(d.cancelled) }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.03 }} className="w-full rounded-t-sm bg-rose-400/60" />
              <motion.div initial={{ height: 0 }} whileInView={{ height: pct(Math.max(0, d.total - d.completed)) }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.03 }} className="w-full bg-mint-400/30" />
              <motion.div initial={{ height: 0 }} whileInView={{ height: pct(d.completed) }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.03 }} className="w-full rounded-t-sm bg-mint-400" style={d.total - d.completed <= 0 && d.cancelled === 0 ? undefined : { borderRadius: 0 }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {data.map((d) => (
          <span key={d.label} className="flex-1 truncate text-center text-[10px] text-fog-dark sm:text-[11px]">
            {d.label}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-fog">
        <Legend color="bg-mint-400" label="Completed" />
        <Legend color="bg-mint-400/30" label="Scheduled / other" />
        <Legend color="bg-rose-400/60" label="Cancelled" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

export function AreaChart({ data, height = 200 }: { data: Point[]; height?: number }) {
  const w = 600;
  const h = height;
  const pad = 24;
  const max = Math.max(1, ...data.map((d) => d.total)) * 1.15;
  const pts = data.map((d, i) => [pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1), h - pad - (d.total / max) * (h - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1]?.[0] ?? pad},${h - pad} L${pts[0]?.[0] ?? pad},${h - pad} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Appointments over time">
        <defs>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-mint-400)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-mint-400)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((g) => (
          <line key={g} x1={pad} x2={w - pad} y1={pad + g * (h - pad * 2)} y2={pad + g * (h - pad * 2)} stroke="var(--color-fg)" strokeOpacity="0.1" strokeDasharray="4 6" />
        ))}
        <path d={area} fill="url(#area)" />
        <motion.path d={line} fill="none" stroke="var(--color-mint-400)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2 }} />
        {pts.map(([x, y], i) => (
          <g key={data[i].label}>
            <circle cx={x} cy={y} r="4" fill="var(--color-ink-900)" stroke="var(--color-mint-400)" strokeWidth="2" />
            <title>{`${data[i].label}: ${data[i].total}`}</title>
            <text x={x} y={y - 12} textAnchor="middle" fontSize="11" fill="var(--color-mint-300)">
              {data[i].total}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between px-1 text-[11px] text-fog-dark">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function Donut({ segments, size = 180 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 70;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 180 180" className="-rotate-90" role="img" aria-label="Status breakdown">
          <circle cx="90" cy="90" r={r} fill="none" stroke="var(--color-fg)" strokeOpacity="0.08" strokeWidth="18" />
          {total > 0 &&
            segments.map((s) => {
              const len = (s.value / total) * c;
              const el = (
                <motion.circle
                  key={s.label}
                  cx="90"
                  cy="90"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="18"
                  strokeDasharray={`${Math.max(0, len - 2)} ${c}`}
                  strokeDashoffset={-offset}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                />
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-4xl text-fg">{total}</span>
          <span className="text-[11px] uppercase tracking-widest text-fog">Total</span>
        </div>
      </div>
      <ul className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-1">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-fog">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-medium text-fg">
              {s.value}
              <span className="ml-1.5 text-xs text-fog-dark">{total ? Math.round((s.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HBars({ items, format }: { items: { label: string; sub?: string; value: number }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-4">
      {items.map((it, idx) => (
        <li key={it.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-fg">
              <span className="mr-2 text-fog-dark">{String(idx + 1).padStart(2, "0")}</span>
              {it.label}
              {it.sub && <span className="ml-2 text-xs text-fog-dark">{it.sub}</span>}
            </span>
            <span className="shrink-0 text-mint-300">{format ? format(it.value) : it.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-fg/[0.06]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-mint-600 to-mint-300" initial={{ width: 0 }} whileInView={{ width: `${(it.value / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: idx * 0.05 }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
