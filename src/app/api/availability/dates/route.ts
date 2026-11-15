import { ApiError, ok, qs, route } from "@/lib/api";
import { db } from "@/db";
import { getAvailableDates } from "@/services/availability";

export const dynamic = "force-dynamic";

/** GET /api/availability/dates?doctorId=&treatmentId=&month=YYYY-MM – days that still have free slots */
export const GET = route(async (req) => {
  const p = qs(req);
  const doctorId = Number(p.get("doctorId"));
  const treatmentId = Number(p.get("treatmentId"));
  const month = p.get("month") ?? "";
  if (!doctorId || !treatmentId || !month) throw new ApiError(400, "doctorId, treatmentId and month are required");
  return ok(await getAvailableDates(db, { doctorId, treatmentId, month }));
});
