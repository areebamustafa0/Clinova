import { ApiError, ok, parseBody, parseId, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getSchedule, saveSchedule } from "@/services/doctors";
import { scheduleSchema } from "@/validators";

export const dynamic = "force-dynamic";

// Public: patients need the working days/hours to understand availability.
export const GET = route<{ id: string }>(async (_req, { params }) => ok(await getSchedule(parseId(params.id))));

export const PUT = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req, ["doctor", "admin"]);
  const id = parseId(params.id);
  if (user.role === "doctor" && user.doctorId !== id) throw new ApiError(403, "You can only edit your own schedule");
  const input = await parseBody(req, scheduleSchema);
  return ok(await saveSchedule(id, input));
});
