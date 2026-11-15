"use client";

import Link from "next/link";
import { Activity, CalendarCheck, CheckCircle2, Clock, DollarSign, Stethoscope, Users, XCircle } from "lucide-react";
import { AppointmentList, useAppointmentActions } from "@/components/appointments/Appointments";
import { PageHeader, StatCard } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { AreaChart, Donut } from "@/components/ui/Charts";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { useFetch } from "@/hooks/useFetch";
import { formatMoney } from "@/utils/format";
import type { Appointment } from "@/types";
import type { Point } from "@/components/ui/Charts";

type Stats = {
  patients: number; doctors: number; treatments: number; unreadMessages: number;
  appointments: { total: number; pending: number; confirmed: number; completed: number; cancelled: number; today: number; upcoming: number; revenue: number; projected: number };
};
type Reports = { daily: Point[]; statusBreakdown: { status: string; count: number }[] };

const statusColors: Record<string, string> = { pending: "#d9a441", confirmed: "#b0824f", completed: "#7dd3fc", cancelled: "#fb7185", rejected: "#f43f5e", no_show: "#a1a1aa" };

export default function AdminOverview() {
  const stats = useFetch<Stats>("/reports/stats");
  const reports = useFetch<Reports>("/reports/appointments");
  const pending = useFetch<Appointment[]>("/appointments", { status: "pending", from: new Date().toLocaleDateString("en-CA"), limit: 6 });
  const { actions, dialogs } = useAppointmentActions("admin", () => { stats.refetch(); reports.refetch(); pending.refetch(); });
  const s = stats.data;

  if (stats.error) return <ErrorState message={stats.error} onRetry={stats.refetch} />;

  return (
    <>
      <PageHeader title="Clinic overview" subtitle="Live numbers from the appointment system." actions={<Button href="/admin/reports" variant="outline" icon={<Activity className="h-4 w-4" />}>Full reports</Button>} />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {!s ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-36" />) : (
          <>
            <StatCard label="Total patients" value={s.patients} icon={Users} />
            <StatCard label="Active doctors" value={s.doctors} icon={Stethoscope} tone="sky" />
            <StatCard label="Total appointments" value={s.appointments.total} icon={CalendarCheck} hint={`${s.appointments.today} today · ${s.appointments.upcoming} upcoming`} />
            <StatCard label="Pending" value={s.appointments.pending} icon={Clock} tone="amber" hint="Awaiting confirmation" />
            <StatCard label="Completed" value={s.appointments.completed} icon={CheckCircle2} tone="sky" />
            <StatCard label="Cancelled" value={s.appointments.cancelled} icon={XCircle} tone="rose" hint="Including rejected" />
            <StatCard label="Revenue (completed)" value={formatMoney(s.appointments.revenue)} icon={DollarSign} />
            <StatCard label="Projected" value={formatMoney(s.appointments.projected)} icon={DollarSign} tone="amber" hint="Pending & confirmed bookings" />
          </>
        )}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="panel p-6 sm:p-8">
          <h2 className="font-serif text-2xl">Appointments · last 14 days</h2>
          <div className="mt-6">{reports.data ? <AreaChart data={reports.data.daily} /> : <Skeleton className="h-56" />}</div>
        </div>
        <div className="panel p-6 sm:p-8">
          <h2 className="mb-6 font-serif text-2xl">Status breakdown</h2>
          {reports.data ? <Donut segments={reports.data.statusBreakdown.map((x) => ({ label: x.status.replace("_", " ").replace(/^./, (c) => c.toUpperCase()), value: x.count, color: statusColors[x.status] ?? "#888" }))} size={150} /> : <Skeleton className="h-40" />}
        </div>
      </div>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-3xl">Needs attention</h2>
          <Link href="/admin/appointments" className="text-sm text-mint-300 hover:underline">All appointments</Link>
        </div>
        <AppointmentList items={pending.data} role="admin" actions={actions} loading={pending.loading} error={pending.error} onRetry={pending.refetch} />
      </section>
      {dialogs}
    </>
  );
}
