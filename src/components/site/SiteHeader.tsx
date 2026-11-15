"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { BRAND, CLINIC } from "@/lib/brand";
import { IconLeaf } from "./icons";
import { SearchTrigger } from "./SearchTrigger";
import { useLenis } from "./SmoothScroll";
import { ArrowButton, EASE } from "./ui";

/** Desktop navigation – exactly the five primary links of the design. */
export const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/treatments", label: "Treatments" },
  { href: "/results", label: "Results" },
  { href: "/contact", label: "Contact" },
];

/** Mobile menu also lists the secondary pages (they remain in the footer on desktop). */
const MOBILE_NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/treatments", label: "Treatments" },
  { href: "/doctors", label: "Doctors" },
  { href: "/results", label: "Results" },
  { href: "/skin-quiz", label: "Skin quiz" },
  { href: "/contact", label: "Contact" },
];

const BOOKING = "/contact#book";
const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export function LogoMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", tone === "light" ? "text-ivory" : "text-espresso", className)}>
      <IconLeaf />
      <span className="font-serif text-[0.92rem] uppercase leading-none tracking-[0.16em] sm:text-[1.02rem] sm:tracking-[0.22em]">
        {BRAND.name}
        {BRAND.suffix ? <span className="text-bronze"> {BRAND.suffix}</span> : null}
      </span>
    </span>
  );
}

function MobileMenu({ pathname }: { pathname: string }) {
  return (
    <motion.div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      className="fixed inset-0 z-40 flex flex-col bg-cream px-5 pb-8 pt-28 lg:hidden"
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      exit={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <nav aria-label="Mobile" className="flex-1 overflow-y-auto">
        <ul className="border-t border-line">
          {MOBILE_NAV.map((l, i) => (
            <li key={l.href} className="overflow-hidden border-b border-line">
              <motion.div initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }} transition={{ duration: 0.8, ease: EASE, delay: 0.1 + 0.04 * i }}>
                <Link href={l.href} aria-current={isActive(pathname, l.href) ? "page" : undefined} className="flex items-baseline justify-between py-3.5 font-serif text-[2.1rem] leading-none tracking-[-0.02em] aria-[current=page]:text-bronze">
                  {l.label}
                  <span className="font-sans text-xs text-muted">0{i + 1}</span>
                </Link>
              </motion.div>
            </li>
          ))}
        </ul>
      </nav>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.5 }} className="space-y-5 pt-6">
        <SearchTrigger className="flex w-full items-center justify-center gap-2 rounded-full border border-line py-3 text-sm text-espresso" />
        <ArrowButton href={BOOKING} className="w-full justify-center">Book Consultation</ArrowButton>
        <div className="flex justify-between text-sm text-muted">
          <a href={CLINIC.phoneHref}>{CLINIC.phone}</a>
          <a href={`mailto:${CLINIC.email}`}>Email us</a>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const lenis = useLenis();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const toggle = useRef<HTMLButtonElement>(null);

  // Hide on scroll down past 320px, reveal on scroll up (never while the menu is open).
  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(latest > 320 && latest > prev && !open);
  });

  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const page = document.getElementById("page");
    if (open) {
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
      page?.setAttribute("inert", "");
    } else {
      lenis?.start();
      document.documentElement.style.overflow = "";
      page?.removeAttribute("inert");
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, lenis]);

  return (
    <>
      <motion.header className="fixed inset-x-0 top-0 z-50" animate={{ y: hidden ? "-110%" : "0%" }} transition={{ duration: 0.6, ease: EASE }}>
        <div className={clsx("h-20 transition-colors duration-500", open ? "bg-transparent" : "bg-cream/70 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl")}>
          <div className="flex h-full items-center justify-between gap-4 px-5 md:px-[1.8vw] lg:grid lg:grid-cols-[1fr_auto_1fr]">
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {NAV.map((l) => {
                  const active = isActive(pathname, l.href);
                  return (
                    <li key={l.href}>
                      <Link href={l.href} aria-current={active ? "page" : undefined} className={clsx("relative rounded-full px-3.5 py-2 text-[0.84rem] font-medium transition-colors duration-300", active ? "text-espresso" : "text-espresso/70 hover:text-espresso")}>
                        {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-sand" transition={{ duration: 0.5, ease: EASE }} />}
                        <span className="relative">{l.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="justify-self-start lg:justify-self-center">
              <Link href="/" aria-label={`${BRAND.full} — home`}>
                <LogoMark />
              </Link>
            </div>

            <div className="flex items-center justify-end gap-3">
              <ThemeToggle />
              <ArrowButton href={BOOKING} variant="outline" small className="max-sm:hidden">Book Consultation</ArrowButton>
              <button ref={toggle} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" className="relative z-[60] grid size-11 place-items-center rounded-full border border-line bg-card/70 text-espresso transition-colors duration-300 hover:bg-sand lg:hidden">
                <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
                <span aria-hidden className="relative block h-3 w-5">
                  <span className={clsx("absolute left-0 top-0 h-px w-5 bg-espresso transition-transform duration-500 ease-[var(--ease-editorial)]", open && "translate-y-1.5 rotate-45")} />
                  <span className={clsx("absolute bottom-0 left-0 h-px w-5 bg-espresso transition-transform duration-500 ease-[var(--ease-editorial)]", open && "-translate-y-1.5 -rotate-45")} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>{open && <MobileMenu pathname={pathname} />}</AnimatePresence>
    </>
  );
}
