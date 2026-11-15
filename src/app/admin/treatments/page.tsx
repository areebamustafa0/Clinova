"use client";

import { useEffect, useState, type FormEvent } from "react";
import clsx from "clsx";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { Input, Textarea, Toggle } from "@/components/ui/Form";
import { Img } from "@/components/ui/Media";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/hooks/useFetch";
import { del, errorMessage, fieldErrors, patch, post } from "@/lib/http";
import { formatMoney } from "@/utils/format";
import type { Doctor, Treatment } from "@/types";

type Form = { durationLabel: string; sessions: string; downtime: string; tagline: string; name: string; category: string; description: string; durationMinutes: string; price: string; imageUrl: string; isFeatured: boolean; isActive: boolean; doctorIds: number[] };
const blank: Form = { durationLabel: "", sessions: "", downtime: "", tagline: "", name: "", category: "", description: "", durationMinutes: "30", price: "100", imageUrl: "", isFeatured: false, isActive: true, doctorIds: [] };

function TreatmentModal({ treatment, open, onClose, onSaved, categories }: { treatment: Treatment | null; open: boolean; onClose: () => void; onSaved: () => void; categories: string[] }) {
  const toast = useToast();
  const doctors = useFetch<Doctor[]>(open ? "/doctors" : null);
  const [f, setF] = useState<Form>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setF(treatment ? { durationLabel: treatment.durationLabel ?? "", sessions: treatment.sessions ?? "", downtime: treatment.downtime ?? "", tagline: treatment.tagline ?? "", name: treatment.name, category: treatment.category, description: treatment.description, durationMinutes: String(treatment.durationMinutes), price: String(treatment.price), imageUrl: treatment.imageUrl ?? "", isFeatured: treatment.isFeatured, isActive: treatment.isActive, doctorIds: treatment.doctors.map((d) => d.id) } : blank);
  }, [open, treatment]);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (f.name.trim().length < 2) local.name = "Name is required";
    if (f.category.trim().length < 2) local.category = "Category is required";
    if (f.description.trim().length < 10) local.description = "Add a short description (10+ characters)";
    if (!(Number(f.durationMinutes) >= 10)) local.durationMinutes = "At least 10 minutes";
    if (f.price === "" || Number(f.price) < 0) local.price = "Enter a price";
    setErrors(local);
    if (Object.keys(local).length) return;
    const body = { durationLabel: f.durationLabel.trim() || null, sessions: f.sessions.trim() || null, downtime: f.downtime.trim() || null, tagline: f.tagline.trim() || null, name: f.name.trim(), category: f.category.trim(), description: f.description.trim(), durationMinutes: Number(f.durationMinutes), price: Number(f.price), imageUrl: f.imageUrl.trim() || null, isFeatured: f.isFeatured, isActive: f.isActive, doctorIds: f.doctorIds };
    setBusy(true);
    try {
      if (treatment) await patch(`/treatments/${treatment.id}`, body);
      else await post("/treatments", body);
      toast.success(treatment ? "Treatment updated." : "Treatment created.");
      onSaved();
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={treatment ? "Edit treatment" : "Add treatment"}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="treatment-form" loading={busy}>{treatment ? "Save changes" : "Create treatment"}</Button></>}>
      <form id="treatment-form" onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
        <Input label="Name" required className="sm:col-span-2" value={f.name} onChange={set("name")} error={errors.name} />
        <div>
          <Input label="Category" required list="category-list" value={f.category} onChange={set("category")} error={errors.category} />
          <datalist id="category-list">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <Input label="Image URL" value={f.imageUrl} onChange={set("imageUrl")} placeholder="https://… or /images/treatments/…" />
        <Input label="Duration (minutes)" type="number" min={10} step={5} required value={f.durationMinutes} onChange={set("durationMinutes")} error={errors.durationMinutes} />
        <Input label="Price ($)" type="number" min={0} step="0.01" required value={f.price} onChange={set("price")} error={errors.price} />
        <Input label="Duration label" value={f.durationLabel} onChange={set("durationLabel")} placeholder="e.g. 30 – 60 min" />
        <Input label="Sessions" value={f.sessions} onChange={set("sessions")} placeholder="e.g. 3 – 6" />
        <Input label="Downtime" value={f.downtime} onChange={set("downtime")} placeholder="e.g. Minimal" />
        <Input label="Tagline" value={f.tagline} onChange={set("tagline")} placeholder="Concern · Concern · Concern" />
        <Textarea label="Description" required className="sm:col-span-2" rows={3} value={f.description} onChange={set("description")} error={errors.description} />
        <fieldset className="sm:col-span-2">
          <legend className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em] text-fog">Performed by</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {doctors.data?.map((d) => {
              const on = f.doctorIds.includes(d.id);
              return (
                <label key={d.id} className={clsx("flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition", on ? "border-mint-400/60 bg-mint-400/[0.07]" : "border-fg/10 hover:border-fg/25")}>
                  <input type="checkbox" className="h-4 w-4 accent-[var(--color-mint-400)]" checked={on} onChange={() => setF((s) => ({ ...s, doctorIds: on ? s.doctorIds.filter((x) => x !== d.id) : [...s.doctorIds, d.id] }))} />
                  <span>{d.name}<span className="block text-xs text-fog">{d.specialization}</span></span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center gap-8 sm:col-span-2">
          <label className="flex items-center gap-3 text-sm"><Toggle label="Featured on homepage" checked={f.isFeatured} onChange={(v) => setF({ ...f, isFeatured: v })} /> Featured on homepage</label>
          <label className="flex items-center gap-3 text-sm"><Toggle label="Active" checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })} /> Active (bookable)</label>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminTreatmentsPage() {
  const toast = useToast();
  const { data, meta, loading, error, refetch } = useFetch<Treatment[], { categories: string[] }>("/treatments", { all: 1 });
  const [editing, setEditing] = useState<Treatment | null>(null);
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState<Treatment | null>(null);
  const [busy, setBusy] = useState(false);

  async function doDelete() {
    if (!remove) return;
    setBusy(true);
    try {
      const res = await del<{ deleted: boolean }>(`/treatments/${remove.id}`);
      toast.success(res.deleted ? "Treatment deleted." : "Treatment has bookings, so it was deactivated instead.");
      setRemove(null);
      refetch();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Treatments" subtitle="Create and price the services patients can book." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setOpen(true); }}>Add treatment</Button>} />
      {error ? <ErrorState message={error} onRetry={refetch} /> : loading && !data ? <Skeleton className="h-96" /> : data && data.length === 0 ? <EmptyState title="No treatments yet" /> : (
        <div className="overflow-x-auto rounded-2xl border border-fg/[0.08]">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-fg/[0.03] text-[11px] uppercase tracking-[0.14em] text-fog"><tr>{["Treatment", "Category", "Duration", "Price", "Doctors", "Status", ""].map((h) => <th key={h} className="px-5 py-4 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-fg/[0.06]">
              {data?.map((t) => (
                <tr key={t.id} className="hover:bg-fg/[0.025]">
                  <td className="px-5 py-3.5"><div className="flex items-center gap-4"><Img src={t.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" /><div><p className="font-medium">{t.name}</p>{t.isFeatured && <span className="text-[10px] uppercase tracking-widest text-mint-400">Featured</span>}</div></div></td>
                  <td className="px-5 py-3.5 text-fog">{t.category}</td>
                  <td className="px-5 py-3.5">{t.durationMinutes} min</td>
                  <td className="px-5 py-3.5 text-mint-300">{formatMoney(t.price)}</td>
                  <td className="px-5 py-3.5">{t.doctors.length}</td>
                  <td className="px-5 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${t.isActive ? "bg-mint-400/10 text-mint-300" : "bg-zinc-500/20 text-zinc-300"}`}>{t.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-5 py-3.5"><div className="flex justify-end gap-2"><Button size="sm" variant="subtle" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { setEditing(t); setOpen(true); }}>Edit</Button><Button size="sm" variant="danger" aria-label={`Delete ${t.name}`} icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setRemove(t)}>Delete</Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <TreatmentModal treatment={editing} open={open} onClose={() => setOpen(false)} onSaved={refetch} categories={meta?.categories ?? []} />
      <ConfirmDialog open={!!remove} danger loading={busy} title="Delete this treatment?" confirmLabel="Delete" onClose={() => setRemove(null)} onConfirm={doDelete}
        message={`“${remove?.name ?? ""}” will be removed. If it already has bookings it is deactivated instead, so history is preserved.`} />
    </>
  );
}
