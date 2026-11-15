"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, X, ZoomIn } from "lucide-react";
import { BeforeAfter } from "./BeforeAfter";
import { IconArrowUpRight } from "./icons";
import { EASE, Eyebrow, ParallaxImg, Reveal, SiteImg, SplitHeading } from "./ui";

type Tile = { slot: string; label: string; note: string; ratio: string };

const TILES: Tile[] = [
  { slot: "portrait-radiant", label: "Skin boosters", note: "3 sessions · hydration & glow", ratio: "aspect-[3/4]" },
  { slot: "profiles-layered", label: "Anti-aging", note: "Conservative injectables · 12 weeks", ratio: "aspect-square" },
  { slot: "glow-lips", label: "Skin rejuvenation", note: "6 sessions · tone & texture", ratio: "aspect-[3/4]" },
  { slot: "result-texture", label: "Acne scarring", note: "Laser plan · 4 sessions", ratio: "aspect-square" },
  { slot: "portrait-soft", label: "Pigmentation", note: "IPL & topicals · 3 months", ratio: "aspect-[3/4]" },
  { slot: "portrait-waves", label: "Laser resurfacing", note: "Fractional laser · 2 sessions", ratio: "aspect-square" },
];

/** Results gallery: a drag-to-compare feature plus a tiled grid that opens in a lightbox. */
export function ResultsGallery() {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  const current = index !== null ? TILES[index] : null;
  const step = (d: 1 | -1) => setIndex((i) => (i === null ? i : (i + d + TILES.length) % TILES.length));

  return (
    <section aria-labelledby="gallery-title" className="section-y bg-sand/50">
      <div className="container-site">
        <div className="mb-12 flex flex-col items-center text-center md:mb-16">
          <Reveal><Eyebrow>Results gallery</Eyebrow></Reveal>
          <SplitHeading id="gallery-title" className="text-headline mt-6" text={"Quiet change,\nworth showing"} />
          <Reveal delay={0.1}><p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-muted">A selection of journeys with our clinicians. Tap any image to view it larger.</p></Reveal>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
          <Reveal>
            <BeforeAfter className="aspect-[4/5] rounded-[var(--radius-panel)] lg:aspect-auto lg:h-full">
              <div className="glass-warm pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl px-5 py-4 text-ivory">
                <p className="font-serif text-xl">Rested, not changed</p>
                <p className="mt-1 text-xs text-ivory/80">12 weeks · rejuvenation &amp; anti-aging plan</p>
              </div>
            </BeforeAfter>
          </Reveal>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
            {TILES.map((t, i) => (
              <button
                key={t.slot}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`View ${t.label} result`}
                className={clsx("group relative overflow-hidden rounded-[var(--radius-card)] bg-sand text-left", i === 0 ? "col-span-2 md:col-span-1" : "", t.ratio === "aspect-square" ? "aspect-square" : "aspect-[3/4]")}
              >
                <ParallaxImg slot={t.slot} reveal={false} className="size-full" imgClassName="transition-transform duration-[1200ms] ease-[var(--ease-editorial)] group-hover:scale-105" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#2a1a14]/70 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span aria-hidden className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-ivory/85 text-espresso opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <ZoomIn width={14} height={14} strokeWidth={1.6} />
                </span>
                <span className="glass-warm absolute inset-x-2.5 bottom-2.5 rounded-xl px-3 py-2 text-ivory">
                  <span className="block text-[0.72rem] font-medium leading-tight">{t.label}</span>
                  <span className="block text-[0.62rem] text-ivory/75">{t.note}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <Reveal className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="max-w-xl text-xs text-muted">Individual results vary. All treatments follow a medical consultation, and images are illustrative of the clinic&apos;s work.</p>
          <Link href="/results" className="inline-flex items-center gap-1.5 text-sm text-espresso underline decoration-line underline-offset-4 hover:decoration-espresso">
            See the full results page <IconArrowUpRight size={14} />
          </Link>
        </Reveal>
      </div>

      <AnimatePresence>
        {open && current && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${current.label} result`}
            className="fixed inset-0 z-[92] flex items-center justify-center bg-cocoa/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setIndex(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIndex(null);
              if (e.key === "ArrowRight") step(1);
              if (e.key === "ArrowLeft") step(-1);
            }}
          >
            <motion.figure
              key={current.slot}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="relative w-full max-w-3xl overflow-hidden rounded-[var(--radius-panel)] bg-cocoa"
            >
              <div className="relative aspect-[4/3]"><SiteImg slot={current.slot} priority /></div>
              <figcaption className="flex flex-wrap items-center justify-between gap-3 bg-[#2a1a14] px-6 py-4 text-ivory">
                <div>
                  <p className="font-serif text-xl leading-tight">{current.label}</p>
                  <p className="text-xs text-ivory/70">{current.note}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => step(-1)} aria-label="Previous image" className="grid size-10 place-items-center rounded-full border border-ivory/25 hover:bg-ivory/10"><ArrowLeft width={16} height={16} strokeWidth={1.5} /></button>
                  <button type="button" onClick={() => step(1)} aria-label="Next image" className="grid size-10 place-items-center rounded-full border border-ivory/25 hover:bg-ivory/10"><ArrowRight width={16} height={16} strokeWidth={1.5} /></button>
                </div>
              </figcaption>
              <button type="button" onClick={() => setIndex(null)} aria-label="Close" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-ivory/90 text-espresso">
                <X width={17} height={17} strokeWidth={1.6} />
              </button>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
