"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { CalendarX2, ChevronLeft, ChevronRight, Moon, Sun, Sunset } from "lucide-react";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { useFetch } from "@/hooks/useFetch";
import { formatDate, formatTime } from "@/utils/format";
import type { SlotsResponse } from "@/types";

const pad = (n: number) => String(n).padStart(2, "0");
const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

type BaseProps = { doctorId: number; treatmentId: number; refreshKey?: number };

/** Month calendar – only days with real free slots (from the database) are selectable. */
export function DatePicker({ doctorId, treatmentId, value, onChange, refreshKey = 0 }: BaseProps & { value: string; onChange: (date: string) => void }) {
  const now = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1)));
  const [navigated, setNavigated] = useState(false);
  const jumped = useRef(false);
  const month = monthKey(cursor);
  const { data, loading, error, refetch } = useFetch<{ dates: { date: string; availableSlots: number }[] }>("/availability/dates", { doctorId, treatmentId, month, r: refreshKey });
  const available = useMemo(() => new Map((data?.dates ?? []).map((d) => [d.date, d.availableSlots])), [data]);

  // If the current month has nothing left, hop to the next month once.
  useEffect(() => {
    if (data && data.dates.length === 0 && !navigated && !value && !jumped.current) {
      jumped.current = true;
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
    }
  }, [data, navigated, value]);

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const dim = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const minMonth = monthKey(new Date(now.getFullYear(), now.getMonth(), 1));
  const maxMonth = monthKey(new Date(now.getFullYear(), now.getMonth() + 3, 1));
  const move = (delta: number) => {
    setNavigated(true);
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  };

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="rounded-3xl border border-fg/[0.08] bg-ink-800/50 p-5 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} disabled={month <= minMonth} aria-label="Previous month" className="rounded-full border border-fg/10 p-2.5 transition hover:border-mint-400/60 disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-serif text-2xl">{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        <button type="button" onClick={() => move(1)} disabled={month >= maxMonth} aria-label="Next month" className="rounded-full border border-fg/10 p-2.5 transition hover:border-mint-400/60 disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className={clsx("grid grid-cols-7 gap-1.5 text-center sm:gap-2", loading && "opacity-50")}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <span key={d} className="pb-2 text-[11px] font-medium uppercase tracking-wider text-fog-dark">{d}</span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} />;
          const iso = `${month}-${pad(d)}`;
          const slots = available.get(iso);
          const selected = value === iso;
          return (
            <button
              key={iso}
              type="button"
              disabled={!slots}
              onClick={() => onChange(iso)}
              aria-pressed={selected}
              aria-label={slots ? `${formatDate(iso, "long")}, ${slots} slots available` : `${formatDate(iso, "long")}, unavailable`}
              className={clsx(
                "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition",
                selected ? "bg-mint-400 font-semibold text-on-accent shadow-glow" : slots ? "border border-mint-400/25 bg-mint-400/[0.06] text-fg hover:border-mint-400 hover:bg-mint-400/15" : "cursor-not-allowed text-fg/20",
              )}
            >
              {d}
              {slots && !selected && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-mint-400" />}
            </button>
          );
        })}
      </div>
      {!loading && data && data.dates.length === 0 && <p className="mt-5 rounded-xl bg-fg/[0.04] px-4 py-3 text-center text-sm text-fog">No free dates this month — try another month.</p>}
      <p className="mt-5 flex items-center gap-2 text-xs text-fog-dark"><span className="h-2 w-2 rounded-full bg-mint-400" /> Dates with open appointments</p>
    </div>
  );
}

const groups = [
  { key: "morning", label: "Morning", Icon: Sun, test: (m: number) => m < 12 * 60 },
  { key: "afternoon", label: "Afternoon", Icon: Sunset, test: (m: number) => m >= 12 * 60 && m < 17 * 60 },
  { key: "evening", label: "Evening", Icon: Moon, test: (m: number) => m >= 17 * 60 },
];
const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Live availability for one day: booked and past times are never selectable. */
export function TimeSlots({ doctorId, treatmentId, date, value, onChange, excludeAppointmentId, refreshKey = 0 }: BaseProps & { date: string; value: string; onChange: (time: string) => void; excludeAppointmentId?: number }) {
  const { data, loading, error, refetch } = useFetch<SlotsResponse>(date ? "/availability/slots" : null, { doctorId, treatmentId, date, excludeAppointmentId, r: refreshKey });

  if (!date) return <p className="rounded-2xl border border-dashed border-fg/10 p-8 text-center text-sm text-fog">Select a date to see available times.</p>;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (loading && !data) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
      </div>
    );
  }
  const slots = (data?.slots ?? []).filter((s) => s.reason !== "past");
  const free = slots.filter((s) => s.available).length;

  if (data?.closedReason || slots.length === 0 || free === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-fg/10 p-10 text-center">
        <CalendarX2 className="h-8 w-8 text-fog" />
        <p className="mt-3 font-medium">{data?.closedReason ?? "Fully booked on this day"}</p>
        <p className="mt-1 text-sm text-fog">Please choose another date.</p>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-7", loading && "opacity-60")}>
      <p className="text-sm text-fog">
        <span className="text-fg">{formatDate(date, "long")}</span> · {free} {free === 1 ? "time" : "times"} available · {data?.durationMinutes} min session
      </p>
      {groups.map(({ key, label, Icon, test }) => {
        const list = slots.filter((s) => test(mins(s.startTime)));
        if (!list.length) return null;
        return (
          <div key={key}>
            <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-fog"><Icon className="h-3.5 w-3.5 text-mint-400" /> {label}</p>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
              {list.map((s) => {
                const selected = value === s.startTime;
                return (
                  <button
                    key={s.startTime}
                    type="button"
                    disabled={!s.available}
                    onClick={() => onChange(s.startTime)}
                    aria-pressed={selected}
                    title={s.available ? `${formatTime(s.startTime)} – ${formatTime(s.endTime)}` : "Already booked"}
                    className={clsx(
                      "h-12 rounded-xl border text-sm transition",
                      selected ? "border-mint-400 bg-mint-400 font-semibold text-on-accent shadow-glow" : s.available ? "border-fg/12 bg-fg/[0.03] hover:border-mint-400/70 hover:bg-mint-400/10" : "cursor-not-allowed border-transparent bg-fg/[0.02] text-fg/25 line-through",
                    )}
                  >
                    {formatTime(s.startTime)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
