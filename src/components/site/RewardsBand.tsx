
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { IconLeaf } from "./icons";
import { ArrowButton, Eyebrow, Reveal, StarRow } from "./ui";

const PROMISES = [
  "Unhurried consultations",
  "Doctor-led plans",
  "Transparent pricing",
  "Written aftercare",
  "Free cancellation",
  "No packages, no pressure",
  "Marylebone, London",
];

/** Cocoa band: scrolling promises, the membership prompt and the ratings proof. */
export function RewardsBand() {
  return (
    <section aria-labelledby="rewards-title" className="bg-cocoa text-ivory">
      <div className="border-y border-ivory/10 py-5">
        <div aria-hidden="true" className="overflow-hidden">
          <div className="animate-marquee-x motion-reduce:animate-none flex w-max items-center gap-8">
            {[...PROMISES, ...PROMISES].map((p, i) => (
              <span
                key={i}
                className="flex items-center gap-8 whitespace-nowrap text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ivory/60"
              >
                {p}
                <IconLeaf size={12} className="text-[#d6a676]" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container-site grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div>
          <Reveal>
            <Eyebrow tone="onDark">The Clinova promise</Eyebrow>
          </Reveal>

          <h2
            id="rewards-title"
            className="mt-6 font-serif text-[clamp(2rem,4vw,3.4rem)] leading-[1.05]"
          >
            Keep your skin at its best,
            <span className="block text-[#d6a676]">
              with a clinician who remembers it.
            </span>
          </h2>

          <Reveal delay={0.1}>
            <p className="mt-5 max-w-lg text-[0.98rem] leading-relaxed text-ivory/70">
              Memberships combine a regular treatment with priority booking and
              a standing discount — but they are never a lock-in. Pause or
              cancel from your dashboard at any time.
            </p>
          </Reveal>

          <Reveal
            delay={0.2}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <ArrowButton href="/pricing" variant="ivory">
              Compare memberships
            </ArrowButton>

            <Link
              href="/contact#book"
              className="text-sm text-ivory/80 underline decoration-ivory/30 underline-offset-4 hover:text-ivory"
            >
              Or book a one-off visit
            </Link>
          </Reveal>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["4.9 / 5", "Average patient rating", "600+ verified reviews"],
            ["15+ yrs", "Doctor-led experience", "Consultant dermatology"],
            ["2 hrs", "Free cancellation", "Before every appointment"],
            ["1 day", "Reply from the team", "Callbacks & messages"],
          ].map(([big, label, sub], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="rounded-2xl border border-ivory/12 bg-ivory/[0.04] p-5"
            >
              <p className="font-serif text-[1.9rem] leading-none text-[#e3bd93]">
                {big}
              </p>
              <p className="mt-2 text-sm">{label}</p>
              <p className="mt-0.5 text-[0.7rem] text-ivory/55">{sub}</p>

              {i === 0 && <StarRow className="mt-3 text-[#d6a676]" />}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
