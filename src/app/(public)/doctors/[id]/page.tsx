import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconCheck } from "@/components/site/icons";
import { AvailabilityHeatmap } from "@/components/site/AvailabilityHeatmap";
import { QuickBook } from "@/components/site/QuickBook";
import { ArrowButton, CtaPanel, Eyebrow, ParallaxImg, PillLink, Reveal, RevealGroup, RevealItem, SplitHeading, StarRow } from "@/components/site/ui";
import { getDoctor, getSchedule } from "@/services/doctors";
import { DAY_NAMES, formatMoney, formatTime } from "@/utils/format";
import type { Doctor } from "@/types";

export const dynamic = "force-dynamic";

const ORDER = [1, 2, 3, 4, 5, 6, 0];

async function load(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  try {
    const doctor = (await getDoctor(id)) as unknown as Doctor;
    const schedule = await getSchedule(id);
    return { doctor, schedule };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const data = await load((await params).id);
  if (!data) return { title: "Doctor" };
  return { title: data.doctor.name, description: `${data.doctor.name} — ${data.doctor.specialization}. ${data.doctor.bio}`.slice(0, 200) };
}

export default async function DoctorPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await load((await params).id);
  if (!data) notFound();
  const { doctor: d, schedule } = data;
  const quals = d.qualifications.split("·").map((q) => q.trim()).filter(Boolean);
  const stats: [string, string][] = [
    ["Experience", `${d.experienceYears} years`],
    ["Rating", `${d.rating.toFixed(1)} · ${d.reviewCount} reviews`],
    ["Consultation", formatMoney(d.consultationFee)],
  ];

  return (
    <>
      <section className="container-site pb-20 pt-28 lg:pb-28 lg:pt-36">
        <Link href="/doctors" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-espresso"><IconArrowLeft size={15} /> All doctors</Link>
        <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <div>
            <Reveal><Eyebrow>{d.specialization}</Eyebrow></Reveal>
            <SplitHeading as="h1" immediate id="page-title" className="text-headline mt-6" text={d.name} />
            <Reveal delay={0.15}><p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-muted">{d.bio}</p></Reveal>
            {quals.length > 0 && (
              <RevealGroup className="mt-8 max-w-md divide-y divide-line border-y border-line" delay={0.2}>
                {quals.map((q) => (
                  <RevealItem key={q} className="flex items-center gap-4 py-4 text-[0.95rem] text-espresso">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sand text-bronze"><IconCheck /></span>
                    {q}
                  </RevealItem>
                ))}
              </RevealGroup>
            )}
            <Reveal delay={0.25} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <ArrowButton href={`/dashboard/book?doctorId=${d.id}`}>Book with Dr. {d.lastName}</ArrowButton>
              <Link href="/contact#book" className="text-sm text-espresso underline decoration-line underline-offset-4 hover:decoration-espresso">Or request a call back</Link>
            </Reveal>
            <dl className="mt-12 grid max-w-lg grid-cols-1 gap-6 border-t border-line pt-8 sm:grid-cols-3">
              {stats.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted">{k}</dt>
                  <dd className="mt-2 font-serif text-lg leading-tight">{k === "Rating" ? <span className="flex items-center gap-2"><StarRow className="text-bronze" />{v}</span> : v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <Reveal delay={0.1}><ParallaxImg src={d.photoUrl ?? undefined} className="aspect-[4/5] rounded-[var(--radius-panel)] bg-sand sm:aspect-[5/4] lg:aspect-[4/5]" imgClassName="object-top" /></Reveal>
        </div>
      </section>

      {d.treatments.length > 0 && (
        <section aria-labelledby="treatments-title" className="bg-sand/50 py-20 lg:py-28">
          <div className="container-site grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <Reveal><Eyebrow>Treatments</Eyebrow></Reveal>
              <SplitHeading id="treatments-title" className="text-headline mt-6" text={"What Dr. " + d.lastName + "\nperforms"} />
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {d.treatments.map((t, i) => (
                <Reveal key={t.id} delay={0.06 * i}>
                  <li className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
                    <div>
                      <Link href={`/treatments/${t.slug}`} className="font-serif text-[1.35rem] leading-tight hover:text-bronze">{t.name}</Link>
                      <p className="mt-1 text-sm text-muted">{t.durationMinutes} min · from {formatMoney(t.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PillLink href={`/treatments/${t.slug}`}>Details</PillLink>
                      <ArrowButton href={`/dashboard/book?doctorId=${d.id}&treatmentId=${t.id}`} variant="outline" small>Book</ArrowButton>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section aria-labelledby="availability-title" className="py-20 lg:py-28">
        <div className="container-site grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <Reveal><Eyebrow>Availability</Eyebrow></Reveal>
            <SplitHeading id="availability-title" className="text-headline mt-6" text={"Working\nhours"} />
            <Reveal delay={0.1}>
              <ul className="mt-9 divide-y divide-line border-y border-line text-[0.95rem]">
                {ORDER.map((dow) => {
                  const day = schedule.days.find((x) => x.dayOfWeek === dow);
                  const blocks = day?.blocks ?? [];
                  return (
                    <li key={dow} className="flex items-start justify-between gap-6 py-3.5">
                      <span className={blocks.length ? "text-espresso" : "text-muted"}>{DAY_NAMES[dow]}</span>
                      <span className={blocks.length ? "text-right text-espresso" : "text-muted"}>
                        {blocks.length ? blocks.map((b) => `${formatTime(b.startTime)} – ${formatTime(b.endTime)}`).map((t) => <span key={t} className="block">{t}</span>) : "Not available"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          </div>
          <div>
            <Reveal><p className="mb-5 font-serif text-[1.6rem] leading-tight">Next available with Dr. {d.lastName}</p></Reveal>
            <Reveal delay={0.1}><QuickBook doctorId={d.id} treatments={d.treatments.map((t) => ({ id: t.id, name: t.name }))} /></Reveal>
          </div>
        </div>
      </section>

      {d.treatments.length > 0 && (
        <section aria-labelledby="heatmap-title" className="pb-20 lg:pb-28">
          <div className="container-site">
            <div className="mb-10 flex flex-col items-center text-center">
              <Reveal><Eyebrow>Four-week view</Eyebrow></Reveal>
              <SplitHeading id="heatmap-title" className="text-headline mt-6" text={"Plan your visit\nwith confidence"} />
            </div>
            <Reveal><AvailabilityHeatmap doctorId={d.id} treatments={d.treatments.map((t) => ({ id: t.id, name: t.name }))} /></Reveal>
          </div>
        </section>
      )}

      <CtaPanel slot="doctor-clinic" />
    </>
  );
}
