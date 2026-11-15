import { ok, parseBody, qs, route } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";
import { createTreatment, listCategories, listTreatments } from "@/services/treatments";
import { treatmentSchema } from "@/validators";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const p = qs(req);
  const user = await getSessionUser(req);
  const items = await listTreatments({
    includeInactive: user?.role === "admin" && p.get("all") === "1",
    category: p.get("category") || undefined,
    search: p.get("search") || undefined,
    featured: p.get("featured") === "1",
    doctorId: p.get("doctorId") ? Number(p.get("doctorId")) : undefined,
  });
  return ok(items, { meta: { total: items.length, categories: await listCategories() } });
});

export const POST = route(async (req) => {
  await requireUser(req, ["admin"]);
  const input = await parseBody(req, treatmentSchema);
  return ok(await createTreatment(input), { status: 201 });
});
