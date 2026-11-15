"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { errorMessage, post } from "@/lib/http";
import { CONCERNS, QUIZ_STEPS, TRAITS } from "@/lib/site-extras";
import { formatMoney } from "@/utils/format";
import type { Treatment } from "@/types";
import { IconArrowLeft, IconCheck } from "./icons";
import { ArrowButton, EASE, SiteImg } from "./ui";

type Answers = { concerns: string[]; skin?: string; downtime?: string; approach?: string; budget?: string };
type Result = { t: Treatment; score: number; match: number; reasons: string[] };

const TOL: Record<string, number> = { none: 0, short: 1, week: 3 };
const BUDGET: Record<string, number> = { low: 200, mid: 300, high: Infinity };

function recommend(treatments: Treatment[], a: Answers): Result[] {
  const scored = treatments
    .filter((t) => t.slug && TRAITS[t.slug])
    .map((t) => {
      const trait = TRAITS[t.slug!];
      let score = 0;
      const reasons: string[] = [];
      a.concerns.forEach((key, idx) => {
        const c = CONCERNS.find((x) => x.key === key);
        const w = c?.weights[t.slug!] ?? 0;
        if (w > 0) {
          score += w * (idx === 0 ? 1 : 0.7);
          reasons.push(`Targets ${c!.label.toLowerCase()}`);
        }
      });
      const tol = TOL[a.downtime ?? "week"];
      if (trait.downtime > tol) score -= 2.5 * (trait.downtime - tol);
      else reasons.push(t.downtime ? `Downtime: ${t.downtime.toLowerCase()}` : "Fits your downtime");
      if (a.approach === "gentle" && trait.kind !== "skin") score -= trait.kind === "injectable" ? 6 : 4;
      if (a.approach === "no-needles" && trait.kind === "injectable") score -= 6;
      const max = BUDGET[a.budget ?? "high"];
      if (t.price > max) score -= t.price - max > 100 ? 2 : 1;
      else if (a.budget && a.budget !== "high") reasons.push("Within your budget");
      if (a.skin === "sensitive") {
        if (trait.downtime >= 2) score -= 1.5;
        if (t.slug === "facial-treatments" || t.slug === "skin-rejuvenation") { score += 1; reasons.push("Gentle on sensitive skin"); }
      }
      if (a.skin === "oily" && t.slug === "acne") score += 0.7;
      if (a.skin === "dry" && (t.slug === "skin-boosters" || t.slug === "facial-treatments")) { score += 1; reasons.push("Deeply hydrating for dry skin"); }
      return { t, score, reasons: [...new Set(reasons)].slice(0, 3) };
    })
    .filter((r) => r.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3);
  const top = scored[0]?.score ?? 1;
  return scored.map((r, i) => ({ ...r, match: Math.max(62, Math.min(98, Math.round(96 - i * 4 - ((top - r.score) / top) * 30))) }));
}

const optionCls = (selected: boolean) =>
  clsx(
    "group relative flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-300",
    selected ? "border-espresso bg-sand shadow-[0_0_0_1px_var(--color-espresso)]" : "border-line bg-card hover:border-espresso/40 hover:bg-sand/50",
  );

