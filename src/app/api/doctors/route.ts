import { ok, parseBody, qs, route } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";
import { createDoctor, listDoctors } from "@/services/doctors";
import { createDoctorSchema } from "@/validators";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const p = qs(req);
  const user = await getSessionUser(req);
  const isAdmin = user?.role === "admin";
  const items = await listDoctors({
    includeInactive: isAdmin && p.get("all") === "1",
    includePrivate: isAdmin,
    search: p.get("search") || undefined,
    specializationId: p.get("specializationId") ? Number(p.get("specializationId")) : undefined,
    treatmentId: p.get("treatmentId") ? Number(p.get("treatmentId")) : undefined,
  });
  return ok(items, { meta: { total: items.length } });
});

export const POST = route(async (req) => {
  await requireUser(req, ["admin"]);
  const input = await parseBody(req, createDoctorSchema);
  return ok(await createDoctor(input), { status: 201 });
});
