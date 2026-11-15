"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { useFetch } from "@/hooks/useFetch";
import { formatDate } from "@/utils/format";

type DayCount = { date: string; availableSlots: number };
type Dates = { dates: DayCount[] };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Four-week availability heat-map for one doctor. Every cell is real data from the booking engine:
 * the deeper the colour, the more free appointment times that day. Open days link straight into booking.
 */
export function AvailabilityHeatmap({ doctorId, treatments }: { doctorId: number; treatments: { id: number; name: string }[] }) {
  const [treatmentId, setTreatmentId] = useState<number | undefined>(treatments[0]?.id);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Four full weeks, starting on the Monday of this week.
  const cells = useMemo(() => {
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return Array.from({ length: 28 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [today]);

  const thisMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
  const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextMonth = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}`;

  const first = useFetch<Dates>(treatmentId ? "/availability/dates" : null, { doctorId, treatmentId, month: thisMonth });
  const second = useFetch<Dates>(treatmentId ? "/availability/dates" : null, { doctorId, treatmentId, month: nextMonth });

  const counts = useMemo(() => new Map([...(first.data?.dates ?? []), ...(second.data?.dates ?? [])].map((x) => [x.date, x.availableSlots] as const)), [first.data, second.data]);
  const max = Math.max(1, ...counts.values());
  const loading = (first.loading && !first.data) || (second.loading && !second.data);
  const openDays = cells.filter((d) => d >= today && (counts.get(iso(d)) ?? 0) > 0).length;

  return (
    <div className="rounded-[var(--radius-panel)] bg-sand p-5 md:p-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        {treatments.length > 1 ? (
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1" role="tablist" aria-label="Choose a treatment">
            {treatments.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={treatmentId === t.id}
                onClick={() => setTreatmentId(t.id)}
                className={clsx(
                  "shrink-0 rounded-full border px-4 py-2 text-[0.8rem] font-medium transition-colors duration-300",
                  treatmentId === t.id ? "border-espresso bg-espresso text-cream" : "border-line text-espresso hover:border-espresso/50",
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="font-serif text-xl">{treatments[0]?.name}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>Fewer</span>
          <span aria-hidden className="h-2 w-24 rounded-full bg-gradient-to-r from-card via-[color-mix(in_srgb,var(--color-bronze)_50%,var(--color-card))] to-bronze" />
          <span>More free times</span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-7 gap-2 md:gap-3" role="grid" aria-label="Four-week availability">
        {WEEKDAYS.map((w) => (
          <div key={w} role="columnheader" className="pb-1 text-center text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted">
            {w}
          </div>
        ))}
        {loading
          ? Array.from({ length: 28 }).map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)
          : cells.map((d) => {
              const key = iso(d);
              const n = counts.get(key) ?? 0;
              const past = d < today;
              const open = !past && n > 0;
              const strength = open ? 18 + Math.round((n / max) * 72) : 0;
              return open ? (
                <Link
                  key={key}
                  role="gridcell"
                  href={`/dashboard/book?doctorId=${doctorId}${treatmentId ? `&treatmentId=${treatmentId}` : ""}&date=${key}`}
                  aria-label={`${formatDate(key, "long")}: ${n} free ${n === 1 ? "time" : "times"}. Book this day`}
                  className="group flex aspect-square flex-col items-center justify-center rounded-2xl transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-espresso"
                  style={{ background: `color-mix(in srgb, var(--color-bronze) ${strength}%, var(--color-card))` }}
                >
                  <span className="font-serif text-lg leading-none text-espresso md:text-xl">{d.getDate()}</span>
                  <span className="mt-1 text-[0.6rem] uppercase tracking-[0.1em] text-espresso/80">{n} free</span>
                </Link>
              ) : (
                <div key={key} role="gridcell" aria-disabled="true" aria-label={`${formatDate(key, "long")}: ${past ? "past" : "fully booked"}`} className={clsx("flex aspect-square flex-col items-center justify-center rounded-2xl", past ? "opacity-35" : "bg-card/40")}>
                  <span className="font-serif text-lg leading-none text-muted md:text-xl">{d.getDate()}</span>
                  <span className="mt-1 text-[0.6rem] uppercase tracking-[0.1em] text-muted">{past ? "" : "Full"}</span>
                </div>
              );
            })}
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        {loading ? "Checking the calendar…" : openDays > 0 ? `${openDays} open ${openDays === 1 ? "day" : "days"} in the next four weeks. Tap a day to book it.` : "No open days in the next four weeks — request a time and we will find one."}
      </p>
    </div>
  );
}
