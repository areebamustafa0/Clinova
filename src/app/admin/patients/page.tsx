"use client";

import { useEffect, useState } from "react";
import { Eye, Power, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton, StatusBadge } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/hooks/useFetch";
import { errorMessage, patch } from "@/lib/http";
import { formatDate, formatMoney, formatTime } from "@/utils/format";
import type { PatientRecord } from "@/types";

function PatientModal({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data: p, loading, error } = useFetch<PatientRecord>(id ? `/patients/${id}` : null);
  return (
    <Modal open={!!id} onClose={onClose} size="lg" title={p?.name ?? "Patient"} description={p ? `Patient since ${formatDate(p.createdAt.slice(0, 10), "medium")}` : undefined}>
      {loading && !p ? <Skeleton className="h-64" /> : error || !p ? <ErrorState message={error ?? "Not found"} /> : (
        <div className="space-y-8">
          <dl className="grid gap-5 text-sm sm:grid-cols-2">
            {[["Email", p.email], ["Phone", p.phone ?? "—"], ["Date of birth", p.dateOfBirth ? formatDate(p.dateOfBirth, "long") : "—"], ["Gender", p.gender?.replace(/_/g, " ") ?? "—"], ["Address", p.address ?? "—"], ["Emergency contact", p.emergencyContact ?? "—"], ["Account", p.isActive ? "Active" : "Deactivated"], ["Last completed visit", p.lastVisit ? formatDate(p.lastVisit, "medium") : "—"]].map(([k, v]) => (
              <div key={k}><dt className="text-[11px] uppercase tracking-[0.16em] text-fog-dark">{k}</dt><dd className="mt-1.5">{v}</dd></div>
            ))}
          </dl>
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-fog-dark">Appointments ({p.appointments?.length ?? 0})</p>
            <ul className="divide-y divide-fg/[0.06] rounded-2xl border border-fg/[0.08]">
              {p.appointments?.length === 0 && <li className="p-6 text-center text-sm text-fog">No appointments yet.</li>}
              {p.appointments?.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
                  <span><span className="font-medium">{a.treatment.name}</span><span className="block text-xs text-fog">{a.doctor.name} · {formatDate(a.date, "medium")} · {formatTime(a.startTime)} · {formatMoney(a.price)}</span></span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminPatientsPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => { const id = setTimeout(() => setSearch(q.trim()), 300); return () => clearTimeout(id); }, [q]);
  const { data, loading, error, refetch } = useFetch<PatientRecord[]>("/patients", { search: search || undefined });
  const [view, setView] = useState<number | null>(null);

  async function toggle(p: PatientRecord) {
    try {
      await patch(`/patients/${p.id}`, { isActive: !p.isActive });
      toast.success(p.isActive ? `${p.name}'s account deactivated.` : `${p.name}'s account reactivated.`);
      refetch();
    } catch (e) { toast.error(errorMessage(e)); }
  }

  return (
    <>
      <PageHeader title="Patients" subtitle="Search patients, review their history and manage account access." />
      <div className="relative mb-6 sm:w-96">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or phone…" aria-label="Search patients" className="h-11 w-full rounded-full border border-fg/10 bg-fg/[0.04] pl-11 pr-4 text-sm placeholder:text-fog-dark focus:border-mint-400/60 focus:outline-none" />
      </div>
      {error ? <ErrorState message={error} onRetry={refetch} /> : loading && !data ? <Skeleton className="h-96" /> : data && data.length === 0 ? <EmptyState icon={<Users className="h-6 w-6" />} title="No patients found" message="Try a different search." /> : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-fg/[0.08] md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-fg/[0.03] text-[11px] uppercase tracking-[0.14em] text-fog"><tr>{["Patient", "Contact", "Appointments", "Last visit", "Status", "Actions"].map((h) => <th key={h} className="px-5 py-4 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-fg/[0.06]">
                {data?.map((p) => (
                  <tr key={p.id} className="hover:bg-fg/[0.025]">
                    <td className="px-5 py-4 font-medium">{p.name}</td>
                    <td className="px-5 py-4"><p>{p.email}</p><p className="text-xs text-fog">{p.phone}</p></td>
                    <td className="px-5 py-4">{p.appointmentCount}</td>
                    <td className="px-5 py-4 text-fog">{p.lastVisit ? formatDate(p.lastVisit, "short") : "—"}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${p.isActive ? "bg-mint-400/10 text-mint-300" : "bg-zinc-500/20 text-zinc-300"}`}>{p.isActive ? "Active" : "Inactive"}</span></td>
                    <td className="px-5 py-4"><div className="flex gap-2"><Button size="sm" variant="subtle" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => setView(p.id)}>View</Button><Button size="sm" variant="ghost" icon={<Power className="h-3.5 w-3.5" />} onClick={() => toggle(p)}>{p.isActive ? "Deactivate" : "Activate"}</Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-4 md:hidden">
            {data?.map((p) => (
              <li key={p.id} className="panel p-5">
                <p className="font-medium">{p.name}</p><p className="text-sm text-fog">{p.email}</p><p className="text-sm text-fog">{p.phone}</p>
                <p className="mt-3 text-xs text-fog-dark">{p.appointmentCount} appointments · {p.isActive ? "Active" : "Inactive"}</p>
                <div className="mt-4 flex gap-2"><Button size="sm" variant="subtle" onClick={() => setView(p.id)}>View</Button><Button size="sm" variant="ghost" onClick={() => toggle(p)}>{p.isActive ? "Deactivate" : "Activate"}</Button></div>
              </li>
            ))}
          </ul>
        </>
      )}
      <PatientModal id={view} onClose={() => setView(null)} />
    </>
  );
}
