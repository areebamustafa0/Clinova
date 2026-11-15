import { ok, parseBody, parseId, route } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";
import { deleteTreatment, getTreatment, updateTreatment } from "@/services/treatments";
import { updateTreatmentSchema } from "@/validators";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async (req, { params }) => {
  const user = await getSessionUser(req);
  const key = params.id;
  return ok(await getTreatment(/^\d+$/.test(key) ? Number(key) : key, user?.role === "admin"));
});

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  await requireUser(req, ["admin"]);
  const input = await parseBody(req, updateTreatmentSchema);
  return ok(await updateTreatment(parseId(params.id), input));
});

export const DELETE = route<{ id: string }>(async (req, { params }) => {
  await requireUser(req, ["admin"]);
  return ok(await deleteTreatment(parseId(params.id)));
});
