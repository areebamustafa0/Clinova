import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { appointmentSummary } from "@/services/appointments";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => ok(await appointmentSummary(await requireUser(req))));
