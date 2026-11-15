import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";
import { listDoctors } from "@/services/doctors";
import { listTreatments } from "@/services/treatments";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [treatments, doctors] = await Promise.all([listTreatments({}), listDoctors({})]);
  const now = new Date();
  const pages = ["", "/about", "/treatments", "/doctors", "/skin-quiz", "/pricing", "/results", "/contact"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  return [
    ...pages,
    ...treatments.filter((t) => t.slug).map((t) => ({ url: `${SITE_URL}/treatments/${t.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...doctors.map((d) => ({ url: `${SITE_URL}/doctors/${d.id}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
