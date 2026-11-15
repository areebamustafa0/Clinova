"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, CalendarPlus, Check, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { CLINIC } from "@/lib/brand";
import { Button } from "@/components/ui/Button";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { Input, Textarea } from "@/components/ui/Form";
import { Img, Stars } from "@/components/ui/Media";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/hooks/useFetch";
import { ApiRequestError, errorMessage, fieldErrors, get, post } from "@/lib/http";
import { formatDate, formatMoney, formatTime } from "@/utils/format";
import type { Appointment, Doctor, Treatment } from "@/types";
import { DatePicker, TimeSlots } from "./SlotPicker";

const steps = ["Treatment", "Doctor", "Date", "Time", "Details", "Review"];

function downloadIcs(a: Appointment) {
  const dt = (d: string, t: string) => `${d.replace(/-/g, "")}T${t.replace(":", "")}00`;
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Clinova//Appointments//EN", "BEGIN:VEVENT",
    `UID:${a.reference}@clinova.com`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART:${dt(a.date, a.startTime)}`, `DTEND:${dt(a.date, a.endTime)}`,
    `SUMMARY:${a.treatment.name} with ${a.doctor.name}`, `LOCATION:Clinova – ${CLINIC.addressLine}`,
    `DESCRIPTION:Reference ${a.reference}`, "END:VEVENT", "END:VCALENDAR",
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `clinova-${a.reference}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="mb-10">
      <ol className="flex items-center" aria-label="Booking progress">
        {steps.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <li key={label} className={clsx("flex items-center", i < steps.length - 1 && "flex-1")} aria-current={active ? "step" : undefined}>
              <span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm transition", done ? "border-mint-400 bg-mint-400 text-on-accent" : active ? "border-mint-400 text-mint-300 shadow-glow" : "border-fg/15 text-fog-dark")}>
                {done ? <Check className="h-4 w-4" /> : n}
              </span>
              <span className={clsx("ml-3 hidden text-sm xl:block", active ? "text-fg" : "text-fog-dark")}>{label}</span>
              {i < steps.length - 1 && <span className={clsx("mx-3 h-px flex-1 transition-colors", done ? "bg-mint-400/60" : "bg-fg/10")} />}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-fog xl:hidden">Step {step} of {steps.length} · {steps[step - 1]}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
      <h2 className="font-serif text-3xl sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-2 text-fog">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </motion.div>
  );
}

