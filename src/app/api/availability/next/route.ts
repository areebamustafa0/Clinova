import { db } from "@/db";
import { ApiError, ok, qs, route } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { nextAvailable } from "@/services/availability";

export const dynamic = "force-dynamic";

/**
 * GET /api/availability/next?treatmentId=&limit=[&doctorId=]
 * The earliest free slots for a treatment – one offer per doctor, soonest first. Powers the
 * "Next available appointments" widget on the public site.
 */
export const GET = route(async (req) => {
  rateLimit(req, "next-slots", 90, 60_000);
  const p = qs(req);
  const treatmentId = Number(p.get("treatmentId"));
  if (!Number.isInteger(treatmentId) || treatmentId <= 0) throw new ApiError(400, "treatmentId is required");
  const doctorId = Number(p.get("doctorId")) || undefined;
  const limit = Math.min(6, Math.max(1, Number(p.get("limit")) || 3));
  return ok(await nextAvailable(db, { treatmentId, doctorId, limit }));
});
