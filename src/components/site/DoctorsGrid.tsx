"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SearchX } from "lucide-react";
import { DAY_SHORT, formatMoney } from "@/utils/format";
import type { Doctor } from "@/types";
import { IconArrowUpRight } from "./icons";
import { ArrowButton, EASE, ParallaxImg, PillLink, Reveal, StarRow } from "./ui";

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function DoctorsGrid({ doctors }: { doctors: Doctor[] }) {
  const [spec, setSpec] = useState("");
  const [q, setQ] = useState("");
  const specs = useMemo(() => [...new Set(doctors.map((d) => d.specialization))], [doctors]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return doctors.filter((d) => (!spec || d.specialization === spec) && (!term || `${d.name} ${d.specialization} ${d.treatments.map((t) => t.name).join(" ")}`.toLowerCase().includes(term)));
  }, [doctors, spec, q]);

  const pill = (active: boolean) => clsx("shrink-0 rounded-full border px-4 py-2.5 text-[0.82rem] font-medium transition-colors duration-300", active ? "border-espresso bg-espresso text-cream" : "border-line text-espresso hover:border-espresso/50 hover:bg-card/60");

  return (
    <section className="container-site pb-24 lg:pb-32">
      <Reveal className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0" role="tablist" aria-label="Filter doctors">
          {["", ...specs].map((s) => (
            <button key={s || "all"} type="button" role="tab" aria-selected={spec === s} onClick={() => setSpec(s)} className={pill(spec === s)}>{s || "All specialists"}</button>
          ))}
        </div>
        <label className="relative block">
          <span className="sr-only">Search doctors</span>
          <Search width={16} height={16} strokeWidth={1.5} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or treatment" className="h-11 w-full rounded-full border border-line bg-card/60 pl-10 pr-4 text-sm text-espresso placeholder:text-muted/70 focus:border-espresso/50 focus:outline-none lg:w-72" />
        </label>
      </Reveal>

      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-[var(--radius-card)] bg-sand px-6 py-20 text-center">
          <SearchX width={28} height={28} strokeWidth={1.4} className="text-bronze" />
          <h2 className="text-title mt-5">No doctors match</h2>
          <button type="button" onClick={() => { setSpec(""); setQ(""); }} className="mt-5 text-sm text-espresso underline decoration-line underline-offset-4">Clear filters</button>
        </div>
      ) : (
        <ul className="grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((d) => (
              <motion.li key={d.id} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.6, ease: EASE }} className="flex flex-col">
                <Link href={`/doctors/${d.id}`} className="group relative block" aria-label={`${d.name}, ${d.specialization}`}>
                  <ParallaxImg src={d.photoUrl ?? undefined} className="aspect-[4/5] rounded-[var(--radius-card)] bg-sand" imgClassName="object-top transition-transform duration-[1200ms] ease-[var(--ease-editorial)] group-hover:scale-105" />
                  <span className="glass-warm absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-ivory">
                    <span className="min-w-0">
                      <span className="block truncate font-serif text-[1.15rem] leading-tight">{d.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-ivory/80">{d.specialization}</span>
                    </span>
                    <IconArrowUpRight className="shrink-0 text-ivory/80 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </Link>
                <div className="mt-5 flex items-center justify-between gap-4 text-sm">
                  <span className="flex items-center gap-2"><StarRow className="text-bronze" /><span className="font-medium">{d.rating.toFixed(1)}</span><span className="text-muted">({d.reviewCount})</span></span>
                  <span className="text-muted">{d.experienceYears} yrs · {formatMoney(d.consultationFee)}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-[0.92rem] leading-relaxed text-muted">{d.bio}</p>
                <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Consultation days">
                  {ORDER.map((i) => (
                    <span key={i} className={clsx("rounded-full px-2.5 py-1 text-[0.68rem] font-medium", d.workingDays.includes(i) ? "bg-sand text-espresso" : "text-muted/50 line-through")}>{DAY_SHORT[i]}</span>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <ArrowButton href={`/dashboard/book?doctorId=${d.id}`} small>Book</ArrowButton>
                  <PillLink href={`/doctors/${d.id}`}>View profile</PillLink>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
