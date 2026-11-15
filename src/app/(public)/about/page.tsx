"use client";

import Link from "next/link";
import { CountUp } from "@/components/site/CountUp";
import { DoctorFeature } from "@/components/site/DoctorFeature";
import { CtaPanel, Eyebrow, ParallaxImg, Reveal, SplitHeading, PageIntro } from "@/components/site/ui";
import { useFetch } from "@/hooks/useFetch";
import type { Doctor } from "@/types";

const stats: [number, number, string, string][] = [
  [12, 0, "+", "Years of practice"],
  [4800, 0, "+", "Treatments performed"],
  [4.9, 1, "", "Average client rating"],
  [30, 0, "+", "Tailored protocols"],
];

const steps = [
  ["01", "Understand", "Every plan begins with listening, a clinical assessment and time to ask questions."],
  ["02", "Treat", "Evidence-based treatments, chosen for your skin and delivered by medical professionals."],
  ["03", "Enhance", "Natural-looking results that support your skin's long-term health, never overdone."],
];

export default function AboutPage() {
  const { data } = useFetch<Doctor[]>("/doctors");
  const doctor = data?.find((d) => d.specialization.startsWith("Medical Director")) ?? data?.[0];
  return (
    <>
      <PageIntro eyebrow="About the clinic" title="A modern approach to beautiful, healthy skin" text="We combine medical expertise with an editor's eye for detail, so results look natural, confident and entirely you.">
        <div className="container-site mt-14 grid grid-cols-2 gap-3 md:mt-20 md:grid-cols-3 md:gap-4">
          <Reveal><ParallaxImg slot="clinic-consultation" className="aspect-[3/4] rounded-[var(--radius-card)]" /></Reveal>
          <Reveal delay={0.1} className="md:translate-y-12"><ParallaxImg slot="portrait-waves" className="aspect-[3/4] rounded-[var(--radius-card)]" /></Reveal>
          <Reveal delay={0.2} className="hidden md:block"><ParallaxImg slot="consultation-analysis" className="aspect-[3/4] rounded-[var(--radius-card)]" /></Reveal>
        </div>
      </PageIntro>

      <section className="container-site py-16 md:py-24">
        <div className="grid grid-cols-2 gap-y-10 rounded-[var(--radius-panel)] bg-cocoa px-6 py-12 text-center text-ivory md:grid-cols-4 md:py-16">
          {stats.map(([n, dec, suf, l], i) => (
            <Reveal key={l} delay={i * 0.08}>
              <p className="font-serif text-[clamp(2.6rem,5vw,4rem)] leading-none"><CountUp value={n} decimals={dec} suffix={suf} /></p>
              <p className="mt-3 text-sm text-ivory/70">{l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="philosophy-title" className="pb-22 lg:pb-34">
        <div className="container-site">
          <div className="max-w-2xl">
            <Reveal><Eyebrow>How we care for you</Eyebrow></Reveal>
            <SplitHeading id="philosophy-title" className="text-headline mt-6" text={"Care that begins\nwith understanding"} />
          </div>
          <div className="mt-14 grid gap-10 border-t border-line pt-10 md:grid-cols-3 md:gap-8">
            {steps.map(([n, t, d], i) => (
              <Reveal key={n} delay={i * 0.1}>
                <span className="font-serif text-bronze">{n}</span>
                <h3 className="text-title mt-4">{t}</h3>
                <p className="mt-3 max-w-xs text-[0.95rem] leading-relaxed text-muted">{d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-12">
            <Link href="/doctors" className="text-sm text-espresso underline decoration-line underline-offset-4 hover:decoration-espresso">Meet our full team of doctors →</Link>
          </Reveal>
        </div>
      </section>

      <DoctorFeature doctor={doctor} />

      <section className="container-site pb-16 lg:pb-24">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {["clinic-editorial", "doctor-clinic", "skincare-ritual", "profile-sculpt"].map((s, i) => (
            <Reveal key={s} delay={i * 0.07} className={i % 2 === 1 ? "md:mt-16" : ""}>
              <ParallaxImg slot={s} className="aspect-[3/4] rounded-[var(--radius-card)]" />
            </Reveal>
          ))}
        </div>
      </section>

      <CtaPanel />
    </>
  );
}
