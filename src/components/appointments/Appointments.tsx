"use client";

import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { CalendarClock, CalendarDays, Check, Eye, Phone, UserRound, X } from "lucide-react";
import { DatePicker, TimeSlots } from "@/components/booking/SlotPicker";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Form";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, Skeleton, Spinner, StatusBadge } from "@/components/ui/Feedback";
import { Img } from "@/components/ui/Media";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/hooks/useFetch";
import { errorMessage, patch, post } from "@/lib/http";
import { formatDate, formatDateTime, formatMoney, formatTime, statusLabel } from "@/utils/format";
import type { Appointment, AppointmentStatus, PatientRecord, Role } from "@/types";

type Actions = {
  view: (a: Appointment) => void;
  cancel: (a: Appointment) => void;
  reject: (a: Appointment) => void;
  reschedule: (a: Appointment) => void;
  setStatus: (a: Appointment, status: AppointmentStatus) => Promise<void>;
  busyId: number | null;
};

const todayLocal = () => new Date().toLocaleDateString("en-CA");

/* ------------------------------ row actions ------------------------------ */
function Mini({ children, onClick, tone = "subtle", disabled }: { children: ReactNode; onClick: () => void; tone?: "subtle" | "primary" | "danger"; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition disabled:opacity-50",
        tone === "primary" && "bg-mint-400 text-on-accent hover:bg-mint-300",
        tone === "subtle" && "bg-fg/[0.07] text-fg hover:bg-fg/[0.14]",
        tone === "danger" && "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
      )}
    >
      {children}
    </button>
  );
}

export function RowActions({ a, role, actions, withView = true }: { a: Appointment; role: Role; actions: Actions; withView?: boolean }) {
  const live = a.status === "pending" || a.status === "confirmed";
  const canFinish = a.status === "confirmed" && a.date <= todayLocal();
  const busy = actions.busyId === a.id;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {withView && <Mini onClick={() => actions.view(a)}><Eye className="h-3.5 w-3.5" /> Details</Mini>}
      {role !== "patient" && a.status === "pending" && (
        <>
          <Mini tone="primary" disabled={busy} onClick={() => actions.setStatus(a, "confirmed")}><Check className="h-3.5 w-3.5" /> {role === "doctor" ? "Accept" : "Confirm"}</Mini>
          <Mini tone="danger" disabled={busy} onClick={() => actions.reject(a)}><X className="h-3.5 w-3.5" /> Reject</Mini>
        </>
      )}
      {role !== "patient" && canFinish && (
        <>
          <Mini tone="primary" disabled={busy} onClick={() => actions.setStatus(a, "completed")}><Check className="h-3.5 w-3.5" /> Complete</Mini>
          <Mini disabled={busy} onClick={() => actions.setStatus(a, "no_show")}>No-show</Mini>
        </>
      )}
      {live && <Mini onClick={() => actions.reschedule(a)}><CalendarClock className="h-3.5 w-3.5" /> {role === "patient" ? "Request reschedule" : "Reschedule"}</Mini>}
      {live && <Mini tone="danger" onClick={() => actions.cancel(a)}><X className="h-3.5 w-3.5" /> Cancel</Mini>}
    </div>
  );
}

/* --------------------------- reschedule modal ---------------------------- */
function RescheduleModal({ appt, role, onClose, onDone }: { appt: Appointment | null; role: Role; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);

  async function submit() {
    if (!appt) return;
    setBusy(true);
    try {
      await post(`/appointments/${appt.id}/reschedule`, { date, startTime: time, reason: reason || null });
      toast.success(role === "patient" ? "Reschedule request sent – awaiting the doctor's confirmation." : "Appointment rescheduled.");
      setDate(""); setTime(""); setReason("");
      onDone();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
      setTime("");
      setRefresh((r) => r + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!appt}
      onClose={onClose}
      size="lg"
      title={role === "patient" ? "Request a new time" : "Reschedule appointment"}
      description={appt ? `${appt.treatment.name} with ${appt.doctor.name} · currently ${formatDate(appt.date, "short")} at ${formatTime(appt.startTime)}` : undefined}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} loading={busy} disabled={!date || !time}>{role === "patient" ? "Send request" : "Confirm new time"}</Button></>}
    >
      {appt && (
        <div className="space-y-8">
          <DatePicker doctorId={appt.doctor.id} treatmentId={appt.treatment.id} value={date} refreshKey={refresh} onChange={(d) => { setDate(d); setTime(""); }} />
          {date && <TimeSlots doctorId={appt.doctor.id} treatmentId={appt.treatment.id} date={date} value={time} refreshKey={refresh} excludeAppointmentId={appt.id} onChange={setTime} />}
          <Textarea label="Reason (optional)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          {role === "patient" && <p className="rounded-xl bg-fg/[0.04] p-4 text-[13px] text-fog">Your current slot stays reserved until the new time is validated. The doctor will be asked to re-confirm the new time.</p>}
        </div>
      )}
    </Modal>
  );
}

/* ----------------------------- detail modal ------------------------------ */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.16em] text-fog-dark">{label}</dt>
      <dd className="mt-1.5 text-sm">{children}</dd>
    </div>
  );
}

