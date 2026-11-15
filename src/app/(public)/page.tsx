import { HomeView } from "@/components/site/HomeView";
import { sortTreatments } from "@/lib/site-content";
import { listDoctors } from "@/services/doctors";
import { listTreatments } from "@/services/treatments";
import type { Doctor, Treatment } from "@/types";

// Rendered on the server from the database, so the hero arc, treatment list and doctor card are in the first HTML.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [treatments, doctors] = await Promise.all([listTreatments({}), listDoctors({})]);
  const list = sortTreatments(treatments as unknown as Treatment[]);
  const all = doctors as unknown as Doctor[];
  const doctor = all.find((d) => d.specialization.startsWith("Medical Director")) ?? all[0];
  return <HomeView treatments={list} doctor={doctor} />;
}
