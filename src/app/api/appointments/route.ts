import { ok, parseBody, qs, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createAppointment, listAppointments } from "@/services/appointments";
import { createAppointmentSchema } from "@/validators";

export const dynamic = "force-dynamic";

/**
 * GET /api/appointments – role-scoped list.
 * patients → their own, doctors → their own, admins → everything (with optional filters).
 * Query: status (comma separated), doctorId, patientId, from, to, search, limit, order=asc|desc
 */
export const GET = route(async (req) => {
  const user = await requireUser(req);
  const p = qs(req);
  const num = (k: string) => (p.get(k) ? Number(p.get(k)) : undefined);
  const date = (k: string) => {
    const v = p.get(k);
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
  };
  const items = await listAppointments(user, {
    status: p.get("status")?.split(",").filter(Boolean),
    doctorId: num("doctorId"),
    patientId: num("patientId"),
    from: date("from"),
    to: date("to"),
    search: p.get("search")?.trim() || undefined,
    limit: num("limit"),
    order: p.get("order") === "desc" ? "desc" : "asc",
  });
  return ok(items, { meta: { total: items.length } });
});

export const POST = route(async (req) => {
  const user = await requireUser(req, ["patient"]);
  rateLimit(req, "booking", 30, 10 * 60 * 1000, String(user.id));
  const input = await parseBody(req, createAppointmentSchema);
  return ok(await createAppointment(user, input), { status: 201 });
});