export function BookingWizard() {
  const { user } = useAuth();
  const toast = useToast();
  const params = useSearchParams();
  const [step, setStep] = useState(1);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [lockedDoctor, setLockedDoctor] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [category, setCategory] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [details, setDetails] = useState({ patientName: "", patientPhone: "", patientEmail: "", reason: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState<Appointment | null>(null);

  // Pre-select from ?doctorId= & ?treatmentId= (deep links from the public site)
  useEffect(() => {
    const dId = Number(params.get("doctorId")) || null;
    const tId = Number(params.get("treatmentId")) || null;
    (async () => {
      try {
        const [d, t] = await Promise.all([dId ? get<Doctor>(`/doctors/${dId}`) : null, tId ? get<Treatment>(`/treatments/${tId}`) : null]);
        if (d) { setDoctor(d); setLockedDoctor(true); }
        if (t) setTreatment(t);
        if (d && t) {
          const qDate = params.get("date") ?? "";
          const qTime = params.get("time") ?? "";
          if (!d.treatments.some((x) => x.id === t.id)) setStep(1);
          else if (/^\d{4}-\d{2}-\d{2}$/.test(qDate) && /^\d{2}:\d{2}$/.test(qTime)) {
            // Deep link from the public "next available" widget: jump to patient details. The server re-validates the slot on confirm.
            setDate(qDate);
            setTime(qTime);
            setStep(5);
          } else setStep(3);
        }
        else if (t) setStep(2);
      } catch {
        toast.error("We couldn't load that selection – please choose again.");
      } finally {
        setInitializing(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) setDetails((d) => ({ ...d, patientName: d.patientName || `${user.firstName} ${user.lastName}`, patientPhone: d.patientPhone || user.phone || "", patientEmail: d.patientEmail || user.email }));
  }, [user]);

  const treatments = useFetch<Treatment[], { categories: string[] }>(step === 1 ? "/treatments" : null, { doctorId: lockedDoctor && doctor ? doctor.id : undefined });
  const doctors = useFetch<Doctor[]>(step === 2 && treatment ? "/doctors" : null, { treatmentId: treatment?.id });

  function pickTreatment(t: Treatment) {
    if (treatment?.id !== t.id) {
      setDate(""); setTime("");
      if (!lockedDoctor) setDoctor(null);
    }
    setTreatment(t);
    if (lockedDoctor && doctor) setStep(3);
    else if (doctor && doctor.treatments.some((x) => x.id === t.id)) setStep(3);
    else { setDoctor(null); setStep(2); }
  }
  function pickDoctor(d: Doctor) {
    if (doctor?.id !== d.id) { setDate(""); setTime(""); }
    setDoctor(d);
    setStep(3);
  }

  function validateDetails() {
    const e: Record<string, string> = {};
    if (details.patientName.trim().length < 2) e.patientName = "Please enter the patient's full name";
    if (!/^[+()\-\s\d]{7,20}$/.test(details.patientPhone.trim())) e.patientPhone = "Enter a valid phone number";
    if (details.patientEmail && !/^\S+@\S+\.\S+$/.test(details.patientEmail)) e.patientEmail = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function confirm() {
    if (!treatment || !doctor || !date || !time) return;
    setSubmitting(true);
    try {
      const appt = await post<Appointment>("/appointments", {
        doctorId: doctor.id, treatmentId: treatment.id, date, startTime: time,
        patientName: details.patientName.trim(), patientPhone: details.patientPhone.trim(),
        patientEmail: details.patientEmail.trim() || null, reason: details.reason.trim() || null, notes: details.notes.trim() || null,
      });
      setBooked(appt);
      toast.success("Appointment requested successfully.");
    } catch (err) {
      toast.error(errorMessage(err));
      const status = err instanceof ApiRequestError ? err.status : 0;
      if (status === 409 || status === 422) { setTime(""); setRefreshKey((k) => k + 1); setStep(4); }
      else setErrors(fieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setBooked(null); setTreatment(null); setDoctor(null); setLockedDoctor(false); setDate(""); setTime(""); setStep(1);
    setDetails((d) => ({ ...d, reason: "", notes: "" }));
  }

  /* ----------------------------- confirmation ----------------------------- */
  if (booked) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.15 }} className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-mint-400/10 text-mint-400">
          <CheckCircle2 className="h-14 w-14" strokeWidth={1.3} />
        </motion.span>
        <h1 className="mt-8 font-serif text-5xl">Request received</h1>
        <p className="mx-auto mt-4 max-w-md text-fog">Your appointment is awaiting confirmation from {booked.doctor.name}. We'll notify you the moment it's confirmed.</p>
        <div className="panel mt-10 divide-y divide-fg/[0.07] text-left">
          {[
            ["Reference", booked.reference], ["Treatment", booked.treatment.name], ["Doctor", `${booked.doctor.name} · ${booked.doctor.specialization}`],
            ["Date", formatDate(booked.date, "long")], ["Time", `${formatTime(booked.startTime)} – ${formatTime(booked.endTime)}`], ["Patient", booked.patientName], ["Price", formatMoney(booked.price)],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-6 px-6 py-4 text-sm">
              <span className="text-fog">{k}</span>
              <span className={clsx("text-right", k === "Reference" ? "font-mono text-mint-300" : "text-fg")}>{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/dashboard/appointments" iconRight={<ArrowRight className="h-4 w-4" />}>View my appointments</Button>
          <Button variant="outline" icon={<CalendarPlus className="h-4 w-4" />} onClick={() => downloadIcs(booked)}>Add to calendar</Button>
          <Button variant="ghost" onClick={reset}>Book another</Button>
        </div>
      </motion.div>
    );
  }

  if (initializing) return <Skeleton className="h-[480px]" />;

  const total = treatment?.price ?? 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-4xl sm:text-5xl">Book an appointment</h1>
        <p className="mt-2 text-fog">Choose a treatment and specialist, then pick a time that suits you.</p>
      </div>
      <Stepper step={step} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Panel key="s1" title="Choose your treatment" subtitle={lockedDoctor && doctor ? `Treatments offered by ${doctor.name}` : "What would you like to book?"}>
                {treatments.error ? <ErrorState message={treatments.error} onRetry={treatments.refetch} /> : (
                  <>
                    <div className="no-scrollbar -mx-1 mb-6 flex gap-2 overflow-x-auto px-1">
                      {["", ...(treatments.meta?.categories ?? [])].map((c) => (
                        <button key={c || "all"} onClick={() => setCategory(c)} className={clsx("shrink-0 rounded-full border px-4 py-2 text-[13px] transition", category === c ? "border-mint-400 bg-mint-400 font-medium text-on-accent" : "border-fg/15 text-fg/70 hover:text-fg")}>{c || "All"}</button>
                      ))}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {treatments.loading && !treatments.data ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />) : (treatments.data ?? []).filter((t) => !category || t.category === category).map((t) => (
                        <button key={t.id} onClick={() => pickTreatment(t)} className={clsx("group flex gap-4 rounded-2xl border p-3 text-left transition", treatment?.id === t.id ? "border-mint-400 bg-mint-400/[0.07]" : "border-fg/[0.08] bg-ink-800/50 hover:border-mint-400/40")}>
                          <Img src={t.imageUrl} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                          <span className="flex min-w-0 flex-col justify-between py-0.5">
                            <span>
                              <span className="block text-[11px] uppercase tracking-widest text-mint-400">{t.category}</span>
                              <span className="mt-1 block font-medium leading-snug">{t.name}</span>
                            </span>
                            <span className="flex items-center gap-3 text-sm text-fog"><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t.durationMinutes} min</span><span className="text-mint-300">{formatMoney(t.price)}</span></span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </Panel>
            )}

            {step === 2 && treatment && (
              <Panel key="s2" title="Select your specialist" subtitle={`Doctors who perform ${treatment.name}`}>
                {doctors.error ? <ErrorState message={doctors.error} onRetry={doctors.refetch} /> : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {doctors.loading && !doctors.data ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40" />) : (doctors.data ?? []).map((d) => (
                      <button key={d.id} onClick={() => pickDoctor(d)} className={clsx("flex gap-4 rounded-2xl border p-4 text-left transition", doctor?.id === d.id ? "border-mint-400 bg-mint-400/[0.07]" : "border-fg/[0.08] bg-ink-800/50 hover:border-mint-400/40")}>
                        <Img src={d.photoUrl} alt={d.name} label={d.name} className="h-28 w-24 shrink-0 rounded-xl object-cover object-top" />
                        <span className="min-w-0">
                          <span className="block font-serif text-xl">{d.name}</span>
                          <span className="block text-sm text-mint-300">{d.specialization}</span>
                          <span className="mt-2 flex items-center gap-1.5 text-xs text-fog"><Stars value={d.rating} />{d.rating.toFixed(1)}</span>
                          <span className="mt-1 block text-xs text-fog">{d.experienceYears} years experience</span>
                          <span className="mt-1 block text-xs text-fog">Consultation {formatMoney(d.consultationFee)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </Panel>
            )}

            {step === 3 && treatment && doctor && (
              <Panel key="s3" title="Pick a date" subtitle={`Availability for ${doctor.name}`}>
                <DatePicker doctorId={doctor.id} treatmentId={treatment.id} value={date} refreshKey={refreshKey} onChange={(d) => { setDate(d); setTime(""); }} />
              </Panel>
            )}

            {step === 4 && treatment && doctor && (
              <Panel key="s4" title="Choose a time" subtitle="Live availability — booked times are disabled.">
                <TimeSlots doctorId={doctor.id} treatmentId={treatment.id} date={date} value={time} refreshKey={refreshKey} onChange={setTime} />
              </Panel>
            )}

            {step === 5 && (
              <Panel key="s5" title="Patient details" subtitle="Who is this appointment for?">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Patient full name" required value={details.patientName} onChange={(e) => setDetails({ ...details, patientName: e.target.value })} error={errors.patientName} />
                  <Input label="Phone" type="tel" required value={details.patientPhone} onChange={(e) => setDetails({ ...details, patientPhone: e.target.value })} error={errors.patientPhone} />
                  <Input className="sm:col-span-2" label="Email (for confirmations)" type="email" value={details.patientEmail} onChange={(e) => setDetails({ ...details, patientEmail: e.target.value })} error={errors.patientEmail} />
                  <Input className="sm:col-span-2" label="Reason for visit" value={details.reason} onChange={(e) => setDetails({ ...details, reason: e.target.value })} placeholder="e.g. Annual check-up, skin concerns…" error={errors.reason} />
                  <Textarea className="sm:col-span-2" label="Additional notes" rows={4} value={details.notes} onChange={(e) => setDetails({ ...details, notes: e.target.value })} placeholder="Allergies, medication, anything the doctor should know." error={errors.notes} />
                </div>
              </Panel>
            )}

            {step === 6 && treatment && doctor && (
              <Panel key="s6" title="Review & confirm" subtitle="Please check everything before confirming.">
                <div className="panel divide-y divide-fg/[0.07]">
                  {[
                    ["Treatment", `${treatment.name} (${treatment.durationMinutes} min)`], ["Doctor", `${doctor.name} · ${doctor.specialization}`],
                    ["Date", formatDate(date, "long")], ["Time", `${formatTime(time)}`], ["Patient", details.patientName], ["Phone", details.patientPhone],
                    ...(details.patientEmail ? [["Email", details.patientEmail]] : []), ...(details.reason ? [["Reason", details.reason]] : []), ...(details.notes ? [["Notes", details.notes]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-6 px-6 py-4 text-sm"><span className="shrink-0 text-fog">{k}</span><span className="text-right">{v}</span></div>
                  ))}
                  <div className="flex justify-between bg-mint-400/[0.05] px-6 py-5"><span className="text-fog">Total</span><span className="font-serif text-3xl text-mint-300">{formatMoney(total)}</span></div>
                </div>
                <p className="mt-5 flex gap-3 rounded-2xl bg-fg/[0.04] p-4 text-[13px] leading-relaxed text-fog">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-mint-400" />
                  Free cancellation or rescheduling up to 2 hours before your appointment. Payment is taken at the clinic.
                </p>
              </Panel>
            )}
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} icon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
            {step === 3 && <Button onClick={() => setStep(4)} disabled={!date} iconRight={<ArrowRight className="h-4 w-4" />}>Continue</Button>}
            {step === 4 && <Button onClick={() => setStep(5)} disabled={!time} iconRight={<ArrowRight className="h-4 w-4" />}>Continue</Button>}
            {step === 5 && <Button onClick={() => validateDetails() && setStep(6)} iconRight={<ArrowRight className="h-4 w-4" />}>Review booking</Button>}
            {step === 6 && <Button size="lg" loading={submitting} onClick={confirm} icon={<Check className="h-4 w-4" />}>Confirm appointment</Button>}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="panel sticky top-24 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">Your appointment</p>
            <dl className="mt-5 space-y-5 text-sm">
              <div><dt className="text-fog-dark">Treatment</dt><dd className="mt-1">{treatment ? treatment.name : <span className="text-fog-dark">Not selected</span>}</dd></div>
              <div><dt className="text-fog-dark">Doctor</dt><dd className="mt-1">{doctor ? doctor.name : <span className="text-fog-dark">Not selected</span>}</dd></div>
              <div><dt className="text-fog-dark">Date & time</dt><dd className="mt-1">{date ? `${formatDate(date)}${time ? ` · ${formatTime(time)}` : ""}` : <span className="text-fog-dark">Not selected</span>}</dd></div>
            </dl>
            <div className="mt-6 flex items-end justify-between border-t border-fg/[0.07] pt-5">
              <span className="text-sm text-fog">Total</span>
              <span className="font-serif text-3xl text-mint-300">{formatMoney(total)}</span>
            </div>
          </div>
        </aside>
      </div>
      <p className="mt-10 text-center text-xs text-fog-dark">Need help? <Link href="/contact" className="text-mint-300 hover:underline">Contact our care team</Link></p>
    </div>
  );
}
