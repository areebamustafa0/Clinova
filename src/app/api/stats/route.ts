import { ok, route } from "@/lib/api";
import { publicStats } from "@/services/reports";

export const dynamic = "force-dynamic";

/** Public, non-sensitive clinic numbers for the marketing site. */
export const GET = route(async () => ok(await publicStats()));
