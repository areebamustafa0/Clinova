"use client";

import { useEffect, useState } from "react";
import { CalendarDays, FilterX, Search } from "lucide-react";
import { AppointmentList, useAppointmentActions } from "@/components/appointments/Appointments";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/Feedback";
import { useFetch } from "@/hooks/useFetch";
import type { Appointment, Doctor } from "@/types";

const empty = { from: "", to: "", doctorId: "", status: "", q: "" };

export default function AdminAppointmentsPage() {
  const [f, setF] = useState(empty);
  const [q, setQ] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setQ(f.q.trim()), 300);
    return () => clearTimeout(id);
  }, [f.q]);

  const doctors = useFetch<Doctor[]>("/doctors", { all: 1 });
  const { data, loading, error, refetch } = useFetch<Appointment[]>("/appointments", {
    from: f.from || undefined, to: f.to || undefined, doctorId: f.doctorId || undefined, status: f.status || undefined, search: q || undefined, order: "desc", limit: 500,
  });
  const { actions, dialogs } = useAppointmentActions("admin", refetch);
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const dirty = JSON.stringify(f) !== JSON.stringify(empty);

  return (
    <>
      <PageHeader title="Appointments" subtitle="Every booking across the clinic. Confirm, cancel or reschedule on behalf of patients and doctors." />
      <div className="panel mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Input label="Patient / reference / treatment" value={f.q} onChange={set("q")} placeholder="Search…" className="[&_input]:pl-11" />
          <Search className="pointer-events-none absolute left-4 top-[43px] h-4 w-4 text-fog" />
        </div>
        <Select label="Doctor" value={f.doctorId} onChange={set("doctorId")}>
          <option value="">All doctors</option>
          {doctors.data?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Select label="Status" value={f.status} onChange={set("status")}>
          <option value="">All statuses</option>
          {["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"].map((s) => <option key={s} value={s}>{s.replace("_", " ").replace(/^./, (c) => c.toUpperCase())}</option>)}
        </Select>
        <Input label="From" type="date" value={f.from} onChange={set("from")} />
        <Input label="To" type="date" value={f.to} min={f.from || undefined} onChange={set("to")} />
        {dirty && <div className="sm:col-span-2 lg:col-span-6"><Button variant="ghost" size="sm" icon={<FilterX className="h-4 w-4" />} onClick={() => setF(empty)}>Clear filters</Button></div>}
      </div>
      <p className="mb-4 text-sm text-fog">{data ? `${data.length} appointment${data.length === 1 ? "" : "s"}` : "Loading…"}</p>
      <AppointmentList items={data} role="admin" actions={actions} loading={loading} error={error} onRetry={refetch}
        empty={<EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No appointments match" message="Adjust or clear the filters to see more." action={dirty ? <Button variant="outline" onClick={() => setF(empty)}>Clear filters</Button> : undefined} />} />
      {dialogs}
    </>
  );
}
