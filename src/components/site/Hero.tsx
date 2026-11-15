"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { img } from "@/lib/brand";
import type { Treatment } from "@/types";
import { IconArrowDown } from "./icons";
import { ArrowButton, EASE, SiteImg, SplitHeading } from "./ui";

const BOOKING = "/contact#book";

/** Angle of each treatment pill from the vertical – the outer pills lean the most. */
const ARC_DEG = [-66, -44, -22, 0, 22, 44, 66];
/** Distance (px) from the hero's base to each pill's centre. */
const ARC_RADIUS = 233;

/**
 * The opening screen: three photographs (the centre one is the video), a warm veil, the headline,
 * the intro line with two calls to action, and a fan of seven treatment pills rising from the arch.
 */
export function Hero({ treatments }: { treatments: Treatment[] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} aria-labelledby="hero-title" className="px-[1.8vw] pt-20">
      <motion.div
        className="relative isolate h-[calc(100svh-5.5rem)] min-h-[38rem] overflow-hidden rounded-[var(--radius-panel)] bg-cocoa lg:max-h-[62rem] lg:min-h-[44rem]"
        initial={{ clipPath: "inset(6% 4% 0% 4% round 2.25rem)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0% round 2.25rem)" }}
        transition={{ duration: 1.6, ease: EASE }}
      >
        <motion.div className="absolute inset-0 grid grid-cols-1 md:grid-cols-[1fr_1.25fr_1fr]" style={{ scale: reduce ? 1 : scale }}>
          <div className="relative hidden h-full overflow-hidden md:block">
            <SiteImg slot="portrait-radiant" priority className="object-[50%_20%]" />
          </div>
          <div className="relative h-full overflow-hidden">
            {/* Drop hero-portrait.mp4 / .webm into /public/assets to play a video over the poster image */}
            <video className="absolute inset-0 size-full object-cover object-[40%_30%]" autoPlay muted loop playsInline preload="metadata" poster={img("hero-poster")} aria-hidden>
              <source src="/assets/hero-portrait.webm" type="video/webm" />
              <source src="/assets/hero-portrait.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="relative hidden h-full overflow-hidden md:block">
            <SiteImg slot="portrait-profile" priority className="object-[50%_25%]" />
          </div>
        </motion.div>
        <div aria-hidden className="absolute inset-0 bg-[#6b3f28] opacity-25 mix-blend-multiply" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,26,20,0.62)_0%,rgba(42,26,20,0.18)_42%,rgba(42,26,20,0.1)_60%,rgba(42,26,20,0.55)_100%)]" />

        <motion.div style={{ y: reduce ? 0 : y, opacity }} className="relative z-10 flex h-full flex-col items-center justify-between px-5 pb-32 pt-[9vh] text-center text-ivory md:pb-36 md:pt-[4vh] lg:px-10 lg:pb-10 lg:pt-[1vh]">
          <SplitHeading as="h1" id="hero-title" immediate delay={0.4} className="text-display" text={"Your skin,\nthoughtfully perfected"} />
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: 1.1 }} className="flex w-full flex-col items-center gap-7 lg:flex-row lg:items-end lg:justify-between">
            <p className="max-w-[20rem] text-[1.02rem] leading-relaxed text-ivory/85 lg:text-left">
              Advanced skin treatments and modern aesthetics, tailored by doctors for natural-looking results.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:flex-col lg:items-end">
              <ArrowButton href={BOOKING} variant="ivory" big>Book a Consultation</ArrowButton>
              <ArrowButton href="/treatments" variant="glass" big>Explore Treatments</ArrowButton>
            </div>
          </motion.div>
        </motion.div>

        <nav aria-label="Featured treatments" className="pointer-events-none absolute bottom-0 left-1/2 z-10 hidden h-0 w-0 xl:block">
          <ul>
            {treatments.slice(0, 7).map((t, i) => (
              <motion.li key={t.id} className="absolute bottom-0 left-0 origin-bottom" style={{ rotate: ARC_DEG[i] ?? 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, ease: EASE, delay: 1.3 + 0.07 * i }}>
                <motion.div className="pointer-events-auto absolute left-0" style={{ bottom: ARC_RADIUS, x: "-50%", y: "50%" }} initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: EASE, delay: 1.3 + 0.07 * i }}>
                  <Link href={`/treatments/${t.slug}`} className="glass-warm flex w-10 flex-col items-center gap-3 rounded-full px-1 pb-4 pt-1 text-ivory transition-colors duration-300 hover:bg-ivory/30">
                    <span className="relative size-8 overflow-hidden rounded-full ring-1 ring-ivory/40">
                      <SiteImg src={t.imageUrl ?? undefined} />
                    </span>
                    <span className="whitespace-nowrap text-[0.72rem] font-medium tracking-wide [writing-mode:vertical-rl]">{t.category}</span>
                  </Link>
                </motion.div>
              </motion.li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-[-1px] left-1/2 z-20 w-[15rem] -translate-x-1/2 text-cream md:w-[18rem]">
          <svg viewBox="0 0 300 100" className="block w-full" aria-hidden focusable="false">
            <path fill="currentColor" d="M0 100C38 100 50 88 66 62 86 28 112 8 150 8s64 20 84 54c16 26 28 38 66 38Z" />
          </svg>
          <Link href="#treatments" className="group absolute inset-x-0 bottom-3 flex flex-col items-center gap-1.5 text-[0.72rem] font-medium text-espresso md:bottom-4">
            <span className="grid size-7 place-items-center rounded-full border border-line transition-colors group-hover:bg-espresso group-hover:text-cream">
              <IconArrowDown />
            </span>
            Explore our treatments
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
