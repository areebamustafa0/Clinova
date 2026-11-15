"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SearchX } from "lucide-react";
import { GROUPS } from "@/lib/site-content";
import { formatMoney } from "@/utils/format";
import type { Treatment } from "@/types";
import { IconArrowUpRight } from "./icons";
import { EASE, ParallaxImg, Reveal } from "./ui";

type Sort = "recommended" | "price-asc" | "price-desc" | "duration";

/** Filterable treatment grid: concern groups, free-text search and sorting – all client-side over server-rendered data. */
export function TreatmentsGrid({ treatments }: { treatments: Treatment[] }) {
  const [group, setGroup] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("recommended");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const slugs = GROUPS.find((g) => g.label === group)?.slugs;
    const out = treatments.filter((t) => (!slugs || slugs.includes(t.slug ?? "")) && (!term || `${t.name} ${t.description} ${t.tagline ?? ""} ${t.category}`.toLowerCase().includes(term)));
    if (sort === "price-asc") return [...out].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...out].sort((a, b) => b.price - a.price);
    if (sort === "duration") return [...out].sort((a, b) => a.durationMinutes - b.durationMinutes);
    return out;
  }, [treatments, group, q, sort]);

  const pill = (active: boolean) => clsx("shrink-0 rounded-full border px-4 py-2.5 text-[0.82rem] font-medium transition-colors duration-300", active ? "border-espresso bg-espresso text-cream" : "border-line text-espresso hover:border-espresso/50 hover:bg-card/60");
  const reset = () => { setGroup(""); setQ(""); setSort("recommended"); };

  return (
    <section className="container-site pb-24 lg:pb-32">
      <Reveal className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Filter treatments">
          {[{ label: "" }, ...GROUPS].map((g) => (
            <button key={g.label || "all"} type="button" role="tab" aria-selected={group === g.label} onClick={() => setGroup(g.label)} className={pill(group === g.label)}>
              {g.label || "All treatments"}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block">
            <span className="sr-only">Search treatments</span>
            <Search width={16} height={16} strokeWidth={1.5} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search treatments" className="h-11 w-full rounded-full border border-line bg-card/60 pl-10 pr-4 text-sm text-espresso placeholder:text-muted/70 focus:border-espresso/50 focus:outline-none sm:w-60" />
          </label>
          <label className="block">
            <span className="sr-only">Sort treatments</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="select-arrow h-11 w-full appearance-none rounded-full border border-line bg-card/60 pl-4 pr-10 text-sm text-espresso focus:border-espresso/50 focus:outline-none sm:w-52">
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="duration">Shortest first</option>
            </select>
          </label>
        </div>
      </Reveal>

      <p className="mb-8 text-sm text-muted" aria-live="polite">{list.length} {list.length === 1 ? "treatment" : "treatments"}</p>

      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-[var(--radius-card)] bg-sand px-6 py-20 text-center">
          <SearchX width={28} height={28} strokeWidth={1.4} className="text-bronze" />
          <h2 className="text-title mt-5">Nothing matches that search</h2>
          <p className="mt-2 max-w-sm text-sm text-muted">Try a different word, or clear the filters to see every treatment.</p>
          <button type="button" onClick={reset} className="mt-6 text-sm text-espresso underline decoration-line underline-offset-4">Clear filters</button>
        </div>
      ) : (
        <ul className="grid gap-x-5 gap-y-14 md:grid-cols-2 md:gap-y-20">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((t) => (
              <motion.li key={t.id} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.6, ease: EASE }}>
                <Link href={`/treatments/${t.slug}`} className="group block">
                  <div className="relative">
                    <ParallaxImg src={t.imageUrl ?? undefined} className="aspect-[4/3] rounded-[var(--radius-card)] bg-sand md:aspect-[5/4]" imgClassName="transition-transform duration-[1200ms] ease-[var(--ease-editorial)] group-hover:scale-105" />
                    <dl className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap gap-2">
                      {([["Duration", t.durationLabel ?? `${t.durationMinutes} min`], ["Sessions", t.sessions], ["Downtime", t.downtime], ["From", formatMoney(t.price)]] as [string, string | null][]).filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} className="glass-warm rounded-full px-3.5 py-1.5 text-[0.7rem] text-ivory"><dt className="inline text-ivory/70">{k} </dt><dd className="inline font-medium">{v}</dd></div>
                      ))}
                    </dl>
                  </div>
                  <div className="mt-6 flex items-start justify-between gap-6">
                    <div>
                      <h3 className="text-title">{t.name}</h3>
                      <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted">{t.description}</p>
                    </div>
                    <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-full border border-line text-espresso transition-colors duration-300 group-hover:bg-espresso group-hover:text-cream"><IconArrowUpRight size={17} /></span>
                  </div>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
