"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import clsx from "clsx";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import { DoctorFeature } from "@/components/site/DoctorFeature";
import { FaqList } from "@/components/site/Faq";
import { QuickBook } from "@/components/site/QuickBook";
import { Hero } from "@/components/site/Hero";
import { ConcernGrid, HowItWorks, Marquee, MembershipTeaser, TreatmentShowcase } from "@/components/site/HomeSections";
import { EditorialSplit } from "@/components/site/EditorialSplit";
import { ResultsGallery } from "@/components/site/ResultsGallery";
import { RewardsBand } from "@/components/site/RewardsBand";
import { IconArrowLeft, IconArrowRight, IconArrowUpRight, IconCheck } from "@/components/site/icons";
import { ArrowButton, CtaPanel, EASE, Eyebrow, ParallaxImg, Reveal, RevealGroup, RevealItem, SiteImg, SplitHeading, StarRow } from "@/components/site/ui";
import { HOME_FAQS, TESTIMONIALS } from "@/lib/site-content";
import type { Doctor, Treatment } from "@/types";

const BOOKING = "/contact#book";

/* ------------------------------- intro ------------------------------------ */
type Token = string | { key: string; slot: string };

const TOKENS: Token[] = [
  "We combine medical expertise with modern aesthetics",
  { key: "i1", slot: "glow-lips" },
  "to help you achieve clear, healthy and naturally radiant skin",
  { key: "i2", slot: "portrait-soft" },
  "without ever looking done.",
];

function Word({ progress, range, children }: { progress: MotionValue<number>; range: [number, number]; children: ReactNode }) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (<><motion.span style={{ opacity }}>{children}</motion.span>{" "}</>);
}

function Pill({ progress, range, slot }: { progress: MotionValue<number>; range: [number, number]; slot: string }) {
  const scale = useTransform(progress, range, [0.6, 1]);
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <>
      <motion.span aria-hidden className="inline-block align-middle" style={{ scale, opacity }}>
        <span className="relative inline-block h-[0.82em] w-[1.7em] translate-y-[-0.06em] overflow-hidden rounded-full"><SiteImg slot={slot} /></span>
      </motion.span>{" "}
    </>
  );
}

function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const flat = TOKENS.flatMap((t): Token[] => (typeof t === "string" ? t.split(" ").filter(Boolean) : [t]));
  const n = flat.length;
  return (
    <p ref={ref} className="text-statement mt-8 max-w-4xl text-espresso">
      {flat.map((tok, i) => {
        const range: [number, number] = [i / n, (i + 1) / n];
        return typeof tok === "string" ? <Word key={i} progress={scrollYProgress} range={range}>{tok}</Word> : <Pill key={tok.key} progress={scrollYProgress} range={range} slot={tok.slot} />;
      })}
    </p>
  );
}

const FLOATERS = [
  { slot: "facial-treatment", className: "left-[2%] top-[4%] w-[13%] aspect-[4/5]", speed: -90 },
  { slot: "skin-boosters", className: "right-[4%] top-[12%] w-[11%] aspect-[3/4]", speed: -160 },
  { slot: "skincare-ritual", className: "left-[8%] bottom-[2%] w-[10%] aspect-[3/4]", speed: -200 },
  { slot: "led-therapy", className: "right-[1%] bottom-[-4%] w-[14%] aspect-[4/5]", speed: -110 },
];

function Floater({ slot, className, speed, progress }: (typeof FLOATERS)[number] & { progress: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const y = useTransform(progress, [0, 1], [0, speed]);
  return (
    <motion.div aria-hidden className={clsx("absolute hidden overflow-hidden rounded-[1.25rem] md:block", className)} style={{ y: reduce ? 0 : y }} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: EASE }}>
      <SiteImg slot={slot} />
    </motion.div>
  );
}

