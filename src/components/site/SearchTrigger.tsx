"use client";

import { Search } from "lucide-react";

/** Opens the site-wide search (also bound to Ctrl/⌘ + K). */
export function SearchTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("clinova:search"))}
      className={
        className ?? "inline-flex items-center gap-2 text-sm text-espresso underline decoration-line underline-offset-4 transition-colors hover:decoration-espresso"
      }
    >
      <Search width={15} height={15} strokeWidth={1.5} aria-hidden />
      Search the site
      <kbd className="ml-1 rounded border border-line px-1.5 py-0.5 text-[0.65rem] text-muted">Ctrl K</kbd>
    </button>
  );
}
