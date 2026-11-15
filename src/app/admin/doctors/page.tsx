"use client";

import { useEffect, useState, type FormEvent } from "react";
import clsx from "clsx";
import { CalendarClock, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { ScheduleEditor } from "@/components/schedule/ScheduleEditor";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { Input, Select, Textarea, Toggle } from "@/components/ui/Form";
import { Img } from "@/components/ui/Media";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/hooks/useFetch";
import { del, errorMessage, fieldErrors, patch, post } from "@/lib/http";
import { formatMoney } from "@/utils/format";
import type { Doctor, Treatment } from "@/types";

type Form = {
  firstName: string; lastName: string; email: string; phone: string; password: string; specializationId: string; newSpecialization: string;
  qualifications: string; experienceYears: string; consultationFee: string; slotDuration: string; photoUrl: string; bio: string; treatmentIds: number[]; isActive: boolean;
};
const blank: Form = { firstName: "", lastName: "", email: "", phone: "", password: "", specializationId: "", newSpecialization: "", qualifications: "", experienceYears: "5", consultationFee: "150", slotDuration: "30", photoUrl: "", bio: "", treatmentIds: [], isActive: true };

function DoctorModal({ doctor, open, onClose, onSaved }: { doctor: Doctor | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const specs = useFetch<{ id: number; name: string }[]>(open ? "/specializations" : null);
  const treatments = useFetch<Treatment[]>(open ? "/treatments" : null);
  const [f, setF] = useState<Form>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setF(doctor ? {
      firstName: doctor.firstName, lastName: doctor.lastName, email: doctor.email ?? "", phone: doctor.phone ?? "", password: "", specializationId: String(doctor.specializationId), newSpecialization: "",
      qualifications: doctor.qualifications, experienceYears: String(doctor.experienceYears), consultationFee: String(doctor.consultationFee), slotDuration: String(doctor.slotDuration),
      photoUrl: doctor.photoUrl ?? "", bio: doctor.bio, treatmentIds: doctor.treatments.map((t) => t.id), isActive: doctor.isActive,
    } : blank);
  }, [open, doctor]);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!f.firstName.trim()) local.firstName = "Required";
    if (!f.lastName.trim()) local.lastName = "Required";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) local.email = "Enter a valid email";
    if (!doctor && f.password.length < 8) local.password = "At least 8 characters with a letter and number";
    if (!f.specializationId && !f.newSpecialization.trim()) local.specializationId = "Choose or add a specialization";
    if (!(Number(f.consultationFee) >= 0) || f.consultationFee === "") local.consultationFee = "Enter a fee";
    setErrors(local);
    if (Object.keys(local).length) return;

    const body = {
      firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(), phone: f.phone.trim() || null,
      ...(f.newSpecialization.trim() ? { specializationName: f.newSpecialization.trim() } : { specializationId: Number(f.specializationId) }),
      qualifications: f.qualifications, experienceYears: Number(f.experienceYears) || 0, bio: f.bio, consultationFee: Number(f.consultationFee),
      slotDuration: Number(f.slotDuration), photoUrl: f.photoUrl.trim() || null, treatmentIds: f.treatmentIds, isActive: f.isActive,
      ...(f.password ? { password: f.password } : {}),
    };
    setBusy(true);
    try {
      if (doctor) await patch(`/doctors/${doctor.id}`, body);
      else await post("/doctors", body);
      toast.success(doctor ? "Doctor updated." : "Doctor created. Default hours are Mon–Fri 9–5 – adjust them under Availability.");
      onSaved();
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={doctor ? `Edit ${doctor.name}` : "Add a doctor"} description="Public profile, consultation fee and the treatments this doctor performs."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="doctor-form" loading={busy}>{doctor ? "Save changes" : "Create doctor"}</Button></>}>
      <form id="doctor-form" onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
        <Input label="First name" required value={f.firstName} onChange={set("firstName")} error={errors.firstName} />
        <Input label="Last name" required value={f.lastName} onChange={set("lastName")} error={errors.lastName} />
        <Input label="Email (login)" type="email" required value={f.email} onChange={set("email")} error={errors.email} />
        <Input label="Phone" type="tel" value={f.phone} onChange={set("phone")} error={errors.phone} />
        <Input label={doctor ? "New password (optional)" : "Initial password"} type="password" required={!doctor} autoComplete="new-password" value={f.password} onChange={set("password")} error={errors.password} hint={doctor ? "Leave blank to keep the current password." : undefined} />
        <Select label="Specialization" required value={f.specializationId} onChange={(e) => setF({ ...f, specializationId: e.target.value, newSpecialization: "" })} error={errors.specializationId}>
          <option value="">Select…</option>
          {specs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Input label="…or add a new specialization" value={f.newSpecialization} onChange={(e) => setF({ ...f, newSpecialization: e.target.value, specializationId: e.target.value ? "" : f.specializationId })} className="sm:col-span-2" />
        <Input label="Qualifications" className="sm:col-span-2" value={f.qualifications} onChange={set("qualifications")} placeholder="MD, FACC · Fellowship…" />
        <Input label="Experience (years)" type="number" min={0} value={f.experienceYears} onChange={set("experienceYears")} />
        <Input label="Consultation fee ($)" type="number" min={0} step="0.01" required value={f.consultationFee} onChange={set("consultationFee")} error={errors.consultationFee} />
        <Select label="Slot interval" value={f.slotDuration} onChange={set("slotDuration")}>
          {[10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>Every {m} minutes</option>)}
        </Select>
        <Input label="Photo URL" value={f.photoUrl} onChange={set("photoUrl")} placeholder="https://… or /images/doctors/…" />
        <Textarea label="Biography" className="sm:col-span-2" rows={3} value={f.bio} onChange={set("bio")} />
        <fieldset className="sm:col-span-2">
          <legend className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em] text-fog">Treatments performed</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {treatments.data?.map((t) => {
              const on = f.treatmentIds.includes(t.id);
              return (
                <label key={t.id} className={clsx("flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition", on ? "border-mint-400/60 bg-mint-400/[0.07]" : "border-fg/10 hover:border-fg/25")}>
                  <input type="checkbox" className="h-4 w-4 accent-[var(--color-mint-400)]" checked={on} onChange={() => setF((s) => ({ ...s, treatmentIds: on ? s.treatmentIds.filter((x) => x !== t.id) : [...s.treatmentIds, t.id] }))} />
                  {t.name}
                </label>
              );
            })}
          </div>
        </fieldset>
        {doctor && (
          <div className="flex items-center gap-4 sm:col-span-2">
            <Toggle label="Doctor is active" checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })} />
            <span className="text-sm">{f.isActive ? "Active – visible and bookable" : "Inactive – hidden from patients, cannot sign in"}</span>
          </div>
        )}
      </form>
    </Modal>
  );
}

