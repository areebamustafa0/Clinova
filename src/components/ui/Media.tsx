"use client";

import clsx from "clsx";
import { BRAND } from "@/lib/brand";
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { initials } from "@/utils/format";

/** <img> with a graceful gradient fallback if the source is missing or fails to load. */
export function Img({ src, alt, className, label }: { src?: string | null; alt: string; className?: string; label?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={clsx("flex items-center justify-center bg-gradient-to-br from-ink-600 to-ink-800 font-serif text-3xl text-mint-400/80", className)} role="img" aria-label={alt}>
        {initials(label ?? alt)}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={className} />;
}

export function Reveal({ children, delay = 0, y = 28, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={clsx("h-3.5 w-3.5", i <= Math.round(value) ? "fill-amber-400" : "fill-fg/20")}>
          <path d="M10 1.5l2.5 5.3 5.8.8-4.2 4.1 1 5.8L10 14.7 4.9 17.5l1-5.8L1.7 7.6l5.8-.8L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export function Logo({ compact }: { tone?: "light" | "dark"; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-fg">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
        <path d="M12 2.5c4.6 3.4 6.3 8.4 3.4 13.2A4 4 0 0 1 12 17.8a4 4 0 0 1-3.4-2.1C5.7 10.9 7.4 5.9 12 2.5Z" stroke="currentColor" strokeWidth="1.3" />
        <path d="M12 7v14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="font-serif text-[0.92rem] uppercase leading-none tracking-[0.16em] sm:text-[1.02rem] sm:tracking-[0.22em]">
          {BRAND.name}
          {BRAND.suffix ? <span className="text-bronze"> {BRAND.suffix}</span> : null}
        </span>
      )}
    </span>
  );
}
