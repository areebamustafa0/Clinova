"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { errorMessage, post } from "@/lib/http";
import { GROUPS } from "@/lib/site-content";
import { PLANS, PRICING_FAQS } from "@/lib/site-extras";
import { formatMoney } from "@/utils/format";
import type { Treatment } from "@/types";
import { FaqList } from "./Faq";
import { IconArrowUpRight, IconCheck } from "./icons";
import { BillingToggle, PlanGrid, type Billing } from "./Plans";
import { ArrowButton, EASE, Eyebrow, Reveal, SplitHeading } from "./ui";

export function PricingView({ treatments }: { treatments: Treatment[] }) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [qty, setQty] = useState<Record<number, number>>(() => (treatments[0] ? { [treatments[0].id]: 1 } : {}));
  const [plan, setPlan] = useState<string>("none");

  const lines = treatments.filter((t) => (qty[t.id] ?? 0) > 0).map((t) => ({ t, n: qty[t.id], total: t.price * qty[t.id] }));
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const p = PLANS.find((x) => x.key === plan);
  const discount = p ? Math.round((subtotal * p.discount) / 100) : 0;
  const total = subtotal - discount;
  const sessions = lines.reduce((s, l) => s + l.n, 0);

  const grouped = useMemo(
    () => [
      ...GROUPS.map((g) => ({ label: g.label, items: treatments.filter((t) => g.slugs.includes(t.slug ?? "")) })),
      { label: "Other", items: treatments.filter((t) => !GROUPS.some((g) => g.slugs.includes(t.slug ?? ""))) },
    ].filter((g) => g.items.length),
    [treatments],
  );

  const set = (id: number, n: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(10, n)) }));

  return (
    <>
      <section aria-labelledby="plans-title" className="pb-22 lg:pb-34">
        <div className="container-site">
          <div className="mb-12 flex flex-col items-center text-center">
            <Reveal><BillingToggle value={billing} onChange={setBilling} /></Reveal>
          </div>
          <h2 id="plans-title" className="sr-only">Memberships</h2>
          <PlanGrid billing={billing} />
        </div>
      </section>

      <section aria-labelledby="estimator-title" className="section-y bg-sand/50">
        <div className="container-site">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <Reveal><Eyebrow>Plan estimator</Eyebrow></Reveal>
              <SplitHeading id="estimator-title" className="text-headline mt-6" text={"Build your\ntreatment plan"} />
            </div>
            <Reveal delay={0.1} className="max-w-sm"><p className="text-[0.98rem] leading-relaxed text-muted">Add the treatments you&apos;re considering, choose the number of sessions and see how a membership changes the total.</p></Reveal>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-8">
              {grouped.map((g) => (
                <Reveal key={g.label}>
                  <p className="mb-3 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted">{g.label}</p>
                  <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-card">
                    {g.items.map((t) => {
                      const n = qty[t.id] ?? 0;
                      return (
                        <li key={t.id} className={clsx("flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors md:px-6", n > 0 && "bg-sand/60")}>
                          <div className="min-w-0">
                            <Link href={`/treatments/${t.slug}`} className="font-serif text-[1.2rem] leading-tight hover:text-bronze">{t.name}</Link>
                            <p className="mt-0.5 text-xs text-muted">{t.durationLabel ?? `${t.durationMinutes} min`}{t.sessions ? ` · typically ${t.sessions} sessions` : ""}{t.downtime ? ` · downtime ${t.downtime.toLowerCase()}` : ""}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="w-20 text-right text-sm">from <span className="font-medium">{formatMoney(t.price)}</span></span>
                            <div className="flex items-center rounded-full border border-line bg-card" role="group" aria-label={`${t.name} sessions`}>
                              <button type="button" onClick={() => set(t.id, n - 1)} disabled={n === 0} aria-label={`Fewer ${t.name} sessions`} className="grid size-9 place-items-center rounded-full transition-colors hover:bg-sand disabled:opacity-30"><Minus size={14} /></button>
                              <span className="w-6 text-center text-sm font-medium tabular-nums" aria-live="polite">{n}</span>
                              <button type="button" onClick={() => set(t.id, n + 1)} aria-label={`More ${t.name} sessions`} className="grid size-9 place-items-center rounded-full transition-colors hover:bg-sand"><Plus size={14} /></button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Reveal>
              ))}
            </div>

            <div>
              <div className="sticky top-28 overflow-hidden rounded-[var(--radius-panel)] bg-[#2a1a14] p-7 text-ivory md:p-9">
                <div aria-hidden className="animate-aurora pointer-events-none absolute -right-1/3 -top-1/3 size-[120%] rounded-full bg-[radial-gradient(closest-side,rgba(214,166,118,0.25),transparent)]" />
                <p className="relative text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ivory/60">Your estimate</p>
                <ul className="relative mt-5 space-y-2.5 text-sm">
                  <AnimatePresence initial={false}>
                    {lines.length === 0 && <motion.li key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-ivory/60">Add a treatment to begin.</motion.li>}
                    {lines.map((l) => (
                      <motion.li key={l.t.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3 }} className="flex justify-between gap-4">
                        <span className="text-ivory/80">{l.t.name} × {l.n}</span>
                        <span>{formatMoney(l.total)}</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <label htmlFor="estimate-plan" className="relative mt-7 block text-xs text-ivory/60">Apply a membership</label>
                <select id="estimate-plan" value={plan} onChange={(e) => setPlan(e.target.value)} className="relative mt-2 h-11 w-full appearance-none rounded-full border border-ivory/20 bg-ivory/10 px-4 text-sm text-ivory focus:outline-none [&>option]:text-[#2a1a14]">
                  <option value="none">No membership</option>
                  {PLANS.map((x) => <option key={x.key} value={x.key}>{x.name} · {x.discount}% off · £{x.monthly}/mo</option>)}
                </select>

                <dl className="relative mt-7 space-y-2 border-t border-ivory/15 pt-5 text-sm">
                  <div className="flex justify-between"><dt className="text-ivory/70">Subtotal ({sessions} {sessions === 1 ? "session" : "sessions"})</dt><dd>{formatMoney(subtotal)}</dd></div>
                  {p && <div className="flex justify-between text-[#e3bd93]"><dt>{p.name} saving ({p.discount}%)</dt><dd>−{formatMoney(discount)}</dd></div>}
                </dl>
                <div className="relative mt-5 flex items-end justify-between">
                  <span className="text-sm text-ivory/70">Estimated total</span>
                  <motion.span key={total} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-[3rem] leading-none tracking-[-0.03em]">{formatMoney(total)}</motion.span>
                </div>
                {p && <p className="relative mt-2 text-right text-xs text-ivory/60">plus £{p.monthly}/month membership</p>}
                <EstimateActions lines={lines.map((l) => `${l.t.name} × ${l.n} = ${formatMoney(l.total)}`)} summary={`Subtotal ${formatMoney(subtotal)}${p ? `, ${p.name} membership −${formatMoney(discount)}` : ""}, estimated total ${formatMoney(total)}`} disabled={lines.length === 0} firstTreatmentId={lines[0]?.t.id} />
                <p className="relative mt-5 text-[0.7rem] leading-relaxed text-ivory/50">Guide prices only. Your doctor confirms the exact plan and cost in writing after your consultation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="section-y">
        <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Reveal><Eyebrow>Pricing FAQs</Eyebrow></Reveal>
            <SplitHeading id="faq-title" className="text-headline mt-6" text={"Clear prices,\nno surprises"} />
            <Reveal delay={0.1}>
              <ul className="mt-8 space-y-3 text-[0.95rem]">
                {["Written, itemised plan before you begin", "Interest-free payments on plans over £600", "Free rescheduling up to 2 hours before"].map((x) => (
                  <li key={x} className="flex items-center gap-3"><IconCheck size={16} className="text-bronze" />{x}</li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={0.1}><FaqList items={PRICING_FAQS} /></Reveal>
        </div>
      </section>
    </>
  );
}

function EstimateActions({ lines, summary, disabled, firstTreatmentId }: { lines: string[]; summary: string; disabled: boolean; firstTreatmentId?: number }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address");
    setError("");
    setState("busy");
    try {
      await post("/contact", { name: "Pricing estimate request", email: email.trim(), subject: "Treatment plan estimate", message: [...lines, "", summary, "", "Please send me a confirmed quote."].join("\n") });
      setState("done");
    } catch (err) {
      setError(errorMessage(err));
      setState("idle");
    }
  }

  return (
    <div className="relative mt-7">
      <div className="flex flex-wrap items-center gap-3">
        <ArrowButton href={firstTreatmentId ? `/dashboard/book?treatmentId=${firstTreatmentId}` : "/dashboard/book"} variant="ivory" small>Book now</ArrowButton>
        <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 text-sm text-ivory/85 underline decoration-ivory/40 underline-offset-4 hover:text-ivory disabled:opacity-40">
          Email me a quote <IconArrowUpRight size={13} />
        </button>
      </div>
      <AnimatePresence>
        {open && !disabled && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
            {state === "done" ? (
              <p className="pt-4 text-sm text-[#e3bd93]">Thank you — we&apos;ll send a confirmed quote within one working day.</p>
            ) : (
              <form onSubmit={send} noValidate className="flex items-center gap-1 pt-4">
                <label htmlFor="quote-email" className="sr-only">Email address</label>
                <input id="quote-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-10 min-w-0 flex-1 rounded-full border border-ivory/20 bg-ivory/10 px-4 text-sm text-ivory placeholder:text-ivory/50 focus:outline-none" />
                <button type="submit" disabled={state === "busy"} className="h-10 rounded-full bg-ivory px-4 text-sm font-medium text-[#2a1a14] disabled:opacity-60">{state === "busy" ? "…" : "Send"}</button>
              </form>
            )}
            {error && <p role="alert" className="pt-2 text-xs text-rose-300">{error}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
