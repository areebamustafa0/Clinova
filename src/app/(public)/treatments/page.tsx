import type { Metadata } from "next";
import { CtaPanel, PageIntro } from "@/components/site/ui";
import { TreatmentsGrid } from "@/components/site/TreatmentsGrid";
import { pageMeta } from "@/lib/seo";
import { sortTreatments } from "@/lib/site-content";
import { listTreatments } from "@/services/treatments";
import type { Treatment } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta("Treatments", "From medical skincare to advanced aesthetics: facials, rejuvenation, acne care, pigmentation, laser, anti-aging, injectables and skin boosters.");

export default async function TreatmentsPage() {
  const list = sortTreatments((await listTreatments({})) as unknown as Treatment[]);
  return (
    <>
      <PageIntro eyebrow="Treatments" title="Treatments tailored to your skin" text="From medical skincare to advanced aesthetics, every treatment begins with understanding your skin." />
      <TreatmentsGrid treatments={list} />
      <CtaPanel />
    </>
  );
}
