import Link from "next/link";
import { formatMoney } from "@/utils/format";
import type { Treatment } from "@/types";
import { IconCheck, IconStar } from "./icons";
import { ArrowButton, Eyebrow, ParallaxImg, Reveal, RevealGroup, RevealItem, SplitHeading } from "./ui";

/**
 * Editorial opener under the hero: a magazine-style split of type, portrait and a live price card,
 * with the promise list and a link into the full menu.
 */
export function EditorialSplit({ treatments }: { treatments: Treatment[] }) {
  const cheapest = [...treatments].sort((a, b) => a.price - b.price)[0];
  const featured = treatments.find((t) => t.slug === "skin-rejuvenation") ?? treatments[1] ?? treatments[0];

  return (
    <section aria-labelledby="editorial-title" className="section-y">
      <div className="container-site grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <div>
          <Reveal><Eyebrow>Consultant-led · Marylebone</Eyebrow></Reveal>
          <SplitHeading id="editorial-title" className="text-headline mt-6" text={"A clinic that treats\nskin as health"} />
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-lg text-[1.02rem] leading-relaxed text-muted">
              No packages pushed at the door, no trend-led menus. Every visit begins with a proper assessment and ends with a plan you understand — often with fewer treatments than you expected.
            </p>
          </Reveal>
          <RevealGroup className="mt-9 grid gap-x-8 gap-y-4 sm:grid-cols-2" delay={0.15}>
            {["Consultant dermatologist on every plan", "Written aftercare after every visit", "Transparent prices, no upsell", "Free cancellation up to 2 hours before"].map((t) => (
              <RevealItem key={t} className="flex items-start gap-3 text-[0.95rem] text-espresso">
                <IconCheck size={16} className="mt-0.5 shrink-0 text-bronze" />
                {t}
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal delay={0.25} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <ArrowButton href="/treatments">Explore every treatment</ArrowButton>
            <Link href="/skin-quiz" className="text-sm text-espresso underline decoration-line underline-offset-4 hover:decoration-espresso">Not sure where to start? Take the quiz</Link>
          </Reveal>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <ParallaxImg slot="clinic-editorial" className="aspect-[4/5] rounded-[var(--radius-panel)] bg-sand" />
          {featured && (
            <Reveal delay={0.2} className="absolute -bottom-6 -left-4 w-[16rem] rounded-2xl border border-line bg-cream p-5 shadow-float sm:-left-8">
              <p className="flex items-center gap-1 text-bronze">{Array.from({ length: 5 }).map((_, i) => <IconStar key={i} size={12} />)}</p>
              <p className="mt-2 font-serif text-[1.35rem] leading-tight">{featured.name}</p>
              <p className="mt-1 text-xs text-muted">{featured.durationLabel ?? `${featured.durationMinutes} min`} · from {formatMoney(featured.price)}</p>
              <Link href={`/treatments/${featured.slug}`} className="mt-3 inline-flex text-[0.78rem] font-medium text-espresso underline decoration-line underline-offset-4 hover:decoration-espresso">
                Read the treatment guide
              </Link>
            </Reveal>
          )}
          {cheapest && (
            <Reveal delay={0.3} className="absolute -right-3 top-6 rounded-full bg-espresso px-4 py-2 text-[0.72rem] font-medium text-cream shadow-float sm:-right-6">
              From {formatMoney(cheapest.price)}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
