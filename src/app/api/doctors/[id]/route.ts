import { ok, parseBody, parseId, route } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";
import { deleteDoctor, getDoctor, updateDoctor } from "@/services/doctors";
import { updateDoctorSchema } from "@/validators";

export const dynamic = "force-dynamic";

export const GET = route<{ id: string }>(async (req, { params }) => {
  const user = await getSessionUser(req);
  const isAdmin = user?.role === "admin";
  return ok(await getDoctor(parseId(params.id), { includeInactive: isAdmin, includePrivate: isAdmin }));
});

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  await requireUser(req, ["admin"]);
  const input = await parseBody(req, updateDoctorSchema);
  return ok(await updateDoctor(parseId(params.id), input));
});

export const DELETE = route<{ id: string }>(async (req, { params }) => {
  await requireUser(req, ["admin"]);
  return ok(await deleteDoctor(parseId(params.id)));
});
