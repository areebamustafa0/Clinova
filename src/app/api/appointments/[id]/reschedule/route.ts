import { ok, parseBody, parseId, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { rescheduleAppointment } from "@/services/appointments";
import { rescheduleSchema } from "@/validators";

export const dynamic = "force-dynamic";

/** Patients: submit a reschedule request (needs doctor re-confirmation). Doctors/admins: move directly. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  rateLimit(req, "reschedule", 30, 10 * 60 * 1000, String(user.id));
  const input = await parseBody(req, rescheduleSchema);
  return ok(await rescheduleAppointment(user, parseId(params.id), input));
});
