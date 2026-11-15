import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { appointmentReports } from "@/services/reports";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  await requireUser(req, ["admin"]);
  const { popularTreatments } = await appointmentReports();
  return ok(popularTreatments);
});
