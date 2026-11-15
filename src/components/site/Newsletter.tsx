"use client";

import { useState, type FormEvent } from "react";
import { errorMessage, post } from "@/lib/http";
import { IconArrowUpRight, IconCheck } from "./icons";

/** Footer sign-up – stored as a message in the admin inbox (Admin → Messages). */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address");
    setError("");
    setState("busy");
    try {
      await post("/contact", { name: "Newsletter subscriber", email: email.trim(), subject: "Newsletter signup", message: "Please add this address to the clinic's skin-notes mailing list." });
      setState("done");
    } catch (err) {
      setError(errorMessage(err));
      setState("idle");
    }
  }

  return (
    <div className="mt-8 max-w-xs">
      <p className="text-[1.05rem] text-espresso">Skin notes</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">Occasional, evidence-led advice from our clinicians. No spam.</p>
      {state === "done" ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-espresso"><IconCheck size={16} className="text-bronze" /> Thank you — you&apos;re on the list.</p>
      ) : (
        <form onSubmit={submit} noValidate className="mt-4">
          <div className="flex items-center gap-1 rounded-full border border-line bg-card/60 p-1 pl-4 focus-within:border-espresso/50">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input id="newsletter-email" type="email" autoComplete="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-sm text-espresso placeholder:text-muted/70 focus:outline-none" />
            <button type="submit" disabled={state === "busy"} aria-label="Subscribe" className="grid size-9 shrink-0 place-items-center rounded-full bg-espresso text-cream transition-colors hover:bg-cocoa disabled:opacity-60">
              <IconArrowUpRight />
            </button>
          </div>
          {error && <p role="alert" className="mt-2 text-xs text-rose-400">{error}</p>}
        </form>
      )}
    </div>
  );
}
