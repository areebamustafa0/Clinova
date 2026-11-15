import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { overviewStats } from "@/services/reports";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  await requireUser(req, ["admin"]);
  return ok(await overviewStats());
});
