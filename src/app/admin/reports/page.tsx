"use client";

import { useState } from "react";
import clsx from "clsx";
import { PageHeader } from "@/components/layout/DashboardShell";
import { BarChart, Donut, HBars, type Point } from "@/components/ui/Charts";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { Img } from "@/components/ui/Media";
import { useFetch } from "@/hooks/useFetch";
import { formatMoney } from "@/utils/format";

type Reports = {
  daily: Point[]; weekly: Point[]; monthly: Point[];
  statusBreakdown: { status: string; count: number }[];
  popularTreatments: { id: number; name: string; category: string; count: number; revenue: number }[];
  doctorStats: { id: number; name: string; specialization: string; photoUrl: string | null; total: number; completed: number; cancelled: number; upcoming: number; revenue: number }[];
};

const colors: Record<string, string> = { pending: "#d9a441", confirmed: "#b0824f", completed: "#7dd3fc", cancelled: "#fb7185", rejected: "#f43f5e", no_show: "#a1a1aa" };
const ranges = [{ key: "daily", label: "Daily", sub: "Last 14 days" }, { key: "weekly", label: "Weekly", sub: "Last 8 weeks" }, { key: "monthly", label: "Monthly", sub: "Last 6 months" }] as const;

export default function AdminReportsPage() {
  const { data, loading, error, refetch } = useFetch<Reports>("/reports/appointments");
  const [range, setRange] = useState<(typeof ranges)[number]["key"]>("daily");

  if (error) return <ErrorState message={error} onRetry={refetch} />;
  const current = ranges.find((r) => r.key === range)!;

  return (
    <>
      <PageHeader title="Reports" subtitle="Appointment volume, treatment popularity and doctor performance — calculated live from the database." />
      {loading && !data ? <Skeleton className="h-[600px]" /> : data && (
        <div className="space-y-6">
          <div className="panel p-6 sm:p-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div><h2 className="font-serif text-2xl">{current.label} appointments</h2><p className="text-sm text-fog">{current.sub}</p></div>
              <div className="inline-flex rounded-full border border-fg/10 bg-fg/[0.03] p-1" role="tablist">
                {ranges.map((r) => <button key={r.key} role="tab" aria-selected={range === r.key} onClick={() => setRange(r.key)} className={clsx("rounded-full px-5 py-2 text-sm transition", range === r.key ? "bg-mint-400 font-medium text-on-accent" : "text-fg/70 hover:text-fg")}>{r.label}</button>)}
              </div>
            </div>
            <BarChart data={data[range]} height={260} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="panel p-6 sm:p-8">
              <h2 className="mb-8 font-serif text-2xl">Appointment status breakdown</h2>
              <Donut segments={data.statusBreakdown.map((x) => ({ label: x.status.replace("_", " ").replace(/^./, (c) => c.toUpperCase()), value: x.count, color: colors[x.status] ?? "#888" }))} />
            </div>
            <div className="panel p-6 sm:p-8">
              <h2 className="mb-8 font-serif text-2xl">Most popular treatments</h2>
              <HBars items={data.popularTreatments.map((t) => ({ label: t.name, sub: t.category, value: t.count }))} />
            </div>
          </div>

          <div className="panel p-6 sm:p-8">
            <h2 className="mb-6 font-serif text-2xl">Doctor appointment statistics</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.14em] text-fog"><tr>{["Doctor", "Total", "Completed", "Upcoming", "Cancelled", "Revenue"].map((h) => <th key={h} className="pb-4 pr-4 font-medium">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-fg/[0.06]">
                  {data.doctorStats.map((d) => (
                    <tr key={d.id}>
                      <td className="py-3.5 pr-4"><div className="flex items-center gap-3"><Img src={d.photoUrl} alt="" label={d.name} className="h-10 w-10 rounded-full object-cover object-top text-xs" /><div><p className="font-medium">{d.name}</p><p className="text-xs text-fog">{d.specialization}</p></div></div></td>
                      <td className="py-3.5 pr-4">{d.total}</td>
                      <td className="py-3.5 pr-4 text-sky-300">{d.completed}</td>
                      <td className="py-3.5 pr-4 text-mint-300">{d.upcoming}</td>
                      <td className="py-3.5 pr-4 text-rose-300">{d.cancelled}</td>
                      <td className="py-3.5 pr-4">{formatMoney(d.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel p-6 sm:p-8">
            <h2 className="mb-6 font-serif text-2xl">Revenue by treatment <span className="text-sm text-fog">(completed visits)</span></h2>
            <HBars items={[...data.popularTreatments].sort((a, b) => b.revenue - a.revenue).map((t) => ({ label: t.name, value: t.revenue }))} format={formatMoney} />
          </div>
        </div>
      )}
    </>
  );
}
