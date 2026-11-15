"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { CalendarOff, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { Input, Select, Toggle } from "@/components/ui/Form";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/hooks/useFetch";
import { del, errorMessage, post, put } from "@/lib/http";
import { DAY_NAMES, formatDate } from "@/utils/format";
import type { ScheduleDay, ScheduleResponse } from "@/types";

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first

export function ScheduleEditor({ doctorId }: { doctorId: number }) {
  const toast = useToast();
  const { data, loading, error, refetch, setData } = useFetch<ScheduleResponse>(`/doctors/${doctorId}/schedule`);
  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [slot, setSlot] = useState(30);
  const [saving, setSaving] = useState(false);
  const [off, setOff] = useState({ date: "", reason: "" });
  const [addingOff, setAddingOff] = useState(false);

  useEffect(() => {
    if (data) {
      setDays(data.days.map((d) => ({ ...d, blocks: d.blocks.map((b) => ({ ...b })) })));
      setSlot(data.slotDuration);
    }
  }, [data]);

  const day = (dow: number) => days.find((d) => d.dayOfWeek === dow) ?? { dayOfWeek: dow, blocks: [] };
  const update = (dow: number, fn: (d: ScheduleDay) => ScheduleDay) => setDays((list) => list.map((d) => (d.dayOfWeek === dow ? fn(d) : d)));

  async function save() {
    for (const d of days) {
      for (const b of d.blocks) if (b.startTime >= b.endTime) return toast.error(`${DAY_NAMES[d.dayOfWeek]}: end time must be after start time.`);
    }
    setSaving(true);
    try {
      const res = await put<ScheduleResponse>(`/doctors/${doctorId}/schedule`, { slotDuration: slot, days });
      setData(res);
      toast.success("Availability saved. New bookings will follow this schedule.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function addOff() {
    if (!off.date) return toast.error("Choose a date first.");
    setAddingOff(true);
    try {
      const res = await post<ScheduleResponse>(`/doctors/${doctorId}/unavailable`, { date: off.date, reason: off.reason || null });
      setData({ ...res, days: data?.days ?? res.days });
      setOff({ date: "", reason: "" });
      toast.success("Date blocked. No slots will be offered on that day.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setAddingOff(false);
    }
  }

  async function removeOff(id: number) {
    try {
      const res = await del<ScheduleResponse>(`/doctors/${doctorId}/unavailable`, { id });
      setData({ ...res, days: data?.days ?? res.days });
      toast.success("Date is bookable again.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (loading && !data) return <Skeleton className="h-[520px]" />;

  return (
    <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <div className="panel flex flex-wrap items-end justify-between gap-5 p-6">
          <div>
            <h2 className="font-serif text-2xl">Working days & hours</h2>
            <p className="mt-1 text-sm text-fog">Toggle the days you consult and set one or more blocks (e.g. before and after lunch).</p>
          </div>
          <Select label="Slot interval" value={slot} onChange={(e) => setSlot(Number(e.target.value))} className="w-44">
            {[10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>Every {m} minutes</option>)}
          </Select>
        </div>

        {ORDER.map((dow) => {
          const d = day(dow);
          const active = d.blocks.length > 0;
          return (
            <div key={dow} className={clsx("panel p-5 transition", active ? "border-mint-400/20" : "opacity-80")}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Toggle label={`Work on ${DAY_NAMES[dow]}`} checked={active} onChange={(on) => update(dow, (x) => ({ ...x, blocks: on ? [{ startTime: "09:00", endTime: "17:00" }] : [] }))} />
                  <span className="font-medium">{DAY_NAMES[dow]}</span>
                </div>
                {active ? (
                  d.blocks.length < 4 && (
                    <button type="button" onClick={() => update(dow, (x) => {
                      const last = x.blocks[x.blocks.length - 1];
                      const start = last ? last.endTime : "09:00";
                      const end = start >= "18:00" ? "20:00" : "18:00";
                      return { ...x, blocks: [...x.blocks, { startTime: start, endTime: end > start ? end : "23:00" }] };
                    })} className="inline-flex items-center gap-1.5 text-xs text-mint-300 hover:underline"><Plus className="h-3.5 w-3.5" /> Add block</button>
                  )
                ) : <span className="text-sm text-fog-dark">Day off</span>}
              </div>
              {active && (
                <div className="mt-4 space-y-3">
                  {d.blocks.map((b, i) => (
                    <div key={i} className="flex flex-wrap items-end gap-3">
                      <Input label={i === 0 ? "From" : undefined} aria-label="Start time" type="time" value={b.startTime} onChange={(e) => update(dow, (x) => ({ ...x, blocks: x.blocks.map((y, j) => (j === i ? { ...y, startTime: e.target.value } : y)) }))} className="w-36" />
                      <Input label={i === 0 ? "To" : undefined} aria-label="End time" type="time" value={b.endTime} onChange={(e) => update(dow, (x) => ({ ...x, blocks: x.blocks.map((y, j) => (j === i ? { ...y, endTime: e.target.value } : y)) }))} className="w-36" />
                      <button type="button" aria-label="Remove block" onClick={() => update(dow, (x) => ({ ...x, blocks: x.blocks.filter((_, j) => j !== i) }))} className="mb-1 rounded-full p-2.5 text-fog transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="sticky bottom-4 z-10 flex justify-end">
          <Button size="lg" onClick={save} loading={saving} icon={<Save className="h-4 w-4" />}>Save availability</Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="panel p-6">
          <h2 className="flex items-center gap-3 font-serif text-2xl"><CalendarOff className="h-5 w-5 text-mint-400" /> Unavailable dates</h2>
          <p className="mt-1 text-sm text-fog">Block holidays, leave or training days. No slots will be shown on these dates.</p>
          <div className="mt-5 space-y-3">
            <Input label="Date" type="date" min={new Date().toISOString().slice(0, 10)} value={off.date} onChange={(e) => setOff({ ...off, date: e.target.value })} />
            <Input label="Reason (optional)" value={off.reason} onChange={(e) => setOff({ ...off, reason: e.target.value })} placeholder="e.g. Annual leave" />
            <Button variant="outline" onClick={addOff} loading={addingOff} icon={<Plus className="h-4 w-4" />}>Block date</Button>
          </div>
          <ul className="mt-6 divide-y divide-fg/[0.07]">
            {data?.unavailableDates.length === 0 && <li className="py-6 text-center text-sm text-fog-dark">No blocked dates.</li>}
            {data?.unavailableDates.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3.5">
                <span><span className="block text-sm">{formatDate(u.date, "long")}</span>{u.reason && <span className="text-xs text-fog">{u.reason}</span>}</span>
                <button onClick={() => removeOff(u.id)} aria-label={`Remove ${u.date}`} className="rounded-full p-2 text-fog transition hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
