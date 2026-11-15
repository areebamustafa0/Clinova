import { ok, qs, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listPatients } from "@/services/patients";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  await requireUser(req, ["admin"]);
  const items = await listPatients(qs(req).get("search")?.trim() || undefined);
  return ok(items, { meta: { total: items.length } });
});