export function SkinQuiz({ treatments, initialConcern }: { treatments: Treatment[]; initialConcern?: string }) {
  const valid = CONCERNS.some((c) => c.key === initialConcern) ? [initialConcern!] : [];
  const [answers, setAnswers] = useState<Answers>({ concerns: valid });
  const [step, setStep] = useState(valid.length ? 1 : 0);
  const [dir, setDir] = useState(1);
  const total = QUIZ_STEPS.length + 1;
  const done = step >= total;
  const results = useMemo(() => (done ? recommend(treatments, answers) : []), [done, treatments, answers]);

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleConcern = (key: string) =>
    setAnswers((a) => {
      if (a.concerns.includes(key)) return { ...a, concerns: a.concerns.filter((k) => k !== key) };
      return { ...a, concerns: [...a.concerns, key].slice(-2) };
    });
  const pick = (key: keyof Omit<Answers, "concerns">, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    window.setTimeout(() => go(step + 1), 260);
  };
  const restart = () => {
    setAnswers({ concerns: [] });
    go(0);
  };

  const current = step >= 1 && step <= QUIZ_STEPS.length ? QUIZ_STEPS[step - 1] : null;
  const variants = { enter: (d: number) => ({ opacity: 0, x: d * 40 }), center: { opacity: 1, x: 0 }, exit: (d: number) => ({ opacity: 0, x: d * -40 }) };

  return (
    <div className="mx-auto max-w-5xl">
      {!done && (
        <div className="mb-10">
          <div className="mb-3 flex items-center justify-between text-xs text-muted">
            <span>Question {step + 1} of {total}</span>
            <span>{Math.round((step / total) * 100)}% complete</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuenow={step} aria-valuemin={0} aria-valuemax={total}>
            <motion.div className="h-full rounded-full bg-bronze" animate={{ width: `${(step / total) * 100}%` }} transition={{ duration: 0.6, ease: EASE }} />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.45, ease: EASE }}>
          {step === 0 && (
            <section aria-labelledby="q-title">
              <h2 id="q-title" className="text-title">What would you most like to improve?</h2>
              <p className="mt-2 text-[0.95rem] text-muted">Choose up to two — your first choice carries the most weight.</p>
              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                {CONCERNS.map((c) => {
                  const idx = answers.concerns.indexOf(c.key);
                  const selected = idx >= 0;
                  return (
                    <button key={c.key} type="button" aria-pressed={selected} onClick={() => toggleConcern(c.key)} className={clsx("group relative overflow-hidden rounded-[var(--radius-card)] border text-left transition-all duration-300", selected ? "border-espresso shadow-[0_0_0_1px_var(--color-espresso)]" : "border-line hover:border-espresso/40")}>
                      <span className="relative block aspect-[4/3] overflow-hidden bg-sand"><SiteImg slot={c.slot} className="transition-transform duration-700 group-hover:scale-105" /></span>
                      <span className="block bg-card p-4">
                        <span className="block font-serif text-[1.08rem] leading-tight">{c.label}</span>
                        <span className="mt-1 block text-xs text-muted">{c.blurb}</span>
                      </span>
                      {selected && <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-espresso text-xs font-semibold text-cream">{idx + 1}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="mt-10 flex justify-end">
                <ArrowButton onClick={() => go(1)} disabled={answers.concerns.length === 0}>Continue</ArrowButton>
              </div>
            </section>
          )}

          {current && (
            <section aria-labelledby="q-title">
              <h2 id="q-title" className="text-title">{current.title}</h2>
              <p className="mt-2 text-[0.95rem] text-muted">{current.sub}</p>
              <div className={clsx("mt-8 grid gap-3", current.options.length > 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3")}>
                {current.options.map((o) => {
                  const selected = answers[current.key] === o.value;
                  return (
                    <button key={o.value} type="button" aria-pressed={selected} onClick={() => pick(current.key, o.value)} className={optionCls(selected)}>
                      <span className={clsx("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-colors", selected ? "border-espresso bg-espresso text-cream" : "border-line")}>{selected && <IconCheck size={13} />}</span>
                      <span>
                        <span className="block font-serif text-[1.2rem] leading-tight">{o.label}</span>
                        {o.hint && <span className="mt-1 block text-sm text-muted">{o.hint}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-10 flex items-center justify-between">
                <button type="button" onClick={() => go(step - 1)} className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-espresso"><IconArrowLeft size={15} /> Back</button>
                {answers[current.key] && <ArrowButton onClick={() => go(step + 1)} variant="outline" small>Next</ArrowButton>}
              </div>
            </section>
          )}

          {done && <QuizResults results={results} answers={answers} onRestart={restart} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function QuizResults({ results, answers, onRestart }: { results: Result[]; answers: Answers; onRestart: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");
  const labels = [
    ...answers.concerns.map((k) => CONCERNS.find((c) => c.key === k)?.label ?? k),
    ...QUIZ_STEPS.map((s) => s.options.find((o) => o.value === answers[s.key])?.label).filter(Boolean),
  ] as string[];

  async function send(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Please tell us your name");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address");
    setError("");
    setState("busy");
    try {
      await post("/contact", {
        name: name.trim(),
        email: email.trim(),
        subject: "Skin quiz – personalised plan",
        message: [`Answers: ${labels.join(" · ")}`, "", "Recommended:", ...results.map((r, i) => `${i + 1}. ${r.t.name} (${r.match}% match, from ${formatMoney(r.t.price)})`), "", "Please contact me to discuss this plan."].join("\n"),
      });
      setState("done");
    } catch (err) {
      setError(errorMessage(err));
      setState("idle");
    }
  }

  return (
    <section aria-labelledby="results-title">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-bronze">Your personalised plan</p>
          <h2 id="results-title" className="text-headline mt-4 !text-[clamp(2.2rem,4.4vw,3.8rem)]">We&apos;d suggest starting with…</h2>
          <div className="mt-5 flex flex-wrap gap-2">{labels.map((l) => <span key={l} className="rounded-full bg-sand px-3 py-1.5 text-xs">{l}</span>)}</div>
        </div>
        <button type="button" onClick={onRestart} className="inline-flex shrink-0 items-center gap-2 text-sm text-muted transition-colors hover:text-espresso"><RotateCcw size={15} /> Retake the quiz</button>
      </div>

      {results.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius-card)] bg-sand p-10 text-center">
          <p className="font-serif text-2xl">Let&apos;s talk it through</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">Your preferences rule out most treatments, which is completely fine. A consultation is the best next step — your doctor will find the right approach.</p>
          <ArrowButton href="/contact#book" className="mt-6">Request a consultation</ArrowButton>
        </div>
      ) : (
        <ol className="mt-10 grid gap-4 lg:grid-cols-3">
          {results.map((r, i) => (
            <motion.li key={r.t.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 + i * 0.1 }} className={clsx("flex flex-col overflow-hidden rounded-[var(--radius-card)]", i === 0 ? "bg-[#2a1a14] text-ivory" : "bg-sand")}>
              <div className="relative aspect-[16/10] overflow-hidden">
                <SiteImg src={r.t.imageUrl ?? undefined} />
                <span className="glass absolute left-4 top-4 rounded-full px-3 py-1 text-[0.7rem] font-medium text-ivory">{i === 0 ? "Best match" : `Option ${i + 1}`}</span>
                <span className="absolute right-4 top-4 rounded-full bg-ivory px-3 py-1 text-[0.72rem] font-semibold text-[#2a1a14]">{r.match}% match</span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-serif text-[1.6rem] leading-tight">{r.t.name}</h3>
                <p className={clsx("mt-2 text-sm leading-relaxed", i === 0 ? "text-ivory/75" : "text-muted")}>{r.t.description}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {r.reasons.map((x) => (
                    <li key={x} className="flex items-start gap-2.5"><IconCheck size={15} className={clsx("mt-0.5 shrink-0", i === 0 ? "text-[#e3bd93]" : "text-bronze")} />{x}</li>
                  ))}
                </ul>
                <div className={clsx("mt-6 flex items-center justify-between border-t pt-5 text-sm", i === 0 ? "border-ivory/15" : "border-line")}>
                  <span>from <span className="font-serif text-xl">{formatMoney(r.t.price)}</span></span>
                  <span className={i === 0 ? "text-ivory/70" : "text-muted"}>{r.t.durationLabel ?? `${r.t.durationMinutes} min`}</span>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                  <ArrowButton href={`/dashboard/book?treatmentId=${r.t.id}`} variant={i === 0 ? "ivory" : "espresso"} small>Book</ArrowButton>
                  <Link href={`/treatments/${r.t.slug}`} className={clsx("text-sm underline underline-offset-4", i === 0 ? "decoration-ivory/40" : "decoration-line")}>Learn more</Link>
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[var(--radius-card)] bg-sand p-7 md:p-9">
          <p className="font-serif text-[1.5rem] leading-tight">Email me this plan</p>
          <p className="mt-2 text-sm text-muted">We&apos;ll send your recommendations and a clinician will follow up to answer any questions.</p>
          {state === "done" ? (
            <p className="mt-6 flex items-center gap-2 text-sm"><IconCheck size={16} className="text-bronze" /> Sent — we&apos;ll be in touch within one working day.</p>
          ) : (
            <form onSubmit={send} noValidate className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="sr-only" htmlFor="quiz-name">Name</label>
              <input id="quiz-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" className="h-12 rounded-full border border-line bg-card px-5 text-sm placeholder:text-muted/70 focus:border-espresso/50 focus:outline-none" />
              <label className="sr-only" htmlFor="quiz-email">Email</label>
              <input id="quiz-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="h-12 rounded-full border border-line bg-card px-5 text-sm placeholder:text-muted/70 focus:border-espresso/50 focus:outline-none" />
              <ArrowButton type="submit" loading={state === "busy"}>Send</ArrowButton>
              {error && <p role="alert" className="text-xs text-rose-400 sm:col-span-3">{error}</p>}
            </form>
          )}
        </div>
        <div className="flex flex-col justify-between rounded-[var(--radius-card)] border border-line p-7 md:p-9">
          <p className="text-sm leading-relaxed text-muted">These suggestions are a starting point, not a diagnosis. Every treatment begins with a medical consultation where your doctor confirms what&apos;s right — and safe — for your skin.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ArrowButton href="/contact#book" variant="outline" small>Book a consultation</ArrowButton>
            <Link href="/pricing" className="self-center text-sm underline decoration-line underline-offset-4">Estimate costs</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
