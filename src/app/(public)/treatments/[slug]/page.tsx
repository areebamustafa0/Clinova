import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconArrowUpRight, IconCheck } from "@/components/site/icons";
import { FaqList } from "@/components/site/Faq";
import { QuickBook } from "@/components/site/QuickBook";
import { ArrowButton, CtaPanel, Eyebrow, ParallaxImg, Reveal, SplitHeading } from "@/components/site/ui";
import { sortTreatments } from "@/lib/site-content";
import { TREATMENT_CONTENT, type TreatmentContent } from "@/lib/treatment-content";
import { getTreatment, listTreatments } from "@/services/treatments";
import { formatMoney } from "@/utils/format";
import type { Treatment } from "@/types";

const generic = (t: Treatment): TreatmentContent => ({
  tagline: t.category,
  intro: t.description,
  benefitsTitle: "What you can expect to see",
  benefits: ["Visible, natural-looking improvement", "A plan tailored to your skin", "Medical-grade products and technology", "Clear aftercare from your clinician"],
  steps: [["Consultation", "We assess your skin and listen to your goals."], ["Preparation", "Your skin is cleansed and prepared for treatment."], ["Treatment", "Your clinician performs the treatment with care."], ["Aftercare", "You leave with simple, clear guidance."]],
  faqTitle: `Questions about ${t.name.toLowerCase()}`,
  faqs: [["Is it suitable for me?", "A consultation will confirm the safest, most effective option for your skin."], ["How long does it take?", `Most sessions take around ${t.durationLabel ?? `${t.durationMinutes} minutes`}.`], ["Is there downtime?", "We will always explain recovery clearly before you begin."]],
  ctaTitle: "Ready to begin your treatment?",
  ctaText: "Every plan starts with a consultation. We'll assess your skin and recommend only what you need.",
  imgs: { hero: "", benefit: "", cta: "" },
});

export const dynamic = "force-dynamic";

