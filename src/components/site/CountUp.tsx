"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { EASE } from "./ui";

/** Number that counts up when it scrolls into view. The server-rendered HTML contains the final value. */
export function CountUp({ value, decimals = 0, suffix = "", className }: { value: number; decimals?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(value);

  useLayoutEffect(() => {
    if (!reduce) setN(0);
  }, [reduce]);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, { duration: 1.8, ease: EASE, onUpdate: setN });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={className}>
      {n.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}
