import { ApiError, ok, qs, route } from "@/lib/api";
import { db } from "@/db";
import { getSlotsForDate } from "@/services/availability";

export const dynamic = "force-dynamic";

/** GET /api/availability/slots?doctorId=&treatmentId=&date=YYYY-MM-DD[&excludeAppointmentId=] */
export const GET = route(async (req) => {
  const p = qs(req);
  const doctorId = Number(p.get("doctorId"));
  const treatmentId = Number(p.get("treatmentId"));
  const date = p.get("date") ?? "";
  if (!doctorId || !treatmentId || !date) throw new ApiError(400, "doctorId, treatmentId and date are required");
  const exclude = Number(p.get("excludeAppointmentId")) || undefined;
  return ok(await getSlotsForDate(db, { doctorId, treatmentId, date, excludeAppointmentId: exclude }));
});