function Intro() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  return (
    <section ref={ref} aria-label="Introduction" className="section-y relative overflow-hidden">
      {FLOATERS.map((f) => <Floater key={f.slot} {...f} progress={scrollYProgress} />)}
      <div className="container-narrow relative flex flex-col items-center text-center">
        <Reveal><Eyebrow>Expert care for every skin journey</Eyebrow></Reveal>
        <Statement />
        <Reveal delay={0.1} className="mt-10 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-espresso font-serif text-sm text-cream">4.9</span>
          <span className="text-left">
            <StarRow className="text-bronze" />
            <span className="mt-0.5 block text-xs text-muted">Rated 4.9 by 600+ clients</span>
          </span>
        </Reveal>
        <div className="mt-14 grid w-full grid-cols-3 gap-3 md:hidden">
          {["facial-treatment", "skin-boosters", "led-therapy"].map((s, i) => (
            <Reveal key={s} delay={0.08 * i} className="relative aspect-[3/4] overflow-hidden rounded-2xl"><SiteImg slot={s} /></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- results --------------------------------- */
function Results() {
  const marquee = [...TESTIMONIALS, ...TESTIMONIALS];
  const card = "relative overflow-hidden rounded-[var(--radius-card)] bg-sand";
  return (
    <section aria-labelledby="results-title" className="section-y">
      <div className="container-site">
        <div className="mb-14 flex flex-col items-center text-center md:mb-16">
          <Reveal><Eyebrow>Why clients choose us</Eyebrow></Reveal>
          <SplitHeading id="results-title" className="text-headline mt-6" text={"Results that feel\nlike you"} />
        </div>
        <RevealGroup className="bento grid gap-3 md:grid-cols-2 md:gap-4">
          <RevealItem className="[--area:ba] md:row-span-2">
            <BeforeAfter className="aspect-[4/5] h-full rounded-[var(--radius-card)] md:aspect-auto md:min-h-[34rem]">
              <div className="glass-warm pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl px-5 py-4 text-ivory">
                <p className="font-serif text-xl">Real results, real clients</p>
                <p className="mt-1 text-xs text-ivory/80">12 weeks · Skin rejuvenation &amp; anti-aging</p>
              </div>
            </BeforeAfter>
          </RevealItem>
          <RevealItem className={clsx(card, "[--area:exp] flex min-h-[16rem] flex-col justify-between p-6 md:p-7")}>
            <h3 className="text-[1.6rem] leading-tight">A calm, unhurried<br />experience</h3>
            <div className="relative -mx-7 -mb-7 mt-6 h-40 overflow-hidden md:-mx-7"><SiteImg slot="clinic-consultation" /></div>
          </RevealItem>
          <RevealItem className={clsx(card, "[--area:stat] flex min-h-[16rem] flex-col p-6 md:p-7")}>
            <p className="font-serif text-[3.4rem] leading-none">12+</p>
            <p className="mt-2 text-sm text-muted">Years of medical aesthetics</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-card px-3 py-1.5 text-xs text-espresso">4,800+ treatments</span>
              <span className="rounded-full bg-card px-3 py-1.5 text-xs text-espresso">30+ protocols</span>
            </div>
            <p className="mt-auto translate-y-3 whitespace-nowrap font-serif text-[3.2rem] leading-none text-espresso/10 lg:text-[2.9rem] xl:text-[3.8rem]">Since 2014</p>
          </RevealItem>
          <RevealItem className={clsx(card, "[--area:tail] flex min-h-[16rem] flex-col items-center justify-center p-7 text-center")}>
            <div className="flex -space-x-4">
              {[["portrait-natural", "mt-3 size-14"], ["portrait-radiant", "z-10 size-20"], ["portrait-soft", "mt-3 size-14"]].map(([s, c]) => (
                <span key={s} className={clsx("relative overflow-hidden rounded-full ring-4 ring-sand", c)}><SiteImg slot={s} /></span>
              ))}
            </div>
            <h3 className="mt-6 text-[1.6rem] leading-tight">Tailored to your skin</h3>
            <p className="mt-2 max-w-[16rem] text-sm text-muted">A personal plan for every skin type, tone and goal.</p>
          </RevealItem>
          <RevealItem className={clsx(card, "[--area:rate] flex min-h-[26rem] flex-col p-6 md:p-7")}>
            <div className="text-center">
              <StarRow size={14} className="justify-center text-bronze" />
              <p className="mt-3 font-serif text-[3.2rem] leading-none">4.9</p>
              <p className="mt-2 text-sm text-muted">Average rating from 600+ clients</p>
            </div>
            <div className="relative mt-6 flex-1 overflow-hidden [mask-image:linear-gradient(transparent,#000_18%,#000_82%,transparent)]">
              <ul className="animate-marquee-y absolute inset-x-0 top-0 space-y-3 hover:[animation-play-state:paused]">
                {marquee.map((t, i) => (
                  <li key={i} className="rounded-2xl bg-card p-4">
                    <p className="text-[0.82rem] leading-relaxed text-espresso/85">“{t.quote}”</p>
                    <p className="mt-3 text-xs font-medium text-espresso">{t.name} <span className="font-normal text-muted">· {t.treatment}</span></p>
                  </li>
                ))}
              </ul>
            </div>
          </RevealItem>
          <RevealItem className={clsx(card, "[--area:free] flex min-h-[16rem] flex-col items-center justify-center p-7 text-center")}>
            <span className="rounded-full bg-card px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-bronze">Complimentary</span>
            <h3 className="mt-4 text-[1.6rem] leading-tight">Skin analysis</h3>
            <p className="mt-2 text-sm text-muted">A clinical assessment with your first consultation.</p>
            <ArrowButton href={BOOKING} className="mt-6">Book now</ArrowButton>
          </RevealItem>
          <RevealItem className="min-h-[16rem] [--area:img]">
            <ParallaxImg slot="ipl-laser" reveal={false} className="h-full min-h-[16rem] rounded-[var(--radius-card)]" />
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  );
}

/* ----------------------------- testimonials ------------------------------- */
function Testimonials() {
  const list = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = list.current;
    if (!el) return;
    const li = el.querySelector("li");
    el.scrollBy({ left: dir * ((li?.clientWidth ?? 320) + 16), behavior: "smooth" });
  };
  const arrow = "grid size-11 place-items-center rounded-full border border-line text-espresso transition-colors duration-300 hover:bg-espresso hover:text-cream";
  return (
    <section aria-labelledby="testimonials-title" className="section-y bg-sand/50">
      <div className="container-site grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="min-w-0">
          <div className="flex items-end justify-between gap-6">
            <div>
              <Reveal><Eyebrow>Client stories</Eyebrow></Reveal>
              <SplitHeading id="testimonials-title" className="text-headline mt-6" text={"What our\nclients say"} />
            </div>
            <div className="hidden gap-2 sm:flex">
              <button type="button" aria-label="Previous testimonial" onClick={() => scroll(-1)} className={arrow}><IconArrowLeft /></button>
              <button type="button" aria-label="Next testimonial" onClick={() => scroll(1)} className={arrow}><IconArrowRight /></button>
            </div>
          </div>
          <Reveal delay={0.1}>
            <ul ref={list} data-lenis-prevent-wheel className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 md:-mx-0 md:scroll-px-0 md:px-0">
              {TESTIMONIALS.map((t) => (
                <li key={t.name} className="flex w-[84%] shrink-0 snap-start flex-col justify-between rounded-[var(--radius-card)] bg-card p-7 sm:w-[21rem] md:min-h-[19rem]">
                  <div>
                    <StarRow className="text-bronze" label />
                    <blockquote className="mt-5 font-serif text-[1.22rem] leading-snug text-espresso [font-variant-ligatures:no-common-ligatures]">“{t.quote}”</blockquote>
                  </div>
                  <p className="mt-8 flex items-center gap-3 text-sm">
                    <span className="grid size-9 place-items-center rounded-full bg-sand font-serif text-espresso">{t.name[0]}</span>
                    <span><span className="block font-medium">{t.name}</span><span className="block text-xs text-muted">{t.treatment}</span></span>
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={0.15} className="relative min-h-[26rem] overflow-hidden rounded-[var(--radius-panel)] lg:min-h-0">
          <SiteImg slot="portrait-editorial" className="object-[50%_20%]" />
          <div className="glass-warm absolute inset-x-4 bottom-4 flex flex-col items-center rounded-2xl p-6 text-center text-ivory">
            <p className="font-serif text-[3rem] leading-none">4.9</p>
            <StarRow className="mt-2" />
            <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ivory/80">Client rating</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------- FAQ ----------------------------------- */
function Faqs() {
  return (
    <section aria-labelledby="faq-title" className="section-y">
      <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <Reveal><Eyebrow>FAQs</Eyebrow></Reveal>
          <SplitHeading id="faq-title" className="text-headline mt-6" text={"Frequently asked\nquestions"} />
          <Reveal>
            <p className="mt-6 max-w-sm text-[0.98rem] leading-relaxed text-muted">
              Can&apos;t find your answer?{" "}
              <Link href="/contact" className="inline-flex items-center gap-1 text-espresso underline decoration-line underline-offset-4 hover:decoration-espresso">Speak to our team <IconArrowUpRight size={14} /></Link>
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.1}><FaqList items={HOME_FAQS} /></Reveal>
      </div>
    </section>
  );
}

function BookOnline({ treatments }: { treatments: Treatment[] }) {
  return (
    <section id="book-online" aria-labelledby="book-online-title" className="section-y scroll-mt-20">
      <div className="container-site">
        <div className="mb-10 flex flex-col items-center text-center md:mb-14">
          <Reveal><Eyebrow>Book online</Eyebrow></Reveal>
          <SplitHeading id="book-online-title" className="text-headline mt-6" text={"Next available\nappointments"} />
          <Reveal delay={0.15}><p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-muted">Live availability from our booking system. Pick a treatment, choose a time and your doctor confirms within the day.</p></Reveal>
        </div>
        <Reveal><QuickBook treatments={treatments.map((t) => ({ id: t.id, name: t.name }))} /></Reveal>
      </div>
    </section>
  );
}

export function HomeView({ treatments, doctor }: { treatments: Treatment[]; doctor?: Doctor }) {
  return (
    <>
      <Hero treatments={treatments} />
      <Marquee items={treatments.map((t) => t.name)} />
      <Intro />
      <EditorialSplit treatments={treatments} />
      <ConcernGrid />
      <TreatmentShowcase treatments={treatments} />
      <BookOnline treatments={treatments} />
      <DoctorFeature doctor={doctor} />
      <Results />
      <ResultsGallery />
      <HowItWorks />
      <MembershipTeaser />
      <RewardsBand />
      <Testimonials />
      <Faqs />
      <CtaPanel />
    </>
  );
}
