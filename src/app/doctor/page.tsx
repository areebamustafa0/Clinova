"use client";

import Link from "next/link";
import { CalendarCheck, CalendarClock, CalendarDays, CheckCircle2, Inbox } from "lucide-react";
import { AppointmentList, useAppointmentActions } from "@/components/appointments/Appointments";
import { PageHeader, StatCard } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import type { Appointment, Summary } from "@/types";

export default function DoctorOverview() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString("en-CA");
  const summary = useFetch<Summary>("/appointments/summary");
  const todayList = useFetch<Appointment[]>("/appointments", { from: today, to: today, status: "pending,confirmed,completed,no_show" });
  const pending = useFetch<Appointment[]>("/appointments", { status: "pending", from: today, limit: 6 });
  const { actions, dialogs } = useAppointmentActions("doctor", () => { summary.refetch(); todayList.refetch(); pending.refetch(); });
  const s = summary.data;

  return (
    <>
      <PageHeader title={`Welcome, Dr. ${user?.lastName}`} subtitle="Your day at a glance — confirm new requests and keep your schedule up to date." actions={<Button href="/doctor/schedule" variant="outline" icon={<CalendarClock className="h-4 w-4" />}>Manage availability</Button>} />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summary.loading && !s ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />) : (
          <>
            <StatCard label="Today" value={s?.today ?? 0} icon={CalendarDays} hint="Appointments scheduled today" />
            <StatCard label="Pending requests" value={s?.pending ?? 0} icon={Inbox} tone="amber" hint="Waiting for your response" />
            <StatCard label="Upcoming" value={s?.upcoming ?? 0} icon={CalendarCheck} tone="sky" />
            <StatCard label="Completed" value={s?.completed ?? 0} icon={CheckCircle2} />
          </>
        )}
      </div>

      <section className="mt-12">
        <h2 className="mb-5 font-serif text-3xl">Today&apos;s appointments</h2>
        <AppointmentList items={todayList.data} role="doctor" actions={actions} loading={todayList.loading} error={todayList.error} onRetry={todayList.refetch}
          empty={<EmptyState icon={<CalendarDays className="h-6 w-6" />} title="Nothing scheduled today" message="Enjoy the quiet — or check your pending requests below." />} />
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-3xl">Pending requests</h2>
          <Link href="/doctor/appointments" className="text-sm text-mint-300 hover:underline">All appointments</Link>
        </div>
        <AppointmentList items={pending.data} role="doctor" actions={actions} loading={pending.loading} error={pending.error} onRetry={pending.refetch}
          empty={<EmptyState icon={<Inbox className="h-6 w-6" />} title="You're all caught up" message="New appointment requests will appear here for you to accept or reject." />} />
      </section>
      {dialogs}
    </>
  );
}