async function load(slug: string) {
  try {
    return (await getTreatment(/^\d+$/.test(slug) ? Number(slug) : slug)) as unknown as Treatment;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = await load((await params).slug);
  return { title: t?.name ?? "Treatment", description: t?.description, openGraph: t?.imageUrl ? { images: [{ url: t.imageUrl }] } : undefined };
}

export default async function TreatmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await load(slug);
  if (!t) notFound();
  const related = sortTreatments((await listTreatments({})) as unknown as Treatment[]).filter((x) => x.slug !== t.slug).slice(0, 3);

  const c = (t.slug && TREATMENT_CONTENT[t.slug]) || generic(t);
  const slot = (s: string, fallback?: string | null) => (s ? { slot: s } : { src: fallback ?? undefined });
  const stats = [["Duration", t.durationLabel ?? `${t.durationMinutes} min`], ["Sessions", t.sessions], ["Downtime", t.downtime], ["From", formatMoney(t.price)]].filter(([, v]) => v);

  return (
    <>
      <section className="container-site pb-20 pt-28 lg:pb-28 lg:pt-36">
        <Link href="/treatments" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-espresso"><IconArrowLeft size={15} /> All treatments</Link>
        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <Reveal><Eyebrow>{t.tagline ?? c.tagline}</Eyebrow></Reveal>
            <SplitHeading as="h1" immediate id="page-title" className="text-headline mt-6" text={t.name} />
            <Reveal delay={0.15}><p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-muted">{c.intro}</p></Reveal>
            <Reveal delay={0.25} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <ArrowButton href="/contact#book">Book a Consultation</ArrowButton>
              <Link href={`/dashboard/book?treatmentId=${t.id}`} className="text-sm text-espresso underline decoration-line underline-offset-4 hover:decoration-espresso">Or book online instantly</Link>
            </Reveal>
            <dl className="mt-12 grid max-w-md grid-cols-2 gap-6 border-t border-line pt-8 sm:grid-cols-4">
              {stats.map(([k, v]) => (
                <div key={k}><dt className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted">{k}</dt><dd className="mt-2 font-serif text-lg leading-tight">{v}</dd></div>
              ))}
            </dl>
          </div>
          <Reveal delay={0.1}><ParallaxImg {...slot(c.imgs.hero, t.imageUrl)} className="aspect-[4/5] rounded-[var(--radius-panel)] bg-sand sm:aspect-[5/4] lg:aspect-[4/5]" /></Reveal>
        </div>
      </section>

      <section aria-labelledby="benefits-title" className="bg-sand/50 py-20 lg:py-28">
        <div className="container-site grid items-center gap-10 md:grid-cols-2 lg:gap-20">
          <Reveal className="order-2 md:order-1"><ParallaxImg {...slot(c.imgs.benefit, t.imageUrl)} className="aspect-[4/5] rounded-[var(--radius-panel)]" /></Reveal>
          <div className="order-1 md:order-2">
            <Reveal><Eyebrow>Benefits</Eyebrow></Reveal>
            <SplitHeading id="benefits-title" className="text-headline mt-6" text={c.benefitsTitle} />
            <div className="mt-9 divide-y divide-line border-y border-line">
              {c.benefits.map((b, i) => (
                <Reveal key={b} delay={0.08 * i} className="flex items-center gap-4 py-4 text-[0.95rem] text-espresso">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-bronze"><IconCheck /></span>
                  {b}
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="steps-title" className="py-20 lg:py-28">
        <div className="container-site">
          <div className="flex flex-col items-center text-center">
            <Reveal><Eyebrow>Your treatment journey</Eyebrow></Reveal>
            <SplitHeading id="steps-title" className="text-headline mt-6" text="What to expect" />
          </div>
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {c.steps.map(([title, text], i) => (
              <Reveal key={title} delay={i * 0.08} className="flex min-h-[14rem] flex-col rounded-[var(--radius-card)] bg-sand p-7">
                <span className="font-serif text-bronze">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-auto font-serif text-[1.5rem] leading-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="book-online-title" className="pb-20 lg:pb-28">
        <div className="container-site">
          <div className="mb-10 flex flex-col items-center text-center">
            <Reveal><Eyebrow>Book online</Eyebrow></Reveal>
            <SplitHeading id="book-online-title" className="text-headline mt-6" text={"Next available\nappointments"} />
          </div>
          <Reveal><QuickBook treatments={[{ id: t.id, name: t.name }]} /></Reveal>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="py-20 lg:py-28">
        <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Reveal><Eyebrow>FAQs</Eyebrow></Reveal>
            <SplitHeading id="faq-title" className="text-headline mt-6" text={c.faqTitle} />
            <Reveal delay={0.1}><p className="mt-6 max-w-sm text-[0.98rem] leading-relaxed text-muted">Can&apos;t find your answer? <Link href="/contact" className="text-espresso underline decoration-line underline-offset-4 hover:decoration-espresso">Speak to our team</Link></p></Reveal>
          </div>
          <Reveal delay={0.1}><FaqList items={c.faqs} /></Reveal>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-site pb-16 lg:pb-24">
          <div className="flex items-end justify-between gap-6 border-t border-line pt-12">
            <h2 id="related-title" className="text-title">You may also consider</h2>
            <Link href="/treatments" className="text-sm text-espresso underline decoration-line underline-offset-4 hover:decoration-espresso">View all</Link>
          </div>
          <ul className="mt-10 grid gap-10 md:grid-cols-3 md:gap-5">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/treatments/${r.slug}`} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-sand">
                    <ParallaxImg src={r.imageUrl ?? undefined} className="size-full" imgClassName="transition-transform duration-[1200ms] ease-[var(--ease-editorial)] group-hover:scale-105" />
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div><h3 className="font-serif text-[1.5rem] leading-tight">{r.name}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{r.description}</p></div>
                    <IconArrowUpRight size={18} className="mt-1 shrink-0 text-espresso transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CtaPanel title={c.ctaTitle} text={c.ctaText} slot={c.imgs.cta || "portrait-soft"} />
    </>
  );
}
