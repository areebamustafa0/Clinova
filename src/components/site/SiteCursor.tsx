"use client";

import { useEffect, useRef } from "react";

/**
 * A soft trailing ring that follows the pointer and swells over links, buttons and the before/after slider.
 * Desktop only (hover-capable fine pointer), disabled for reduced motion. The native cursor is left untouched.
 */
export function SiteCursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ring.current;
    if (!fine || reduce || !el) return;

    let x = -100, y = -100, tx = -100, ty = -100, scale = 1, target = 1, shown = false, raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        x = tx;
        y = ty;
        el.style.opacity = "1";
      }
      const t = e.target as Element | null;
      const field = t?.closest?.("input,textarea,select");
      const drag = t?.closest?.("[data-cursor=drag]");
      const link = t?.closest?.("a,button,[role=slider],summary,label");
      target = field ? 0 : drag ? 2.6 : link ? 1.8 : 1;
      el.dataset.mode = drag ? "drag" : link ? "link" : "";
    };
    const onLeave = () => {
      shown = false;
      el.style.opacity = "0";
    };
    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      scale += (target - scale) * 0.2;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[80] hidden size-9 rounded-full border border-white opacity-0 mix-blend-difference transition-[opacity,background-color] duration-300 data-[mode=drag]:bg-white/90 data-[mode=link]:bg-white/25 [@media(hover:hover)_and_(pointer:fine)]:block"
    />
  );
}
