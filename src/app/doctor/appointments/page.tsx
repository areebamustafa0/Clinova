"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { CalendarDays, Search } from "lucide-react";
import { AppointmentList, useAppointmentActions } from "@/components/appointments/Appointments";
import { PageHeader } from "@/components/layout/DashboardShell";
import { EmptyState } from "@/components/ui/Feedback";
import { useFetch } from "@/hooks/useFetch";
import type { Appointment } from "@/types";

const tabs = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export default function DoctorAppointmentsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("today");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const today = new Date().toLocaleDateString("en-CA");
  const params: Record<string, string> =
    tab === "today" ? { from: today, to: today, status: "pending,confirmed,completed,no_show" }
    : tab === "upcoming" ? { from: today, status: "pending,confirmed" }
    : tab === "pending" ? { status: "pending", from: today }
    : tab === "completed" ? { status: "completed,no_show", order: "desc" }
    : { status: "cancelled,rejected", order: "desc" };
  const { data, loading, error, refetch } = useFetch<Appointment[]>("/appointments", { ...params, search: search || undefined });
  const { actions, dialogs } = useAppointmentActions("doctor", refetch);

  return (
    <>
      <PageHeader title="Appointments" subtitle="Accept or reject requests, update statuses and review patient details." />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-1 flex overflow-x-auto px-1" role="tablist">
          <div className="inline-flex rounded-full border border-fg/10 bg-fg/[0.03] p-1">
            {tabs.map((t) => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={clsx("whitespace-nowrap rounded-full px-5 py-2 text-sm transition", tab === t.key ? "bg-mint-400 font-medium text-on-accent" : "text-fg/70 hover:text-fg")}>{t.label}</button>
            ))}
          </div>
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patient, ID, treatment…" aria-label="Search appointments" className="h-11 w-full rounded-full border border-fg/10 bg-fg/[0.04] pl-11 pr-4 text-sm placeholder:text-fog-dark focus:border-mint-400/60 focus:outline-none" />
        </div>
      </div>
      <AppointmentList items={data} role="doctor" actions={actions} loading={loading} error={error} onRetry={refetch}
        empty={<EmptyState icon={<CalendarDays className="h-6 w-6" />} title={`No ${tab} appointments`} message={search ? "Try a different search term." : "They'll show up here as patients book with you."} />} />
      {dialogs}
    </>
  );
}
