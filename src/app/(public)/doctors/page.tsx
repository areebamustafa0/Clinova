import type { Metadata } from "next";
import { CtaPanel, PageIntro } from "@/components/site/ui";
import { DoctorsGrid } from "@/components/site/DoctorsGrid";
import { pageMeta } from "@/lib/seo";
import { listDoctors } from "@/services/doctors";
import type { Doctor } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = pageMeta("Our doctors", "Meet the doctors behind Clinova: consultant dermatology, aesthetic medicine, laser and advanced skin therapy.");

export default async function DoctorsPage() {
  const doctors = (await listDoctors({})) as unknown as Doctor[];
  return (
    <>
      <PageIntro eyebrow="Our doctors" title="Specialists you can trust" text="Medical professionals chosen as much for their bedside manner as for their credentials. Every consultation is unhurried." />
      <DoctorsGrid doctors={doctors} />
      <CtaPanel />
    </>
  );
}
