"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle, RotateCcw, SendHorizontal, Sparkles, X } from "lucide-react";
import { CLINIC } from "@/lib/brand";
import { greeting, reply, type Reply } from "@/lib/concierge";
import { get } from "@/lib/http";
import { formatDate, formatMoney, formatTime } from "@/utils/format";
import type { Treatment } from "@/types";
import { EASE, SiteImg } from "./ui";

type Msg = { id: number; from: "bot" | "me"; time: number; reply?: Reply; text?: string };
type Next = { offers: { doctor: { id: number; name: string }; date: string; slots: string[] }[] };
type Flow = "offerRestart" | "askEmail" | null;

const STORE_KEY = "clinova:concierge";
const SEEN_KEY = "clinova:concierge:seen";
const MAX_TURNS = 14;

const START_CHIPS = ["What's available this week?", "Treatment prices", "Which treatment suits me?", "Opening hours"];

/** Shape the API's offers into the shape the concierge expects. */
const toOffers = (data: Next | null) =>
  (data?.offers ?? []).map((o) => ({ doctor: o.doctor.name, doctorId: o.doctor.id, date: o.date, slots: o.slots }));

/**
 * Ava – the clinic concierge. Answers treatment, price, availability and logistics questions with live data,
 * offers real slots, hands off to the care team (stored as a message in the admin inbox) and remembers the
 * conversation between visits.
 */
