import { ok, parseId, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getAppointment } from "@/services/appointments";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  return ok(await getAppointment(user, parseId(params.id)));
});