export default function AdminDoctorsPage() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => { const id = setTimeout(() => setSearch(q.trim()), 300); return () => clearTimeout(id); }, [q]);
  const { data, loading, error, refetch } = useFetch<Doctor[]>("/doctors", { all: 1, search: search || undefined });
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [schedule, setSchedule] = useState<Doctor | null>(null);
  const [remove, setRemove] = useState<Doctor | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggleActive(d: Doctor) {
    try {
      await patch(`/doctors/${d.id}`, { isActive: !d.isActive });
      toast.success(d.isActive ? `${d.name} deactivated.` : `${d.name} reactivated.`);
      refetch();
    } catch (e) { toast.error(errorMessage(e)); }
  }
  async function doDelete() {
    if (!remove) return;
    setBusy(true);
    try {
      const res = await del<{ deleted: boolean; deactivated: boolean }>(`/doctors/${remove.id}`);
      toast.success(res.deleted ? "Doctor deleted." : "Doctor has appointment history, so the profile was deactivated instead.");
      setRemove(null);
      refetch();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Doctors" subtitle="Manage profiles, fees, treatments and availability." actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setFormOpen(true); }}>Add doctor</Button>} />
      <div className="relative mb-6 sm:w-80">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or specialization…" aria-label="Search doctors" className="h-11 w-full rounded-full border border-fg/10 bg-fg/[0.04] pl-11 pr-4 text-sm placeholder:text-fog-dark focus:border-mint-400/60 focus:outline-none" />
      </div>
      {error ? <ErrorState message={error} onRetry={refetch} /> : loading && !data ? <Skeleton className="h-96" /> : data && data.length === 0 ? <EmptyState title="No doctors found" /> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data?.map((d) => (
            <div key={d.id} className={clsx("panel flex flex-col p-5", !d.isActive && "opacity-70")}>
              <div className="flex gap-4">
                <Img src={d.photoUrl} alt={d.name} label={d.name} className="h-20 w-20 shrink-0 rounded-2xl object-cover object-top" />
                <div className="min-w-0">
                  <p className="truncate font-serif text-xl">{d.name}</p>
                  <p className="text-sm text-mint-300">{d.specialization}</p>
                  <p className="mt-1 truncate text-xs text-fog">{d.email}</p>
                  {!d.isActive && <span className="mt-2 inline-block rounded-full bg-zinc-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">Inactive</span>}
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-fg/[0.07] py-4 text-center text-xs">
                <div><dt className="text-fog-dark">Fee</dt><dd className="mt-1 text-sm">{formatMoney(d.consultationFee)}</dd></div>
                <div><dt className="text-fog-dark">Experience</dt><dd className="mt-1 text-sm">{d.experienceYears} yrs</dd></div>
                <div><dt className="text-fog-dark">Treatments</dt><dd className="mt-1 text-sm">{d.treatments.length}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="subtle" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { setEditing(d); setFormOpen(true); }}>Edit</Button>
                <Button size="sm" variant="subtle" icon={<CalendarClock className="h-3.5 w-3.5" />} onClick={() => setSchedule(d)}>Availability</Button>
                <Button size="sm" variant="ghost" icon={<Power className="h-3.5 w-3.5" />} onClick={() => toggleActive(d)}>{d.isActive ? "Deactivate" : "Activate"}</Button>
                <Button size="sm" variant="danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setRemove(d)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <DoctorModal doctor={editing} open={formOpen} onClose={() => setFormOpen(false)} onSaved={refetch} />
      <Modal open={!!schedule} onClose={() => setSchedule(null)} size="xl" title={`Availability · ${schedule?.name ?? ""}`}>
        {schedule && <ScheduleEditor doctorId={schedule.id} />}
      </Modal>
      <ConfirmDialog open={!!remove} danger loading={busy} title="Delete this doctor?" confirmLabel="Delete" onClose={() => setRemove(null)} onConfirm={doDelete}
        message={`${remove?.name ?? "This doctor"} will be removed. If they have appointment history, the profile is deactivated instead so records stay intact.`} />
    </>
  );
}