export function Concierge() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [offers, setOffers] = useState<Reply["offers"]>([]);
  const [flow, setFlow] = useState<Flow>(null);
  const [unread, setUnread] = useState(0);
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const nodes = useRef<Map<number, HTMLDivElement>>(new Map());
  const followed = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const counter = useRef(0);
  const returnTo = useRef<HTMLElement | null>(null);
  const nextId = () => ++counter.current;

  /* ------------------------------ data ------------------------------ */
  useEffect(() => {
    get<Treatment[]>("/treatments").then(setTreatments).catch(() => setTreatments([]));
  }, []);

  useEffect(() => {
    if (!open || offers?.length) return;
    const probe = treatments.find((t) => t.slug === "facial-treatments") ?? treatments[0];
    if (!probe) return;
    get<Next>("/availability/next", { treatmentId: probe.id, limit: 2 })
      .then((d) => setOffers(toOffers(d)))
      .catch(() => setOffers([]));
  }, [open, treatments, offers]);

  /* ---------------------------- persistence ---------------------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { msgs: Msg[]; offers?: Reply["offers"] };
        if (Array.isArray(parsed.msgs) && parsed.msgs.length) {
          setMsgs(parsed.msgs.slice(-MAX_TURNS));
          if (parsed.offers) setOffers(parsed.offers);
          counter.current = Math.max(...parsed.msgs.map((m) => m.id));
          return;
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    const g = greeting([]);
    setMsgs([{ id: nextId(), from: "bot", time: Date.now(), reply: g }]);
    try {
      const seen = localStorage.getItem(SEEN_KEY);
      if (!seen) setUnread(1);
    } catch {
      /* ignore */
    }
  }, []);

  // Greeting mentions the number of treatments once the catalogue arrives.
  useEffect(() => {
    if (treatments.length === 0 || msgs.length !== 1) return;
    setMsgs([{ id: msgs[0].id, from: "bot", time: msgs[0].time, reply: greeting(treatments) }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treatments.length]);

  useEffect(() => {
    if (msgs.length < 2) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ msgs: msgs.slice(-MAX_TURNS), offers }));
    } catch {
      /* storage full – chat simply won't persist */
    }
  }, [msgs, offers]);

  /* ------------------------------ chrome ------------------------------ */
  /** Scrolls the transcript so the newest answer starts at its first line (not its last). */
  const anchorLatest = useCallback(
    (smooth = true) => {
      const el = scroller.current;
      const last = msgs[msgs.length - 1];
      if (!el || !last) return;
      const behaviour = smooth && !reduce ? "smooth" : "auto";
      if (typing) {
        el.scrollTo({ top: el.scrollHeight, behavior: behaviour });
        return;
      }
      const node = nodes.current.get(last.id);
      if (!node) {
        el.scrollTo({ top: el.scrollHeight, behavior: behaviour });
        return;
      }
      // Own messages: keep the composer in view. Answers: pin the first line to the top of the panel.
      const top = last.from === "me" ? node.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 8 : node.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 12;
      el.scrollTo({ top: Math.max(0, top), behavior: behaviour });
    },
    [msgs, reduce, typing],
  );

  // Only follow along while the visitor is already at the bottom – scrolling back pauses the auto-scroll.
  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    followed.current = near;
    setShowJump(!near);
  }, []);

  useEffect(() => {
    if (!followed.current) return;
    const raf = requestAnimationFrame(() => anchorLatest());
    return () => cancelAnimationFrame(raf);
  }, [msgs, typing, anchorLatest]);

  // Opening the panel always starts at the latest message.
  useEffect(() => {
    if (!open) return;
    const el = scroller.current;
    if (!el) return;
    followed.current = true;
    const t = window.setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: "auto" }), 60);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setUnread(0);
    const t = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 260);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        returnTo.current?.focus?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const push = useCallback((m: Omit<Msg, "id" | "time">) => {
    setMsgs((list) => [...list, { ...m, id: nextId(), time: Date.now() }].slice(-MAX_TURNS));
  }, []);

  const respond = useCallback(
    (question: string, currentFlow: Flow) => {
      setTyping(true);
      const delay = reduce ? 200 : 550 + Math.min(900, question.length * 12);
      window.setTimeout(() => {
        // Guided flows
        if (currentFlow === "askEmail" && /\S+@\S+\.\S+/.test(question.trim())) {
          const subject = "Concierge follow-up";
          fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Concierge visitor", email: question.trim(), subject, message: "Requested a callback through the website concierge.\n\nConversation excerpt:\n" + msgs.filter((m) => m.from === "me").slice(-4).map((m) => `- ${m.text ?? ""}`).join("\n") }),
          })
            .then(() => {
              setSaved(true);
              push({ from: "bot", reply: { text: "Got it — I've passed your email to the care team. They'll reply within one working day. In the meantime, is there anything else I can answer?", chips: ["Book a visit", "Opening hours"] } });
            })
            .catch(() => push({ from: "bot", reply: { text: "I couldn't save that just now. Please call us on " + CLINIC.phone + " or use the contact form.", links: [{ label: "Contact form", href: "/contact#book" }] } }))
            .finally(() => {
              setTyping(false);
              setFlow(null);
            });
          return;
        }
        const r = reply(question, { treatments, offers, today: new Date().toISOString().slice(0, 10) });
        push({ from: "bot", reply: r });
        if (r.handoff) setFlow("askEmail");
        else if (currentFlow === "askEmail") setFlow(null);
        setTyping(false);
      }, delay);
    },
    [msgs, offers, push, reduce, treatments],
  );

  const ask = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || typing) return;
      setInput("");
      push({ from: "me", text });
      respond(text, flow);
    },
    [flow, push, respond, typing],
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  const jumpToLatest = () => {
    followed.current = true;
    setShowJump(false);
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  };

  const restart = () => {
    setMsgs([{ id: nextId(), from: "bot", time: Date.now(), reply: greeting(treatments) }]);
    setFlow(null);
    setSaved(false);
    setEmail("");
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
  };

  const lastBot = useMemo(() => [...msgs].reverse().find((m) => m.from === "bot"), [msgs]);
  const chips = lastBot?.reply?.chips ?? (msgs.length <= 1 ? START_CHIPS : []);

  return (
    <>
      {/* Launcher */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="concierge-panel"
        aria-label={open ? "Close concierge chat" : "Open concierge chat with Ava"}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 1.5 }}
        className="group fixed bottom-[5.5rem] right-4 z-40 flex h-14 items-center gap-2.5 overflow-hidden rounded-full bg-espresso pr-2 text-cream shadow-float transition-colors hover:bg-cocoa sm:bottom-6 sm:right-6 sm:pr-5 dark:hover:bg-umber"
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent,rgba(255,253,249,0.22),transparent)] transition-transform duration-1000 group-hover:translate-x-full" />
        <span className="relative grid size-10 place-items-center rounded-full bg-cream/15">
          {open ? <X size={18} /> : <MessageCircle size={18} />}
          {!open && <span className="pulse-dot absolute right-0.5 top-0.5 size-2 rounded-full bg-emerald-400" />}
        </span>
        <span className="hidden text-[0.88rem] font-medium sm:inline">{open ? "Close" : "Ask Ava"}</span>
        {!open && unread > 0 && <span className="grid size-5 place-items-center rounded-full bg-[#e3bd93] text-[0.66rem] font-bold text-[#2a1a14]">{unread}</span>}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="concierge-panel"
            role="dialog"
            aria-label="Clinic concierge"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="fixed bottom-[9.5rem] right-4 z-[46] flex h-[min(36rem,calc(100svh-11rem))] w-[min(24.5rem,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-[1.75rem] border border-line bg-card text-espresso shadow-float sm:bottom-24 sm:right-6"
          >
            {/* Header */}
            <div className="relative overflow-hidden bg-[#2a1a14] px-5 pb-4 pt-4 text-ivory">
              <div aria-hidden className="animate-aurora absolute -right-1/4 -top-1/2 size-64 rounded-full bg-[radial-gradient(closest-side,rgba(214,166,118,0.4),transparent)]" />
              <div className="relative flex items-center gap-3">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-ivory/20">
                  <SiteImg slot="doctor-portrait" className="object-top" />
                  <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-400 ring-2 ring-[#2a1a14]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg leading-tight">Ava · Clinic concierge</p>
                  <p className="mt-0.5 text-[0.7rem] text-ivory/70">Replies instantly · care team in 1 working day</p>
                </div>
                <button type="button" onClick={restart} aria-label="Start a new conversation" title="Start again" className="grid size-8 shrink-0 place-items-center rounded-full border border-ivory/20 text-ivory/80 transition-colors hover:bg-ivory/10 hover:text-ivory">
                  <RotateCcw size={14} />
                </button>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="grid size-8 shrink-0 place-items-center rounded-full border border-ivory/20 text-ivory/80 transition-colors hover:bg-ivory/10 hover:text-ivory">
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scroller} onScroll={onScroll} data-lenis-prevent className="relative flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" aria-relevant="additions">
              {msgs.map((m) => (
                <motion.div
                  key={m.id}
                  ref={(node) => {
                    if (node) nodes.current.set(m.id, node);
                    else nodes.current.delete(m.id);
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className={clsx("flex flex-col", m.from === "me" ? "items-end" : "items-start")}
                >
                  {m.from === "bot" && m.reply ? (
                    <div className="max-w-[92%]">
                      <div className="rounded-2xl rounded-bl-md bg-sand px-4 py-3">
                        <p className="text-[0.88rem] leading-relaxed">{m.reply.text}</p>

                        {m.reply.treatment && (
                          <Link href={`/treatments/${m.reply.treatment.slug}`} onClick={() => setOpen(false)} className="mt-3 flex items-center gap-3 rounded-xl bg-card p-2.5 ring-1 ring-line transition-transform hover:-translate-y-0.5">
                            <span className="relative size-12 shrink-0 overflow-hidden rounded-lg"><SiteImg src={m.reply.treatment.imageUrl ?? undefined} /></span>
                            <span className="min-w-0">
                              <span className="block truncate text-[0.82rem] font-medium">{m.reply.treatment.name}</span>
                              <span className="block text-[0.7rem] text-muted">{m.reply.treatment.durationLabel ?? ""} · {m.reply.treatment.downtime ? `${m.reply.treatment.downtime} downtime` : "minimal downtime"} · {formatMoney(m.reply.treatment.price)}</span>
                            </span>
                          </Link>
                        )}

                        {m.reply.offers && m.reply.offers.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {m.reply.offers.map((o) => (
                              <li key={o.doctorId} className="rounded-xl bg-card p-2.5 ring-1 ring-line">
                                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-bronze">{formatDate(o.date, "medium")} · {o.doctor}</p>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {o.slots.slice(0, 3).map((s) => (
                                    <Link key={s} href={`/dashboard/book?doctorId=${o.doctorId}&date=${o.date}&time=${s}`} onClick={() => setOpen(false)} className="rounded-full border border-line px-2.5 py-1 text-[0.72rem] font-medium transition-colors hover:border-espresso hover:bg-espresso hover:text-cream">
                                      {formatTime(s)}
                                    </Link>
                                  ))}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}

                        {m.reply.links && m.reply.links.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {m.reply.links.map((l) => (
                              <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)} className="rounded-full bg-espresso px-3 py-1.5 text-[0.72rem] font-medium text-cream transition-colors hover:bg-cocoa">
                                {l.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                      <time className="mt-1 block px-1 text-[0.62rem] text-muted/70">{new Date(m.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</time>
                    </div>
                  ) : (
                    <>
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-espresso px-4 py-3 text-[0.88rem] leading-relaxed text-cream">{m.text}</p>
                      <time className="mt-1 block px-1 text-[0.62rem] text-muted/70">{new Date(m.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</time>
                    </>
                  )}
                </motion.div>
              ))}

              {typing && (
                <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-md bg-sand px-4 py-3.5" aria-label="Ava is typing">
                  {[0, 1, 2].map((i) => <span key={i} className="typing-dot size-1.5 rounded-full bg-muted" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              )}

              {flow === "askEmail" && !typing && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!/\S+@\S+\.\S+/.test(email.trim())) return;
                    ask(email.trim());
                    setEmail("");
                  }}
                  className="rounded-2xl border border-line bg-cream/70 p-3"
                >
                  <label htmlFor="concierge-email" className="text-[0.7rem] font-medium text-muted">Your email, so the team can reply</label>
                  <div className="mt-1.5 flex gap-2">
                    <input id="concierge-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 rounded-full border border-line bg-card px-3 py-1.5 text-sm focus:border-espresso/50 focus:outline-none" />
                    <button type="submit" disabled={!/\S+@\S+\.\S+/.test(email.trim())} className="rounded-full bg-espresso px-3 text-xs text-cream disabled:opacity-40">Send</button>
                  </div>
                </form>
              )}
              {saved && !typing && <p className="text-center text-[0.66rem] text-emerald-700">Saved — the care team has your message.</p>}

              {showJump && !typing && (
                <div className="sticky bottom-0 z-10 flex justify-center pt-1">
                  <button type="button" onClick={jumpToLatest} className="pointer-events-auto rounded-full border border-line bg-espresso px-3.5 py-1.5 text-[0.7rem] font-medium text-cream shadow-float transition-colors hover:bg-cocoa">
                    Jump to the latest ↓
                  </button>
                </div>
              )}

              {chips.length > 0 && !typing && flow !== "askEmail" && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {chips.map((c) => (
                    <button key={c} type="button" onClick={() => ask(c)} className="rounded-full border border-line bg-card px-3 py-1.5 text-[0.72rem] font-medium transition-colors hover:border-espresso/40 hover:bg-sand">
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Composer */}
            <form onSubmit={submit} className="border-t border-line p-3">
              <div className="flex items-center gap-2 rounded-full border border-line bg-cream/60 p-1 pl-4 focus-within:border-espresso/50">
                <label htmlFor="concierge-input" className="sr-only">Your question</label>
                <input
                  id="concierge-input"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={flow === "askEmail" ? "Type your email above…" : "Ask about treatments, prices…"}
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm placeholder:text-muted/70 focus:outline-none"
                />
                <button type="submit" disabled={!input.trim() || typing} aria-label="Send message" className="grid size-9 shrink-0 place-items-center rounded-full bg-espresso text-cream transition-opacity disabled:opacity-40">
                  <SendHorizontal size={15} />
                </button>
              </div>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[0.64rem] text-muted">
                <Sparkles size={11} aria-hidden /> Automated assistant · general information only, not medical advice
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
