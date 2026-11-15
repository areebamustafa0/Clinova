import { ok, parseBody, parseId, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { cancelAppointment } from "@/services/appointments";
import { cancelSchema } from "@/validators";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req);
  const input = await parseBody(req, cancelSchema).catch(() => ({ reason: null }));
  return ok(await cancelAppointment(user, parseId(params.id), input.reason));
});
