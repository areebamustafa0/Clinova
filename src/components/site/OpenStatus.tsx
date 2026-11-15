"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

// Clinic hours (Europe/London). Index = weekday (0 Sunday).
const HOURS: ([number, number] | null)[] = [null, [9, 19], [9, 19], [9, 19], [9, 19], [9, 19], [10, 17]];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function compute(): { open: boolean; text: string } {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const day = WD[parts.find((p) => p.type === "weekday")?.value ?? "Mon"] ?? 1;
  const mins = Number(parts.find((p) => p.type === "hour")?.value) * 60 + Number(parts.find((p) => p.type === "minute")?.value);
  const today = HOURS[day];
  if (today && mins >= today[0] * 60 && mins < today[1] * 60) return { open: true, text: `Open now · until ${today[1]}:00` };
  if (today && mins < today[0] * 60) return { open: false, text: `Closed · opens ${today[0]}:00` };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const h = HOURS[d];
    if (h) return { open: false, text: `Closed · opens ${i === 1 ? "tomorrow" : DAYS[d]} ${h[0]}:00` };
  }
  return { open: false, text: "Closed" };
}

/** Live open/closed indicator for the clinic (computed in the clinic's timezone, refreshed every minute). */
export function OpenStatus({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const [state, setState] = useState<{ open: boolean; text: string } | null>(null);
  useEffect(() => {
    setState(compute());
    const id = setInterval(() => setState(compute()), 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={clsx("inline-flex items-center gap-2 text-xs", tone === "dark" ? "text-ivory/80" : "text-muted", className)} aria-live="polite">
      <span className={clsx("size-2 shrink-0 rounded-full", !state ? "bg-current opacity-30" : state.open ? "pulse-dot bg-emerald-500" : "bg-amber-500")} />
      <span className="min-w-[9rem]">{state?.text ?? "Checking opening hours…"}</span>
    </span>
  );
}
