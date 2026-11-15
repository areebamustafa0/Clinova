"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, CornerDownLeft, FileText, LayoutDashboard, MoonStar, Phone, Search, Sparkles, Stethoscope } from "lucide-react";
import { homePathFor, useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { CLINIC } from "@/lib/brand";
import { get } from "@/lib/http";
import { sortTreatments } from "@/lib/site-content";
import { formatMoney } from "@/utils/format";
import type { Doctor, Treatment } from "@/types";
import { useLenis } from "./SmoothScroll";
import { EASE } from "./ui";

type Item = { id: string; group: string; label: string; hint?: string; keywords?: string; icon: ReactNode; href?: string; run?: () => void };

export const openCommandPalette = () => window.dispatchEvent(new Event("cmdk:open"));

const PAGES: [string, string, string][] = [
  ["Home", "/", "start landing"],
  ["Treatments", "/treatments", "services menu prices"],
  ["Doctors", "/doctors", "team specialists clinicians"],
  ["Skin quiz", "/skin-quiz", "recommend find which treatment"],
  ["Pricing & memberships", "/pricing", "cost price plan membership estimate"],
  ["Results", "/results", "before after gallery"],
  ["About the clinic", "/about", "story philosophy"],
  ["Contact & directions", "/contact", "address map hours phone email"],
];

/** ⌘K / Ctrl+K (or "/") quick search across pages, treatments, doctors and actions. */
export function CommandPalette() {
  const router = useRouter();
  const lenis = useLenis();
  const { toggle } = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [data, setData] = useState<{ treatments: Treatment[]; doctors: Doctor[] } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.("input,textarea,select,[contenteditable=true]");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("cmdk:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cmdk:open", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      lenis?.stop();
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
      if (!data) {
        Promise.all([get<Treatment[]>("/treatments"), get<Doctor[]>("/doctors")])
          .then(([treatments, doctors]) => setData({ treatments: sortTreatments(treatments), doctors }))
          .catch(() => setData({ treatments: [], doctors: [] }));
      }
    } else lenis?.start();
  }, [open, lenis, data]);

  const items = useMemo<Item[]>(() => {
    const actions: Item[] = [
      { id: "a-book", group: "Actions", label: "Book an appointment online", keywords: "reserve slot schedule", icon: <CalendarPlus size={16} />, href: "/dashboard/book" },
      { id: "a-consult", group: "Actions", label: "Request a consultation", keywords: "contact enquiry callback", icon: <FileText size={16} />, href: "/contact#book" },
      { id: "a-portal", group: "Actions", label: user ? "Go to my dashboard" : "Patient portal sign in", keywords: "login account appointments", icon: <LayoutDashboard size={16} />, href: user ? homePathFor(user.role) : "/login" },
      { id: "a-theme", group: "Actions", label: "Switch light / dark theme", keywords: "dark mode light mode appearance", icon: <MoonStar size={16} />, run: toggle },
      { id: "a-call", group: "Actions", label: `Call the clinic · ${CLINIC.phone}`, keywords: "phone telephone", icon: <Phone size={16} />, run: () => (window.location.href = CLINIC.phoneHref) },
    ];
    const pages: Item[] = PAGES.map(([label, href, kw]) => ({ id: `p-${href}`, group: "Pages", label, keywords: kw, icon: <FileText size={16} />, href }));
    const treatments: Item[] = (data?.treatments ?? []).map((t) => ({
      id: `t-${t.id}`,
      group: "Treatments",
      label: t.name,
      hint: `from ${formatMoney(t.price)} · ${t.durationLabel ?? `${t.durationMinutes} min`}`,
      keywords: `${t.category} ${t.tagline ?? ""} ${t.description}`,
      icon: <Sparkles size={16} />,
      href: `/treatments/${t.slug}`,
    }));
    const doctors: Item[] = (data?.doctors ?? []).map((d) => ({ id: `d-${d.id}`, group: "Doctors", label: d.name, hint: d.specialization, keywords: d.treatments.map((t) => t.name).join(" "), icon: <Stethoscope size={16} />, href: `/doctors/${d.id}` }));

    const term = q.trim().toLowerCase();
    if (!term) return [...actions.slice(0, 3), ...treatments.slice(0, 4), ...pages];
    const score = (it: Item) => {
      const label = it.label.toLowerCase();
      if (label.startsWith(term)) return 3;
      if (label.includes(term)) return 2;
      return term.split(/\s+/).every((w) => `${label} ${it.hint ?? ""} ${it.keywords ?? ""}`.toLowerCase().includes(w)) ? 1 : 0;
    };
    return [...actions, ...pages, ...treatments, ...doctors]
      .map((it) => ({ it, s: score(it) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((x) => x.it);
  }, [data, q, toggle, user]);

  const run = useCallback(
    (it: Item) => {
      setOpen(false);
      if (it.href) router.push(it.href);
      else it.run?.();
    },
    [router],
  );

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      run(items[active]);
    } else if (e.key === "Escape") setOpen(false);
  };

  let lastGroup = "";
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="absolute inset-0 bg-[#2a1a14]/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search the site"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="relative w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-line bg-card text-espresso shadow-float"
            onKeyDown={onKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Search size={18} strokeWidth={1.6} className="shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                placeholder="Search treatments, doctors, pages…"
                aria-label="Search"
                aria-controls="cmdk-list"
                aria-activedescendant={items[active] ? `cmdk-${items[active].id}` : undefined}
                className="h-16 flex-1 bg-transparent text-[1rem] placeholder:text-muted/70 focus:outline-none"
              />
              <kbd className="rounded-md border border-line px-2 py-1 text-[0.68rem] text-muted">Esc</kbd>
            </div>
            <div ref={listRef} id="cmdk-list" role="listbox" data-lenis-prevent className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
              {items.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-muted">
                  {data ? <>No results for “{q}”. Try “acne”, “prices” or “opening hours”.</> : "Loading…"}
                </div>
              )}
              {items.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                return (
                  <div key={it.id}>
                    {header && <p className="px-3 pb-1.5 pt-3 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-muted">{header}</p>}
                    <button
                      id={`cmdk-${it.id}`}
                      data-index={i}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => run(it)}
                      className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.92rem] transition-colors", i === active ? "bg-sand" : "hover:bg-sand/60")}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-bronze">{it.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{it.label}</span>
                        {it.hint && <span className="block truncate text-xs text-muted">{it.hint}</span>}
                      </span>
                      {i === active && <CornerDownLeft size={14} className="shrink-0 text-muted" />}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-3 text-[0.72rem] text-muted">
              <span className="flex items-center gap-3"><span><kbd className="rounded border border-line px-1.5">↑</kbd> <kbd className="rounded border border-line px-1.5">↓</kbd> navigate</span><span><kbd className="rounded border border-line px-1.5">↵</kbd> open</span></span>
              <span><kbd className="rounded border border-line px-1.5">⌘</kbd> <kbd className="rounded border border-line px-1.5">K</kbd> anywhere</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
