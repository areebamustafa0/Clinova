"use client";

import { BRAND, img } from "@/lib/brand";
import type { Doctor } from "@/types";
import { IconCheck, IconLeaf } from "./icons";
import { ArrowButton, Eyebrow, ParallaxImg, Reveal, RevealGroup, RevealItem, SplitHeading } from "./ui";

export function DoctorFeature({ doctor }: { doctor?: Doctor }) {
  const last = doctor?.lastName ?? "Haddad";
  const name = doctor?.name ?? "Dr. Layla Haddad";
  return (
    <section aria-labelledby="doctor-title" className="pb-22 lg:pb-34">
      <div className="container-site grid items-center gap-10 md:grid-cols-2 lg:gap-20">
        <div className="relative">
          <ParallaxImg src={doctor?.photoUrl ?? img("doctor-portrait")} className="aspect-[4/5] rounded-[var(--radius-panel)] bg-sand" imgClassName="object-top" />
          <Reveal className="glass-warm absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl px-5 py-4 text-ivory md:inset-x-5 md:bottom-5">
            <div>
              <p className="font-serif text-xl leading-tight md:text-2xl">{name}</p>
              <p className="mt-1 text-xs text-ivory/80">{doctor?.specialization ?? "Medical Director & Consultant Aesthetic Physician"}</p>
            </div>
            <IconLeaf className="text-ivory/80" />
          </Reveal>
        </div>
        <div className="md:py-10">
          <Reveal><Eyebrow>Meet your doctor</Eyebrow></Reveal>
          <SplitHeading id="doctor-title" className="text-headline mt-6" text={"Led by doctors,\nguided by detail"} />
          <Reveal>
            <p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-muted">Dr. {last} founded {BRAND.full} on a simple belief: good skin starts with understanding. Every plan begins with a thorough consultation and a long-term view of your skin&apos;s health.</p>
          </Reveal>
          <RevealGroup className="mt-9 max-w-md divide-y divide-line border-y border-line" delay={0.1}>
            {["Former NHS dermatology registrar", `${doctor?.experienceYears ?? 15}+ years in aesthetic medicine`, "MSc Aesthetic Medicine · BCAM member"].map((t) => (
              <RevealItem key={t} className="flex items-center gap-4 py-4 text-[0.95rem] text-espresso">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sand text-bronze"><IconCheck /></span>
                {t}
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal className="mt-10"><ArrowButton href="/about">About the clinic</ArrowButton></Reveal>
        </div>
      </div>
    </section>
  );
}
