import Link from "next/link";
import { BRAND, CLINIC } from "@/lib/brand";
import { Newsletter } from "./Newsletter";
import { OpenStatus } from "./OpenStatus";
import { PortalLink } from "./PortalLink";
import { SearchTrigger } from "./SearchTrigger";
import { LogoMark } from "./SiteHeader";

const svg = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
    <path d={d} />
  </svg>
);
const socials = [
  { label: "Instagram", href: "https://instagram.com", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect width="18" height="18" x="3" y="3" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></svg> },
  { label: "Facebook", href: "https://facebook.com", icon: svg("M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z") },
  { label: "TikTok", href: "https://tiktok.com", icon: svg("M15 3v11.5a3.5 3.5 0 1 1-3.5-3.5M15 3c.4 2.6 2 4.2 5 4.5") },
];

export const FOOTER_TREATMENTS = [
  ["Facial Treatments", "facial-treatments"],
  ["Skin Rejuvenation", "skin-rejuvenation"],
  ["Acne & Acne Scarring", "acne"],
  ["Pigmentation", "pigmentation"],
  ["Laser Treatments", "laser-treatments"],
  ["Anti-Aging", "anti-aging"],
];

export function SiteFooter() {
  return (
    <footer className="container-site pb-6 pt-4">
      <div className="rounded-[var(--radius-panel)] bg-sand px-6 pb-6 pt-14 md:px-12 md:pt-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <Link href="/" aria-label={`${BRAND.full} — home`}><LogoMark /></Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">{BRAND.tagline}</p>
            <p className="mt-6 text-sm leading-relaxed text-espresso">
              {CLINIC.address[0]}
              <br />
              {CLINIC.address[1]}
            </p>
            <Newsletter />
            <div className="mt-6"><SearchTrigger /></div>
          </div>
          <div className="md:col-span-2">
            <h2 className="text-[1.05rem] text-espresso">Explore</h2>
            <ul className="mt-5 space-y-2.5 text-sm text-espresso/80">
              {[["Home", "/"], ["About", "/about"], ["Treatments", "/treatments"], ["Doctors", "/doctors"], ["Skin quiz", "/skin-quiz"], ["Pricing", "/pricing"], ["Results", "/results"], ["Contact", "/contact"]].map(([l, h]) => (
                <li key={h}><Link href={h} className="transition-colors hover:text-bronze">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <h2 className="text-[1.05rem] text-espresso">Treatments</h2>
            <ul className="mt-5 space-y-2.5 text-sm text-espresso/80">
              {FOOTER_TREATMENTS.map(([l, s]) => (
                <li key={s}><Link href={`/treatments/${s}`} className="transition-colors hover:text-bronze">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3">
            <h2 className="text-[1.05rem] text-espresso">Visit</h2>
            <OpenStatus className="mt-3" />
            <ul className="mt-5 space-y-2.5 text-sm text-espresso/80">
              <li><a href={CLINIC.phoneHref} className="hover:text-bronze">{CLINIC.phone}</a></li>
              <li><a href={`mailto:${CLINIC.email}`} className="break-all hover:text-bronze">{CLINIC.email}</a></li>
              {CLINIC.hours.map(([d, h]) => (
                <li key={d} className="flex justify-between gap-4 text-muted"><span>{d}</span><span>{h}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col-reverse gap-5 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.full}. All rights reserved. <PortalLink />
          </p>
          <ul className="flex items-center gap-2">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="grid size-9 place-items-center rounded-full border border-line text-espresso transition-colors hover:bg-espresso hover:text-cream">
                  {s.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
