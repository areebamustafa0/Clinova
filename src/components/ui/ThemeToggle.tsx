"use client";

import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

/** Moon in light mode (→ dark), sun in dark mode (→ light). Icon swap is pure CSS, so no hydration flicker. */
export function ThemeToggle({ className }: { className?: string }) {
  const { toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch colour theme"
      title="Switch colour theme"
      className={clsx(
        "relative z-[60] grid size-11 shrink-0 place-items-center rounded-full border border-line bg-card/70 text-espresso transition-colors duration-300 hover:bg-sand",
        className,
      )}
    >
      <Moon className="only-light" width={18} height={18} strokeWidth={1.5} />
      <Sun className="only-dark" width={18} height={18} strokeWidth={1.5} />
    </button>
  );
}
