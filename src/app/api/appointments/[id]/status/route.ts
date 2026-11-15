import { ok, parseBody, parseId, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { changeStatus } from "@/services/appointments";
import { statusSchema } from "@/validators";

export const dynamic = "force-dynamic";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req, ["doctor", "admin"]);
  const input = await parseBody(req, statusSchema);
  return ok(await changeStatus(user, parseId(params.id), input.status, input.note));
});
