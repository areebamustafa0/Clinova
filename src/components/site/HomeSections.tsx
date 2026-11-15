"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { CONCERNS, JOURNEY } from "@/lib/site-extras";
import { formatMoney } from "@/utils/format";
import type { Treatment } from "@/types";
import { IconArrowUpRight, IconLeaf } from "./icons";
import { BillingToggle, PlanGrid } from "./Plans";
import { ArrowButton, EASE, Eyebrow, PillLink, Reveal, RevealGroup, RevealItem, SiteImg, SplitHeading } from "./ui";

/* ------------------------------ marquee ---------------------------------- */
export function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  const row = [...items, ...items];
  return (
    <section aria-label="Treatments we offer" className="overflow-hidden py-10 md:py-14 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="animate-marquee-x flex w-max hover:[animation-play-state:paused]">
        {row.map((t, i) => (
          <span key={i} aria-hidden={i >= items.length} className="flex items-center gap-10 whitespace-nowrap pr-10 font-serif text-[clamp(1.9rem,4.2vw,3.6rem)] leading-none tracking-[-0.02em] text-espresso/85">
            {t}
            <IconLeaf size={26} className="text-bronze" />
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- concern finder ------------------------------ */
export function ConcernGrid() {
  return (
    <section aria-labelledby="concerns-title" className="pb-22 lg:pb-34">
      <div className="container-site">
        <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal><Eyebrow>Start with your skin</Eyebrow></Reveal>
            <SplitHeading id="concerns-title" className="text-headline mt-6" text={"What would you\nlike to improve?"} />
          </div>
          <Reveal delay={0.1} className="max-w-sm">
            <p className="text-[0.98rem] leading-relaxed text-muted">Choose a concern and our two-minute skin quiz will suggest the treatments best suited to your skin, budget and downtime.</p>
          </Reveal>
        </div>
        <RevealGroup className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {CONCERNS.map((c) => (
            <RevealItem key={c.key}>
              <Link href={`/skin-quiz?concern=${c.key}`} className="group relative block aspect-[3/4] overflow-hidden rounded-[var(--radius-card)] bg-sand">
                <SiteImg slot={c.slot} className="transition-transform duration-[1.2s] ease-[var(--ease-editorial)] group-hover:scale-[1.06]" />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(42,26,20,0.78))]" />
                <span className="glass absolute right-3 top-3 grid size-9 place-items-center rounded-full text-ivory transition-transform duration-500 group-hover:rotate-45">
                  <IconArrowUpRight size={14} />
                </span>
                <span className="absolute inset-x-4 bottom-4 text-ivory md:inset-x-5 md:bottom-5">
                  <span className="block font-serif text-[1.15rem] leading-tight md:text-[1.4rem]">{c.label}</span>
                  <span className="mt-1 hidden text-xs text-ivory/75 sm:block">{c.blurb}</span>
                </span>
              </Link>
            </RevealItem>
          ))}
          <RevealItem>
            <Link href="/skin-quiz" className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-[var(--radius-card)] bg-espresso p-5 text-cream md:p-7">
              <div aria-hidden className="animate-aurora absolute -right-1/3 -top-1/3 size-[140%] rounded-full bg-[radial-gradient(closest-side,rgba(214,166,118,0.35),transparent)]" />
              <span className="relative text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-cream/70">Not sure?</span>
              <span className="relative">
                <span className="block font-serif text-[1.5rem] leading-tight md:text-[2rem]">Take the skin quiz</span>
                <span className="mt-4 inline-flex items-center gap-2 text-sm text-cream/80">5 questions · 2 minutes <IconArrowUpRight size={14} className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
              </span>
            </Link>
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  );
}

/* --------------------------- treatment showcase --------------------------- */
export function TreatmentShowcase({ treatments }: { treatments: Treatment[] }) {
  const [active, setActive] = useState(0);
  const t = treatments[active];
  return (
    <section id="treatments" aria-labelledby="treatments-title" className="section-y scroll-mt-20 bg-sand/50">
      <div className="container-site">
        <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal><Eyebrow>Treatments</Eyebrow></Reveal>
            <SplitHeading id="treatments-title" className="text-headline mt-6" text={"Eight ways to\nbetter skin"} />
          </div>
          <Reveal delay={0.1} className="flex flex-col items-start gap-5 md:items-end">
            <p className="max-w-sm text-[0.98rem] leading-relaxed text-muted md:text-right">Medical-grade care for every skin concern. Hover a treatment to preview it, or open it for the full details.</p>
            <ArrowButton href="/treatments" variant="outline" small>Compare all treatments</ArrowButton>
          </Reveal>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
          <ul className="border-t border-line">
            {treatments.map((tr, i) => (
              <motion.li key={tr.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -8% 0px" }} transition={{ duration: 0.8, ease: EASE, delay: 0.04 * Math.min(i, 4) }} className="border-b border-line">
                <Link
                  href={`/treatments/${tr.slug}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 md:grid-cols-[3rem_1fr_auto_auto] md:gap-6 md:py-6"
                >
                  <span className="relative size-14 overflow-hidden rounded-2xl md:hidden"><SiteImg src={tr.imageUrl ?? undefined} /></span>
                  <span className={clsx("hidden font-serif text-base transition-colors md:block", active === i ? "text-bronze" : "text-muted")}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className={clsx("block font-serif text-[1.45rem] leading-tight tracking-[-0.02em] transition-transform duration-500 ease-[var(--ease-editorial)] md:text-[2rem]", active === i && "lg:translate-x-2")}>{tr.name}</span>
                    <span className="mt-1 block truncate text-sm text-muted">{tr.tagline ?? tr.category}</span>
                  </span>
                  <span className="hidden text-right text-sm text-muted md:block">from <span className="font-medium text-espresso">{formatMoney(tr.price)}</span></span>
                  <span className={clsx("grid size-10 place-items-center rounded-full border transition-colors duration-300", active === i ? "border-espresso bg-espresso text-cream" : "border-line text-espresso")}>
                    <IconArrowUpRight size={14} />
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>

          <div className="hidden lg:block">
            <div className="sticky top-28 h-[36rem] overflow-hidden rounded-[var(--radius-panel)] bg-sand">
              <AnimatePresence mode="popLayout" initial={false}>
                {t && (
                  <motion.div key={t.id} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: EASE }} className="absolute inset-0">
                    <SiteImg src={t.imageUrl ?? undefined} />
                  </motion.div>
                )}
              </AnimatePresence>
              <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(42,26,20,0.65))]" />
              {t && (
                <motion.div key={`info-${t.id}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }} className="glass-warm absolute inset-x-4 bottom-4 rounded-2xl p-5 text-ivory">
                  <p className="font-serif text-[1.6rem] leading-tight">{t.name}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ivory/80">{t.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[t.durationLabel ?? `${t.durationMinutes} min`, t.sessions && `${t.sessions} sessions`, t.downtime && `Downtime: ${t.downtime}`].filter(Boolean).map((chip) => (
                      <span key={chip as string} className="rounded-full bg-ivory/15 px-3 py-1 text-[0.7rem]">{chip}</span>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <ArrowButton href={`/dashboard/book?treatmentId=${t.id}`} variant="ivory" small>Book from {formatMoney(t.price)}</ArrowButton>
                    <Link href={`/treatments/${t.slug}`} className="text-sm text-ivory/85 underline decoration-ivory/40 underline-offset-4 hover:text-ivory">Details</Link>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ how it works ------------------------------ */
export function HowItWorks() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.6"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <section aria-labelledby="journey-title" className="section-y">
      <div className="container-site grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Reveal><Eyebrow>How it works</Eyebrow></Reveal>
          <SplitHeading id="journey-title" className="text-headline mt-6" text={"From first visit\nto lasting results"} />
          <Reveal delay={0.1}><p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-muted">A clear, medical pathway — so you always know what happens next, what it costs and what to expect.</p></Reveal>
          <Reveal delay={0.2} className="mt-10 flex flex-wrap items-center gap-4">
            <ArrowButton href="/contact#book">Book your consultation</ArrowButton>
            <span className="text-sm text-muted">Complimentary skin analysis included</span>
          </Reveal>
        </div>
        <ol ref={ref} className="relative pl-12 md:pl-16">
          <span aria-hidden className="absolute bottom-3 left-[1.125rem] top-3 w-px bg-line md:left-[1.375rem]" />
          <motion.span aria-hidden style={{ scaleY }} className="absolute bottom-3 left-[1.125rem] top-3 w-px origin-top bg-bronze md:left-[1.375rem]" />
          {JOURNEY.map((s, i) => (
            <li key={s.title} className="relative pb-6 last:pb-0 md:pb-8">
              <span className="absolute -left-12 top-6 grid size-9 place-items-center rounded-full border border-line bg-cream font-serif text-sm text-bronze md:-left-16 md:top-8 md:size-11">{String(i + 1).padStart(2, "0")}</span>
              <Reveal className="rounded-[var(--radius-card)] bg-sand p-7 md:p-9">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-title">{s.title}</h3>
                  <span className="rounded-full bg-card px-3 py-1.5 text-xs text-espresso">{s.time}</span>
                </div>
                <p className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-muted">{s.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------ memberships ------------------------------- */
export function MembershipTeaser() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  return (
    <section aria-labelledby="plans-title" className="section-y bg-sand/50">
      <div className="container-site">
        <div className="mb-12 flex flex-col items-center text-center md:mb-16">
          <Reveal><Eyebrow>Memberships</Eyebrow></Reveal>
          <SplitHeading id="plans-title" className="text-headline mt-6" text={"Better skin,\nas a routine"} />
          <Reveal delay={0.1}><p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-muted">Consistent care gives the best results. Members enjoy a monthly treatment, priority booking and savings on everything else.</p></Reveal>
          <Reveal delay={0.15} className="mt-8"><BillingToggle value={billing} onChange={setBilling} /></Reveal>
        </div>
        <PlanGrid billing={billing} />
        <Reveal className="mt-10 flex justify-center"><PillLink href="/pricing">See full pricing &amp; estimate your plan</PillLink></Reveal>
      </div>
    </section>
  );
}
