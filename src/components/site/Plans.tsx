"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { PLANS } from "@/lib/site-extras";
import { IconCheck } from "./icons";
import { ArrowButton, RevealGroup, RevealItem } from "./ui";

export type Billing = "monthly" | "annual";

export const planPrice = (monthly: number, billing: Billing) => (billing === "annual" ? Math.round((monthly * 10) / 12) : monthly);

export function BillingToggle({ value, onChange }: { value: Billing; onChange: (b: Billing) => void }) {
  return (
    <div role="radiogroup" aria-label="Billing period" className="relative inline-flex rounded-full border border-line bg-card/70 p-1 text-[0.84rem] font-medium">
      {(["monthly", "annual"] as Billing[]).map((b) => (
        <button key={b} type="button" role="radio" aria-checked={value === b} onClick={() => onChange(b)} className={clsx("relative isolate rounded-full px-5 py-2 transition-colors duration-300", value === b ? "text-cream" : "text-espresso/70 hover:text-espresso")}>
          {value === b && <motion.span layoutId="billing-pill" className="absolute inset-0 -z-10 rounded-full bg-espresso" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
          {b === "monthly" ? "Monthly" : (
            <span className="flex items-center gap-2">Annual <span className={clsx("rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider", value === b ? "bg-cream/20 text-cream" : "bg-sand text-bronze")}>2 months free</span></span>
          )}
        </button>
      ))}
    </div>
  );
}

export function PlanGrid({ billing }: { billing: Billing }) {
  return (
    <RevealGroup className="grid gap-4 lg:grid-cols-3">
      {PLANS.map((p) => (
        <RevealItem key={p.key} className={clsx("relative flex flex-col overflow-hidden rounded-[var(--radius-panel)] p-8 md:p-10", p.featured ? "bg-[#2a1a14] text-ivory lg:-my-4 lg:py-14" : "bg-card")}>
          {p.featured && (
            <>
              <div aria-hidden className="animate-aurora pointer-events-none absolute -right-1/3 -top-1/3 size-[120%] rounded-full bg-[radial-gradient(closest-side,rgba(214,166,118,0.28),transparent)]" />
              <span className="absolute right-6 top-6 rounded-full border border-ivory/20 bg-ivory/10 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#e3bd93]">Most popular</span>
            </>
          )}
          <p className="relative font-serif text-[1.7rem] leading-none">{p.name}</p>
          <p className={clsx("relative mt-3 text-sm", p.featured ? "text-ivory/70" : "text-muted")}>{p.tagline}</p>
          <p className="relative mt-8 flex items-baseline gap-2">
            <motion.span key={billing} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-serif text-[3.6rem] leading-none tracking-[-0.03em]">£{planPrice(p.monthly, billing)}</motion.span>
            <span className={clsx("text-sm", p.featured ? "text-ivory/70" : "text-muted")}>/ month</span>
          </p>
          <p className={clsx("relative mt-2 h-4 text-xs", p.featured ? "text-ivory/60" : "text-muted")}>{billing === "annual" ? `Billed £${(p.monthly * 10).toLocaleString("en-GB")} yearly` : `Save ${p.discount}% on every treatment`}</p>
          <ul className={clsx("relative mt-8 space-y-3.5 border-t pt-8 text-[0.92rem]", p.featured ? "border-ivory/15" : "border-line")}>
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <IconCheck size={16} className={clsx("mt-0.5 shrink-0", p.featured ? "text-[#e3bd93]" : "text-bronze")} />
                {f}
              </li>
            ))}
          </ul>
          <div className="relative mt-auto pt-10">
            <ArrowButton href={`/contact?plan=${p.key}#book`} variant={p.featured ? "ivory" : "espresso"}>Join {p.name}</ArrowButton>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
