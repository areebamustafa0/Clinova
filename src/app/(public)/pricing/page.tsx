import type { Metadata } from "next";
import { PricingView } from "@/components/site/PricingView";
import { CtaPanel, PageIntro } from "@/components/site/ui";
import { pageMeta } from "@/lib/seo";
import { sortTreatments } from "@/lib/site-content";
import { listTreatments } from "@/services/treatments";
import type { Treatment } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta("Pricing & memberships", "Transparent treatment prices, memberships and an interactive estimator to plan your treatments.");

export default async function PricingPage() {
  const treatments = sortTreatments((await listTreatments({})) as unknown as Treatment[]);
  return (
    <>
      <PageIntro eyebrow="Pricing & memberships" title="Transparent prices, thoughtful plans" text="Every treatment is priced up front. Join a membership for a monthly treatment and savings on everything else — or simply pay as you go." />
      <PricingView treatments={treatments} />
      <CtaPanel title={"Not sure where\nto begin?"} text="Start with a consultation and a complimentary skin analysis. Your doctor will build a costed plan around your goals." slot="clinic-consultation" />
    </>
  );
}
