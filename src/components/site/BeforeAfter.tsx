"use client";

import { useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { IconSwap } from "./icons";
import { SiteImg } from "./ui";

/** Drag-to-compare slider (handle clamped to 4–96 %, arrow keys ±4, Shift+arrow ±10). Photos: result-before.jpg / result-after.jpg. */
export function BeforeAfter({ className, children }: { className?: string; children?: ReactNode }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div
      ref={ref}
      data-cursor="drag"
      className={clsx("relative touch-pan-y select-none overflow-hidden bg-sand", className)}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && move(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <SiteImg slot="result-after" className="pointer-events-none" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <SiteImg slot="result-before" className="pointer-events-none" />
      </div>
      <span className="glass absolute left-4 top-4 rounded-full px-3 py-1 text-[0.7rem] font-medium text-ivory">Before</span>
      <span className="glass absolute right-4 top-4 rounded-full px-3 py-1 text-[0.7rem] font-medium text-ivory">After</span>
      <div className="pointer-events-none absolute inset-y-0 w-px bg-ivory/80" style={{ left: `${pos}%` }}>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)}% before`}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 10 : 4;
            if (e.key === "ArrowLeft") setPos((p) => Math.max(4, p - step));
            else if (e.key === "ArrowRight") setPos((p) => Math.min(96, p + step));
            else return;
            e.preventDefault();
          }}
          className="glass pointer-events-auto absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full text-ivory focus-visible:outline-ivory"
        >
          <IconSwap />
        </div>
      </div>
      {children}
    </div>
  );
}
