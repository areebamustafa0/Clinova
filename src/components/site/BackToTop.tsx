"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useLenis } from "./SmoothScroll";
import { EASE } from "./ui";

/** Round back-to-top button that appears after the first screen (sits above the mobile booking bar). */
export function BackToTop() {
  const [show, setShow] = useState(false);
  const lenis = useLenis();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={toTop}
          aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="fixed bottom-24 right-4 z-30 grid size-12 place-items-center rounded-full border border-line bg-cream/90 text-espresso shadow-float backdrop-blur-xl transition-colors hover:bg-sand sm:bottom-6 sm:right-6"
        >
          <svg viewBox="0 0 48 48" className="pointer-events-none absolute inset-0 size-full -rotate-90" aria-hidden>
            <circle cx="24" cy="24" r="22" fill="none" stroke="var(--color-line)" strokeWidth="1.5" />
            <motion.circle cx="24" cy="24" r="22" fill="none" stroke="var(--color-bronze)" strokeWidth="1.5" strokeLinecap="round" pathLength={1} style={{ pathLength: progress }} />
          </svg>
          <ArrowUp width={17} height={17} strokeWidth={1.6} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
