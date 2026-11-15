"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { useFetch } from "@/hooks/useFetch";
import { formatDate, formatMoney, formatTime } from "@/utils/format";
import { IconArrowUpRight } from "./icons";
import { SiteImg } from "./ui";

type Offer = { doctor: { id: number; name: string; specialization: string; photoUrl: string | null }; date: string; slots: string[] };
type Next = { treatment: { id: number; name: string; price: number; durationMinutes: number }; offers: Offer[] };

/**
 * Live "next available appointments" – reads real availability from the booking engine and deep-links each time
 * straight into the patient booking flow (doctor, treatment, date and time pre-selected).
 */
export function QuickBook({ treatments, doctorId, className }: { treatments: { id: number; name: string }[]; doctorId?: number; className?: string }) {
  const [tid, setTid] = useState<number | undefined>(treatments[0]?.id);
  const { data, loading, error, refetch } = useFetch<Next>(tid ? "/availability/next" : null, { treatmentId: tid, doctorId, limit: 3 });
  if (treatments.length === 0) return null;
  const calendar = `/dashboard/book?treatmentId=${tid}${doctorId ? `&doctorId=${doctorId}` : ""}`;

  return (
    <div className={clsx("rounded-[var(--radius-panel)] bg-sand p-5 md:p-10", className)}>
      {treatments.length > 1 && (
        <div className="no-scrollbar -mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Choose a treatment">
          {treatments.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tid === t.id}
              onClick={() => setTid(t.id)}
              className={clsx("shrink-0 rounded-full border px-4 py-2.5 text-[0.82rem] font-medium transition-colors duration-300", tid === t.id ? "border-espresso bg-espresso text-cream" : "border-line text-espresso hover:border-espresso/50 hover:bg-card/60")}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <div className="rounded-[var(--radius-card)] bg-card p-8 text-center">
          <p className="text-sm text-muted">{error}</p>
          <button type="button" onClick={refetch} className="mt-4 text-sm text-espresso underline decoration-line underline-offset-4">Try again</button>
        </div>
      ) : loading && !data ? (
        <div className="grid gap-3 md:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-56 rounded-[var(--radius-card)]" />)}</div>
      ) : data && data.offers.length === 0 ? (
        <div className="rounded-[var(--radius-card)] bg-card p-10 text-center">
          <p className="font-serif text-2xl">No online times in the next few weeks</p>
          <p className="mt-2 text-sm text-muted">Send us a request and the care team will find a time for you.</p>
          <Link href="/contact#book" className="mt-5 inline-block text-sm text-espresso underline decoration-line underline-offset-4">Request a consultation</Link>
        </div>
      ) : (
        <div className={clsx("grid gap-3 transition-opacity duration-300 md:grid-cols-3", loading && "opacity-60")}>
          {data?.offers.map((o) => (
            <div key={o.doctor.id} className="flex flex-col rounded-[var(--radius-card)] bg-card p-5">
              <div className="flex items-center gap-3.5">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-full"><SiteImg src={o.doctor.photoUrl ?? undefined} className="object-top" /></span>
                <div className="min-w-0">
                  <Link href={`/doctors/${o.doctor.id}`} className="block truncate font-medium hover:text-bronze">{o.doctor.name}</Link>
                  <p className="truncate text-xs text-muted">{o.doctor.specialization}</p>
                </div>
              </div>
              <p className="mt-5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted">Next available</p>
              <p className="mt-1 font-serif text-[1.35rem] leading-tight">{formatDate(o.date, "long")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {o.slots.map((s) => (
                  <Link
                    key={s}
                    href={`/dashboard/book?doctorId=${o.doctor.id}&treatmentId=${tid}&date=${o.date}&time=${s}`}
                    className="rounded-full border border-line px-3.5 py-2 text-[0.82rem] font-medium text-espresso transition-colors duration-300 hover:border-espresso hover:bg-espresso hover:text-cream"
                  >
                    {formatTime(s)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-7 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {data ? `${data.treatment.name} · ${data.treatment.durationMinutes} min · ${formatMoney(data.treatment.price)}` : " "}
          <span className="hidden sm:inline"> — free cancellation up to 2 hours before.</span>
        </p>
        <Link href={calendar} className="inline-flex items-center gap-1.5 text-espresso underline decoration-line underline-offset-4 hover:decoration-espresso">
          Browse the full calendar <IconArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}
