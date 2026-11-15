import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { appointmentReports } from "@/services/reports";

export const dynamic = "force-dynamic";

/** Daily / weekly / monthly series, status breakdown, popular treatments and doctor statistics. */
export const GET = route(async (req) => {
  await requireUser(req, ["admin"]);
  return ok(await appointmentReports());
});
