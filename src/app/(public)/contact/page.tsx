"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CalendarClock, Clock, Mail, MapPin, Phone } from "lucide-react";
import { IconCheck } from "@/components/site/icons";
import { ArrowButton, Eyebrow, Reveal, SplitHeading } from "@/components/site/ui";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/hooks/useFetch";
import { CLINIC } from "@/lib/brand";
import { errorMessage, fieldErrors, post } from "@/lib/http";
import { sortTreatments } from "@/lib/site-content";
import { PLANS } from "@/lib/site-extras";
import type { Treatment } from "@/types";

const control = "w-full rounded-xl border border-line bg-card px-4 py-3.5 text-[0.95rem] text-espresso placeholder:text-muted/70 transition-colors focus:border-espresso/50 focus:outline-none";

function Field({ label, htmlFor, optional, error, className, children }: { label: string; htmlFor: string; optional?: boolean; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 flex items-baseline justify-between text-[0.8rem] font-medium text-espresso">
        {label}
        {optional && <span className="text-[0.7rem] font-normal text-muted">Optional</span>}
      </label>
      {children}
      {error && <p role="alert" className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

const empty = { name: "", email: "", phone: "", treatment: "", date: "", time: "", message: "", consent: false };

export default function ContactPage() {
  const toast = useToast();
  const { data } = useFetch<Treatment[]>("/treatments");
  const treatments = sortTreatments(data ?? []);
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    // Deep links: /contact?plan=radiance#book or /contact?treatment=Injectables#book
    const sp = new URLSearchParams(window.location.search);
    const plan = PLANS.find((p) => p.key === sp.get("plan"));
    const treatment = sp.get("treatment");
    if (plan || treatment) {
      setF((s) => ({
        ...s,
        treatment: treatment ?? s.treatment,
        message: plan ? `I'd like to join the ${plan.name} membership (£${plan.monthly}/month). Please get in touch to arrange my first visit.` : s.message,
      }));
    }
  }, []);
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (f.name.trim().length < 2) local.name = "Please tell us your name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) local.email = "Enter a valid email address";
    if (!/^[+()\-\s\d]{7,20}$/.test(f.phone)) local.phone = "Enter a valid phone number";
    if (!f.consent) local.consent = "Please confirm so we can contact you";
    setErrors(local);
    if (Object.keys(local).length) return;

    const lines = [
      `Treatment of interest: ${f.treatment || "Not sure yet"}`,
      `Preferred date: ${f.date || "No preference"}`,
      `Preferred time: ${f.time || "Any time"}`,
      "",
      f.message.trim() || "(No additional message)",
    ];
    setBusy(true);
    try {
      await post("/contact", { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), subject: `Consultation request${f.treatment ? ` – ${f.treatment}` : ""}`, message: lines.join("\n") });
      setSent(true);
      setF(empty);
      toast.success("Request received. We'll reply within one working day.");
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(fe);
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const info: [ReactNode, string, ReactNode][] = [
    [<Phone key="p" width={16} height={16} strokeWidth={1.5} />, "Call", <a key="a" href={CLINIC.phoneHref} className="hover:text-bronze">{CLINIC.phone}</a>],
    [<Mail key="m" width={16} height={16} strokeWidth={1.5} />, "Email", <a key="a" href={`mailto:${CLINIC.email}`} className="break-all hover:text-bronze">{CLINIC.email}</a>],
    [<MapPin key="l" width={16} height={16} strokeWidth={1.5} />, "Visit", <span key="a">{CLINIC.addressLine}</span>],
    [<Clock key="c" width={16} height={16} strokeWidth={1.5} />, "Hours", <ul key="a" className="space-y-1">{CLINIC.hours.map(([d, h]) => <li key={d} className="flex justify-between gap-4 text-muted"><span>{d}</span><span>{h}</span></li>)}</ul>],
  ];

  return (
    <section aria-labelledby="page-title" className="container-site pb-20 pt-32 lg:pb-28 lg:pt-44">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <Reveal><Eyebrow>Book your visit</Eyebrow></Reveal>
          <SplitHeading as="h1" immediate id="page-title" className="text-headline mt-6" text={"Begin your\nskin journey"} />
          <Reveal delay={0.15}><p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-muted">Share a few details and we&apos;ll arrange a relaxed consultation at a time that suits you.</p></Reveal>
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {info.map(([icon, label, value], i) => (
              <Reveal key={label} delay={0.08 * i}>
                <li className="grid grid-cols-[2.5rem_5rem_1fr] items-start gap-2 py-5 text-[0.95rem] text-espresso">
                  <span className="grid size-8 place-items-center rounded-full bg-sand text-bronze">{icon}</span>
                  <span className="pt-1 text-sm text-muted">{label}</span>
                  <span className="pt-1">{value}</span>
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.3} className="mt-8 flex items-start gap-3 rounded-2xl bg-sand p-5 text-sm leading-relaxed text-muted">
            <CalendarClock width={18} height={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-bronze" />
            <span>Prefer to choose your own time? <Link href="/dashboard/book" className="text-espresso underline decoration-line underline-offset-4 hover:decoration-espresso">Book online instantly</Link> with live availability.</span>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div id="book" className="relative scroll-mt-28 rounded-[var(--radius-panel)] bg-sand p-6 md:p-10">
            {sent ? (
              <div className="flex min-h-[28rem] flex-col items-center justify-center text-center">
                <span className="grid size-16 place-items-center rounded-full bg-espresso text-cream"><IconCheck size={26} /></span>
                <h2 className="text-title mt-8">Thank you — request received</h2>
                <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-muted">We&apos;ll be in touch within one working day to arrange your consultation.</p>
                <button type="button" onClick={() => setSent(false)} className="mt-8 text-sm text-espresso underline decoration-line underline-offset-4 hover:decoration-espresso">Send another request</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" htmlFor="name" error={errors.name}><input id="name" name="name" autoComplete="name" placeholder="Your name" value={f.name} onChange={set("name")} className={control} /></Field>
                <Field label="Email" htmlFor="email" error={errors.email}><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={f.email} onChange={set("email")} className={control} /></Field>
                <Field label="Phone" htmlFor="phone" error={errors.phone} className="sm:col-span-2"><input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="Phone number" value={f.phone} onChange={set("phone")} className={control} /></Field>
                <Field label="Treatment of interest" htmlFor="treatment" optional className="sm:col-span-2">
                  <select id="treatment" name="treatment" value={f.treatment} onChange={set("treatment")} className={`${control} select-arrow appearance-none pr-10`}>
                    <option value="">Not sure yet</option>
                    {treatments.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </Field>
                <Field label="Preferred date" htmlFor="date" optional><input id="date" name="date" type="date" min={new Date().toISOString().slice(0, 10)} value={f.date} onChange={set("date")} className={control} /></Field>
                <Field label="Preferred time" htmlFor="time" optional>
                  <select id="time" name="time" value={f.time} onChange={set("time")} className={`${control} select-arrow appearance-none pr-10`}>
                    <option value="">Any time</option><option>Morning</option><option>Afternoon</option><option>Evening</option>
                  </select>
                </Field>
                <Field label="How can we help?" htmlFor="message" optional className="sm:col-span-2"><textarea id="message" name="message" rows={4} placeholder="Tell us about your skin goals" value={f.message} onChange={set("message")} className={`${control} resize-y`} /></Field>
                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-start gap-3 text-[0.85rem] leading-relaxed text-muted">
                    <input type="checkbox" name="consent" checked={f.consent} onChange={(e) => setF((s) => ({ ...s, consent: e.target.checked }))} className="mt-1 size-4 accent-[var(--color-espresso)]" />
                    I agree to Clinova contacting me about my consultation request.
                  </label>
                  {errors.consent && <p role="alert" className="mt-1.5 text-xs text-rose-400">{errors.consent}</p>}
                </div>
                <div className="flex flex-col-reverse items-start gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted">We reply within one working day.</p>
                  <ArrowButton type="submit" loading={busy}>Request consultation</ArrowButton>
                </div>
              </form>
            )}
          </div>
        </Reveal>
      </div>

      <Reveal className="mt-16 lg:mt-24">
        <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line">
          <iframe
            title="Map showing the clinic's location in Marylebone, London"
            loading="lazy"
            className="map-frame h-[24rem] w-full"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-0.1720%2C51.5110%2C-0.1320%2C51.5300&layer=mapnik&marker=51.5206%2C-0.1520"
          />
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          <a href="https://www.openstreetmap.org/?mlat=51.5206&mlon=-0.1520#map=16/51.5206/-0.1520" target="_blank" rel="noopener noreferrer" className="underline decoration-line underline-offset-4 hover:text-espresso">Open in maps</a>
        </p>
      </Reveal>
    </section>
  );
}