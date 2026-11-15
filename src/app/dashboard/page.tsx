"use client";

import Link from "next/link";
import { ArrowRight, CalendarCheck, CalendarClock, CalendarPlus, CheckCircle2, Clock, XCircle } from "lucide-react";
import { AppointmentList, useAppointmentActions } from "@/components/appointments/Appointments";
import { PageHeader, StatCard } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { Img } from "@/components/ui/Media";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { formatDate, formatTime } from "@/utils/format";
import type { Appointment, Summary } from "@/types";

export default function PatientOverview() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString("en-CA");
  const summary = useFetch<Summary>("/appointments/summary");
  const upcoming = useFetch<Appointment[]>("/appointments", { status: "pending,confirmed", from: today, limit: 4 });
  const { actions, dialogs } = useAppointmentActions("patient", () => { summary.refetch(); upcoming.refetch(); });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const next = upcoming.data?.[0];
  const s = summary.data;

  return (
    <>
      <PageHeader title={`${greeting}, ${user?.firstName}`} subtitle="Here's an overview of your care at Clinova." actions={<Button href="/dashboard/book" icon={<CalendarPlus className="h-4 w-4" />}>Book appointment</Button>} />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summary.loading && !s ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />) : (
          <>
            <StatCard label="Total appointments" value={s?.total ?? 0} icon={CalendarCheck} />
            <StatCard label="Upcoming" value={s?.upcoming ?? 0} icon={CalendarClock} tone="amber" hint={s?.pending ? `${s.pending} awaiting confirmation` : undefined} />
            <StatCard label="Completed" value={s?.completed ?? 0} icon={CheckCircle2} tone="sky" />
            <StatCard label="Cancelled" value={s?.cancelled ?? 0} icon={XCircle} tone="rose" />
          </>
        )}
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div data-scheme="dark" className="relative overflow-hidden rounded-3xl border border-mint-400/20 bg-gradient-to-br from-teal-deeper/70 via-ink-800 to-ink-900 p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-mint-400/15 blur-3xl" />
          <p className="eyebrow relative text-mint-300">Next appointment</p>
          {upcoming.loading && !next ? <Skeleton className="relative mt-6 h-32" /> : next ? (
            <div className="relative mt-6">
              <div className="flex items-center gap-4">
                <Img src={next.doctor.photoUrl} alt={next.doctor.name} label={next.doctor.name} className="h-16 w-16 rounded-full object-cover object-top" />
                <div>
                  <p className="font-serif text-2xl">{next.treatment.name}</p>
                  <p className="text-sm text-fog">with {next.doctor.name}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-mint-400" />{formatDate(next.date, "long")}</span>
                <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-mint-400" />{formatTime(next.startTime)}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="sm" variant="outline" onClick={() => actions.view(next)}>View details</Button>
                <Button size="sm" variant="ghost" onClick={() => actions.reschedule(next)}>Request reschedule</Button>
              </div>
            </div>
          ) : (
            <div className="relative mt-6">
              <p className="font-serif text-2xl">Nothing scheduled yet</p>
              <p className="mt-2 text-sm text-fog">Book a treatment with one of our specialists in under two minutes.</p>
              <Button href="/dashboard/book" className="mt-6" iconRight={<ArrowRight className="h-4 w-4" />}>Book now</Button>
            </div>
          )}
        </div>

        <div className="panel p-8">
          <p className="eyebrow text-mint-400">Quick actions</p>
          <ul className="mt-5 divide-y divide-fg/[0.07]">
            {[
              ["/dashboard/book", "Book a new appointment", "Choose a treatment, doctor and time"],
              ["/dashboard/appointments", "Manage my appointments", "View, cancel or reschedule"],
              ["/treatments", "Explore treatments", "Browse the full menu"],
              ["/dashboard/profile", "Update my details", "Phone, address and password"],
            ].map(([href, title, sub]) => (
              <li key={href}>
                <Link href={href} className="group flex items-center justify-between py-4">
                  <span><span className="block text-sm font-medium">{title}</span><span className="text-xs text-fog">{sub}</span></span>
                  <ArrowRight className="h-4 w-4 text-fog-dark transition group-hover:translate-x-1 group-hover:text-mint-400" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-3xl">Upcoming appointments</h2>
          <Link href="/dashboard/appointments" className="text-sm text-mint-300 hover:underline">View all</Link>
        </div>
        <AppointmentList items={upcoming.data} role="patient" actions={actions} loading={upcoming.loading} error={upcoming.error} onRetry={upcoming.refetch}
          empty={<EmptyState icon={<CalendarPlus className="h-6 w-6" />} title="No upcoming appointments" message="When you book, your appointments will appear here." action={<Button href="/dashboard/book">Book appointment</Button>} />} />
      </section>
      {dialogs}
    </>
  );
}
