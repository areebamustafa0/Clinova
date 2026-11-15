"use client";

import { useId, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { IconPlus } from "./icons";
import { EASE } from "./ui";

/** Single-open accordion (first item open) – used on the home page and every treatment page. */
export function FaqList({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(0);
  const uid = useId();
  return (
    <ul className="space-y-2.5">
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <li key={q} className={clsx("rounded-2xl border transition-colors duration-500", isOpen ? "border-transparent bg-sand" : "border-line bg-transparent hover:bg-sand/50")}>
            <h3 className="font-sans text-base tracking-normal">
              <button
                type="button"
                id={`${uid}-q${i}`}
                aria-expanded={isOpen}
                aria-controls={`${uid}-a${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 rounded-2xl px-5 py-5 text-left font-serif text-[1.12rem] leading-snug md:px-6 md:text-[1.2rem]"
              >
                {q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line">
                  <IconPlus size={14} className={clsx("transition-transform duration-500 ease-[var(--ease-editorial)]", isOpen && "rotate-45")} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div id={`${uid}-a${i}`} role="region" aria-labelledby={`${uid}-q${i}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.6, ease: EASE }} className="overflow-hidden">
                  <p className="max-w-xl px-5 pb-6 text-[0.95rem] leading-relaxed text-muted md:px-6">{a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