function PatientRecordPanel({ patientId }: { patientId: number }) {
  const { data, loading, error } = useFetch<PatientRecord>(`/patients/${patientId}`);
  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;
  if (error || !data) return <p className="text-sm text-rose-300">{error ?? "Unavailable"}</p>;
  return (
    <div className="space-y-4 rounded-2xl border border-fg/[0.08] bg-fg/[0.03] p-5">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Row label="Date of birth">{data.dateOfBirth ? formatDate(data.dateOfBirth, "long") : "—"}</Row>
        <Row label="Gender">{data.gender ? data.gender.replace(/_/g, " ") : "—"}</Row>
        <Row label="Address">{data.address ?? "—"}</Row>
        <Row label="Emergency contact">{data.emergencyContact ?? "—"}</Row>
      </dl>
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-fog-dark">Visit history ({data.appointments?.length ?? 0})</p>
        <ul className="mt-3 max-h-40 divide-y divide-fg/[0.06] overflow-y-auto text-sm">
          {data.appointments?.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
              <span>{formatDate(h.date, "short")} · {h.treatment.name}</span>
              <StatusBadge status={h.status} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DetailModal({ id, role, version, onClose, actions }: { id: number | null; role: Role; version: number; onClose: () => void; actions: Actions }) {
  const { data: a, loading, error, refetch } = useFetch<Appointment>(id ? `/appointments/${id}` : null, { v: version });
  const [showRecord, setShowRecord] = useState(false);
  const cleanClose = () => { setShowRecord(false); onClose(); };
  return (
    <Modal open={!!id} onClose={cleanClose} size="lg" title={a ? `Appointment ${a.reference}` : "Appointment"} description={a ? `Booked ${formatDateTime(a.createdAt)}` : undefined}
      footer={a && <><RowActions a={a} role={role} actions={actions} withView={false} /><Button variant="ghost" onClick={cleanClose}>Close</Button></>}>
      {loading && !a ? <Skeleton className="h-72" /> : error || !a ? <ErrorState message={error ?? "Not found"} onRetry={refetch} /> : (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Img src={a.doctor.photoUrl} alt={a.doctor.name} label={a.doctor.name} className="h-14 w-14 rounded-full object-cover object-top" />
              <div><p className="font-serif text-xl">{a.doctor.name}</p><p className="text-sm text-fog">{a.doctor.specialization}</p></div>
            </div>
            <StatusBadge status={a.status} />
          </div>
          <dl className="grid gap-6 sm:grid-cols-2">
            <Row label="Date">{formatDate(a.date, "long")}</Row>
            <Row label="Time">{formatTime(a.startTime)} – {formatTime(a.endTime)}</Row>
            <Row label="Treatment">{a.treatment.name} · {a.treatment.durationMinutes} min</Row>
            <Row label="Price">{formatMoney(a.price)}</Row>
            <Row label="Patient"><span className="inline-flex items-center gap-2"><UserRound className="h-3.5 w-3.5 text-mint-400" />{a.patientName}</span></Row>
            <Row label="Contact"><span className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-mint-400" />{a.patientPhone}</span>{a.patientEmail && <span className="mt-1 block text-fog">{a.patientEmail}</span>}</Row>
            {a.reason && <Row label="Reason for visit">{a.reason}</Row>}
            {a.notes && <Row label="Notes">{a.notes}</Row>}
            {a.rescheduleCount > 0 && <Row label="Rescheduled">{a.rescheduleCount} time{a.rescheduleCount > 1 ? "s" : ""}</Row>}
            {a.cancellationReason && <Row label={a.status === "rejected" ? "Rejection reason" : "Cancellation reason"}>{a.cancellationReason}{a.cancelledBy && <span className="text-fog"> (by {a.cancelledBy})</span>}</Row>}
          </dl>

          {role !== "patient" && (
            <div>
              {showRecord ? <PatientRecordPanel patientId={a.patient.id} /> : <Button variant="outline" size="sm" onClick={() => setShowRecord(true)} icon={<UserRound className="h-4 w-4" />}>View patient record</Button>}
            </div>
          )}

          {a.history && a.history.length > 0 && (
            <div>
              <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-fog-dark">Status history</p>
              <ol className="relative space-y-5 border-l border-fg/10 pl-6">
                {a.history.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-mint-400 ring-4 ring-ink-850" />
                    <p className="text-sm"><span className="font-medium">{statusLabel(h.toStatus)}</span> <span className="text-fog-dark">· {formatDateTime(h.createdAt)}</span></p>
                    {h.note && <p className="mt-0.5 text-[13px] text-fog">{h.note}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* --------------------------- hook with dialogs --------------------------- */
export function useAppointmentActions(role: Role, onChanged: () => void) {
  const toast = useToast();
  const [detailId, setDetailId] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const changed = () => { setVersion((v) => v + 1); onChanged(); };

  const actions: Actions = {
    busyId,
    view: (a) => setDetailId(a.id),
    cancel: (a) => { setReason(""); setCancelTarget(a); },
    reject: (a) => { setReason(""); setRejectTarget(a); },
    reschedule: (a) => setRescheduleTarget(a),
    setStatus: async (a, status) => {
      setBusyId(a.id);
      try {
        await patch(`/appointments/${a.id}/status`, { status });
        toast.success(`Appointment marked as ${statusLabel(status).toLowerCase()}.`);
        changed();
      } catch (e) {
        toast.error(errorMessage(e));
      } finally {
        setBusyId(null);
      }
    },
  };

  async function doCancel() {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      await post(`/appointments/${cancelTarget.id}/cancel`, { reason: reason || null });
      toast.success("Appointment cancelled. The time slot has been released.");
      setCancelTarget(null);
      changed();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function doReject() {
    if (!rejectTarget) return;
    setBusy(true);
    try {
      await patch(`/appointments/${rejectTarget.id}/status`, { status: "rejected", note: reason || null });
      toast.success("Request rejected and the patient has been notified.");
      setRejectTarget(null);
      changed();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const dialogs = (
    <>
      <DetailModal id={detailId} role={role} version={version} onClose={() => setDetailId(null)} actions={actions} />
      <ConfirmDialog open={!!cancelTarget} title="Cancel this appointment?" danger loading={busy} confirmLabel="Yes, cancel" onClose={() => setCancelTarget(null)} onConfirm={doCancel}
        message={cancelTarget ? `${cancelTarget.treatment.name} on ${formatDate(cancelTarget.date)} at ${formatTime(cancelTarget.startTime)}. The time slot will be released for other patients.` : ""}>
        <Textarea label="Reason (optional)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmDialog>
      <ConfirmDialog open={!!rejectTarget} title="Reject this request?" danger loading={busy} confirmLabel="Reject request" cancelLabel="Go back" onClose={() => setRejectTarget(null)} onConfirm={doReject}
        message={rejectTarget ? `The patient (${rejectTarget.patientName}) will be notified and the slot will be released.` : ""}>
        <Textarea label="Message to patient (optional)" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmDialog>
      <RescheduleModal appt={rescheduleTarget} role={role} onClose={() => setRescheduleTarget(null)} onDone={changed} />
    </>
  );
  return { actions, dialogs };
}

/* -------------------------------- list ----------------------------------- */
export function AppointmentList({ items, role, actions, loading, error, onRetry, empty }: { items: Appointment[] | null; role: Role; actions: Actions; loading?: boolean; error?: string | null; onRetry?: () => void; empty?: ReactNode }) {
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (loading && !items) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>;
  if (!items || items.length === 0) return <>{empty ?? <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No appointments found" message="Nothing matches this view yet." />}</>;

  const who = (a: Appointment) => (role === "patient" ? a.doctor.name : a.patientName);
  const sub = (a: Appointment) => (role === "patient" ? a.doctor.specialization : a.patientPhone);

  return (
    <div className={clsx("transition-opacity", loading && "opacity-60")}>
      <div className="hidden overflow-x-auto rounded-2xl border border-fg/[0.08] md:block">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-fg/[0.03] text-[11px] uppercase tracking-[0.14em] text-fog">
            <tr>
              <th className="px-5 py-4 font-medium">ID</th>
              <th className="px-5 py-4 font-medium">{role === "patient" ? "Doctor" : "Patient"}</th>
              {role === "admin" && <th className="px-5 py-4 font-medium">Doctor</th>}
              <th className="px-5 py-4 font-medium">Treatment</th>
              <th className="px-5 py-4 font-medium">Date & time</th>
              <th className="px-5 py-4 font-medium">Status</th>
              {role === "patient" && <th className="px-5 py-4 font-medium">Booked</th>}
              <th className="px-5 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fg/[0.06]">
            {items.map((a) => (
              <tr key={a.id} className="transition hover:bg-fg/[0.025]">
                <td className="px-5 py-4 font-mono text-xs text-mint-300">{a.reference}</td>
                <td className="px-5 py-4"><p className="font-medium">{who(a)}</p><p className="text-xs text-fog">{sub(a)}</p></td>
                {role === "admin" && <td className="px-5 py-4 text-fog">{a.doctor.name}</td>}
                <td className="px-5 py-4">{a.treatment.name}</td>
                <td className="whitespace-nowrap px-5 py-4"><p>{formatDate(a.date, "medium")}</p><p className="text-xs text-fog">{formatTime(a.startTime)} – {formatTime(a.endTime)}</p></td>
                <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                {role === "patient" && <td className="whitespace-nowrap px-5 py-4 text-xs text-fog">{formatDate(a.createdAt.slice(0, 10), "short")}</td>}
                <td className="px-5 py-4"><RowActions a={a} role={role} actions={actions} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-4 md:hidden">
        {items.map((a) => (
          <li key={a.id} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-mint-300">{a.reference}</p>
                <p className="mt-1 truncate font-medium">{a.treatment.name}</p>
                <p className="text-sm text-fog">{who(a)}{role === "admin" ? ` · ${a.doctor.name}` : ""}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4 text-mint-400" />{formatDate(a.date)} · {formatTime(a.startTime)}</p>
            <div className="mt-4"><RowActions a={a} role={role} actions={actions} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
