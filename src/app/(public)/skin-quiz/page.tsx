import type { Metadata } from "next";
import { SkinQuiz } from "@/components/site/SkinQuiz";
import { Eyebrow, Reveal, SplitHeading } from "@/components/site/ui";
import { pageMeta } from "@/lib/seo";
import { sortTreatments } from "@/lib/site-content";
import { listTreatments } from "@/services/treatments";
import type { Treatment } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta("Skin quiz", "Answer a few quick questions about your skin, downtime and budget and get personalised treatment recommendations from our doctors.");

export default async function SkinQuizPage({ searchParams }: { searchParams: Promise<{ concern?: string }> }) {
  const { concern } = await searchParams;
  const treatments = sortTreatments((await listTreatments({})) as unknown as Treatment[]);
  return (
    <section aria-labelledby="page-title" className="pb-24 pt-32 lg:pb-32 lg:pt-40">
      <div className="container-site">
        <div className="mx-auto mb-14 flex max-w-3xl flex-col items-center text-center">
          <Reveal><Eyebrow>Skin quiz · 2 minutes</Eyebrow></Reveal>
          <SplitHeading as="h1" immediate id="page-title" className="text-headline mt-6" text={"Find the treatment\nthat suits your skin"} />
          <Reveal delay={0.15}><p className="mt-6 max-w-lg text-[0.98rem] leading-relaxed text-muted">Five quick questions. We&apos;ll match your answers against every treatment we offer — then you can book, save your plan or talk it through with a doctor.</p></Reveal>
        </div>
        <SkinQuiz treatments={treatments} initialConcern={concern} />
      </div>
    </section>
  );
}
