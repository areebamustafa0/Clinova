import { ok, parseBody, parseId, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getPatient, updatePatient } from "@/services/patients";
import { adminPatientUpdateSchema } from "@/validators";

export const dynamic = "force-dynamic";

// Admins see every patient; doctors only patients they have appointments with.
export const GET = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req, ["admin", "doctor"]);
  return ok(await getPatient(user, parseId(params.id)));
});

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  await requireUser(req, ["admin"]);
  const input = await parseBody(req, adminPatientUpdateSchema);
  return ok(await updatePatient(parseId(params.id), input));
});
