import { ok, route } from "@/lib/api";
import { listSpecializations } from "@/services/doctors";

export const dynamic = "force-dynamic";

export const GET = route(async () => ok(await listSpecializations()));
