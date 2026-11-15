"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Phone } from "lucide-react";
import { CLINIC } from "@/lib/brand";
import { ArrowButton, EASE } from "./ui";

/** Small screens only: a bottom bar with the booking button and a one-tap call, shown once the visitor has scrolled. */
export function MobileBookBar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setShow(v > 600));
  if (pathname.startsWith("/contact")) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: "110%" }}
          animate={{ y: "0%" }}
          exit={{ y: "110%" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:hidden"
        >
          <div className="flex items-center gap-3">
            <ArrowButton href="/contact#book" className="flex-1">Book Consultation</ArrowButton>
            <a href={CLINIC.phoneHref} aria-label="Call the clinic" className="grid size-12 shrink-0 place-items-center rounded-full border border-line text-espresso">
              <Phone width={18} height={18} strokeWidth={1.5} />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
