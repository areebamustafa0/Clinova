"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { CalendarPlus, Search } from "lucide-react";
import { AppointmentList, useAppointmentActions } from "@/components/appointments/Appointments";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { useFetch } from "@/hooks/useFetch";
import type { Appointment } from "@/types";

const tabs = [
  { key: "upcoming", label: "Upcoming" },
  { key: "history", label: "History" },
  { key: "all", label: "All" },
] as const;

export default function MyAppointmentsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("upcoming");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const today = new Date().toLocaleDateString("en-CA");
  const params =
    tab === "upcoming" ? { status: "pending,confirmed", from: today, order: "asc" }
    : tab === "history" ? { status: "completed,cancelled,rejected,no_show", order: "desc" }
    : { order: "desc" };
  const { data, loading, error, refetch } = useFetch<Appointment[]>("/appointments", { ...params, search: search || undefined });
  const { actions, dialogs } = useAppointmentActions("patient", refetch);

  return (
    <>
      <PageHeader title="My appointments" subtitle="View details, request a new time or cancel — your history is always here." actions={<Button href="/dashboard/book" icon={<CalendarPlus className="h-4 w-4" />}>Book appointment</Button>} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full border border-fg/10 bg-fg/[0.03] p-1" role="tablist">
          {tabs.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={clsx("rounded-full px-5 py-2 text-sm transition", tab === t.key ? "bg-mint-400 font-medium text-on-accent" : "text-fg/70 hover:text-fg")}>{t.label}</button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, doctor, treatment…" aria-label="Search appointments" className="h-11 w-full rounded-full border border-fg/10 bg-fg/[0.04] pl-11 pr-4 text-sm placeholder:text-fog-dark focus:border-mint-400/60 focus:outline-none" />
        </div>
      </div>
      <AppointmentList items={data} role="patient" actions={actions} loading={loading} error={error} onRetry={refetch}
        empty={<EmptyState icon={<CalendarPlus className="h-6 w-6" />} title={tab === "upcoming" ? "No upcoming appointments" : "No appointments found"} message={search ? "Try a different search term." : "Book your first appointment to get started."} action={<Button href="/dashboard/book">Book appointment</Button>} />} />
      {dialogs}
    </>
  );
}
