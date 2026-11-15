"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Bell, ExternalLink, LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Media";
import { Spinner } from "@/components/ui/Feedback";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { homePathFor, useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { get, post } from "@/lib/http";
import { formatDateTime, initials } from "@/utils/format";
import type { NotificationItem, Role } from "@/types";

export type NavItem = { href: string; label: string; icon: ComponentType<{ className?: string }>; exact?: boolean };

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ items: NotificationItem[]; unread: number }>({ items: [], unread: 0 });
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setData(await get("/notifications"));
    } catch {
      /* silent: bell is non-critical */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  async function markAll() {
    await post("/notifications");
    load();
  }

  return (
    <div className="relative" ref={box}>
      <button onClick={() => { setOpen((o) => !o); if (!open) load(); }} aria-label={`Notifications${data.unread ? `, ${data.unread} unread` : ""}`} aria-expanded={open} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-fg/10 text-fg/80 transition hover:border-mint-400/50 hover:text-fg">
        <Bell className="h-[18px] w-[18px]" />
        {data.unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-mint-400 px-1 text-[10px] font-bold text-on-accent">{data.unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} className="absolute right-0 z-50 mt-3 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-fg/10 bg-ink-850 shadow-card">
            <div className="flex items-center justify-between border-b border-fg/[0.07] px-5 py-4">
              <p className="font-serif text-lg">Notifications</p>
              {data.unread > 0 && <button onClick={markAll} className="text-xs text-mint-300 hover:underline">Mark all read</button>}
            </div>
            <ul className="max-h-[360px] divide-y divide-fg/[0.06] overflow-y-auto">
              {data.items.length === 0 && <li className="px-5 py-10 text-center text-sm text-fog">You're all caught up.</li>}
              {data.items.map((n) => (
                <li key={n.id} className={clsx("px-5 py-4", !n.isRead && "bg-mint-400/[0.04]")}>
                  <p className="flex items-center gap-2 text-sm font-medium">{!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />}{n.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-fog">{n.message}</p>
                  <p className="mt-1.5 text-[11px] text-fog-dark">{formatDateTime(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DashboardShell({ role, nav, label, children }: { role: Role; nav: NavItem[]; label: string; children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
    else if (user.role !== role) router.replace(homePathFor(user.role));
  }, [user, loading, role, router, pathname]);

  useEffect(() => setDrawer(false), [pathname]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const isActive = (n: NavItem) => (n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(`${n.href}/`));
  const displayName = role === "doctor" ? `Dr. ${user.firstName} ${user.lastName}` : `${user.firstName} ${user.lastName}`;

  async function handleLogout() {
    await logout();
    toast.info("You have been signed out.");
    router.replace("/login");
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-6 pt-7">
        <Link href="/" aria-label="Clinova website"><Logo /></Link>
        <p className="mt-5 inline-flex rounded-full border border-mint-400/25 bg-mint-400/[0.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-mint-300">{label}</p>
      </div>
      <nav aria-label={`${label} navigation`} className="flex-1 space-y-1 overflow-y-auto px-3">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = isActive(n);
          return (
            <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={clsx("group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition", active ? "bg-mint-400/10 text-mint-300" : "text-fg/65 hover:bg-fg/[0.05] hover:text-fg")}>
              {active && <motion.span layoutId={`side-${role}`} className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-mint-400" />}
              <Icon className="h-[18px] w-[18px]" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-fg/[0.07] p-4">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-fog transition hover:bg-fg/[0.05] hover:text-fg">
          <ExternalLink className="h-4 w-4" /> Visit website
        </Link>
        <div className="flex items-center gap-3 rounded-xl bg-fg/[0.04] p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-400/15 font-serif text-mint-300">{initials(displayName)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-fog">{user.email}</p>
          </div>
          <button onClick={handleLogout} aria-label="Sign out" title="Sign out" className="rounded-full p-2 text-fog transition hover:bg-fg/10 hover:text-rose-300">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-900 lg:pl-[272px]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] border-r border-fg/[0.07] bg-ink-950 lg:block">{sidebar}</aside>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setDrawer(false)} />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "tween", duration: 0.25 }} className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-fg/[0.07] bg-ink-950 lg:hidden">
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute right-4 top-5 rounded-full p-2 text-fog hover:text-fg"><X className="h-5 w-5" /></button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-fg/[0.07] bg-ink-900/85 px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <button onClick={() => setDrawer(true)} aria-label="Open menu" className="rounded-full border border-fg/15 p-2.5 lg:hidden"><Menu className="h-5 w-5" /></button>
        <p className="hidden text-sm text-fog lg:block">
          {new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}
        </p>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
        </div>
      </header>

      <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-fog">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, hint, tone = "mint" }: { label: string; value: ReactNode; icon: ComponentType<{ className?: string }>; hint?: string; tone?: "mint" | "amber" | "sky" | "rose" }) {
  const tones = { mint: "bg-mint-400/10 text-mint-400", amber: "bg-amber-400/10 text-amber-300", sky: "bg-sky-400/10 text-sky-300", rose: "bg-rose-400/10 text-rose-300" };
  return (
    <div className="panel p-6 transition duration-300 hover:border-fg/15">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-fog">{label}</p>
        <span className={clsx("flex h-10 w-10 items-center justify-center rounded-xl", tones[tone])}><Icon className="h-[18px] w-[18px]" /></span>
      </div>
      <p className="mt-4 font-serif text-5xl leading-none">{value}</p>
      {hint && <p className="mt-3 text-xs text-fog-dark">{hint}</p>}
    </div>
  );
}
