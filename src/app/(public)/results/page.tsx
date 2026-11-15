"use client";

import clsx from "clsx";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import { CtaPanel, Eyebrow, PageIntro, ParallaxImg, Reveal } from "@/components/site/ui";

const gallery: [string, string, string][] = [
  ["result-texture", "Acne scarring", "aspect-square"],
  ["portrait-radiant", "Skin boosters", "aspect-[3/4]"],
  ["profiles-layered", "Anti-aging", "aspect-[3/4]"],
  ["glow-lips", "Skin rejuvenation", "aspect-square"],
  ["portrait-soft", "Pigmentation", "aspect-[3/4]"],
  ["portrait-natural", "Medical facials", "aspect-square"],
  ["portrait-sleek", "Injectables", "aspect-[3/4]"],
  ["portrait-waves", "Laser resurfacing", "aspect-square"],
];

export default function ResultsPage() {
  return (
    <>
      <PageIntro eyebrow="Results" title="Real results, quietly remarkable" text="Subtle, natural-looking change. Drag to compare, then explore the treatments behind the glow." />

      <section className="container-site pb-16 lg:pb-24">
        <div className="grid items-stretch gap-3 md:grid-cols-[1.1fr_1fr] md:gap-4">
          <Reveal className="h-full">
            <BeforeAfter className="aspect-[4/5] h-full rounded-[var(--radius-panel)] md:aspect-auto md:min-h-[40rem]" />
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col justify-end rounded-[var(--radius-panel)] bg-sand p-8 md:p-12">
            <div><Eyebrow>Featured journey</Eyebrow></div>
            <h2 className="text-headline mt-6 !text-[clamp(2rem,3.6vw,3.4rem)]">Rested, refreshed, unmistakably her</h2>
            <p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-muted">A combined plan of skin rejuvenation and conservative anti-wrinkle treatment over twelve weeks.</p>
            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-line pt-8">
              {[["12", "Weeks"], ["4", "Visits"], ["0", "Days downtime"]].map(([n, l]) => (
                <div key={l}><dd className="font-serif text-[2.6rem] leading-none">{n}</dd><dt className="mt-2 text-xs text-muted">{l}</dt></div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="container-site pb-16 lg:pb-24">
        <ul className="grid grid-cols-2 items-start gap-3 md:grid-cols-4 md:gap-4">
          {gallery.map(([slot, label, ratio], i) => (
            <li key={slot}>
              <Reveal delay={(i % 4) * 0.07}>
                <div className="relative">
                  <ParallaxImg slot={slot} className={clsx("rounded-[var(--radius-card)] bg-sand", ratio)} />
                  <span className="glass-warm absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-[0.7rem] font-medium text-ivory">{label}</span>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-xs text-muted">Individual results vary. All treatments follow a medical consultation.</p>
      </section>

      <CtaPanel />
    </>
  );
}
