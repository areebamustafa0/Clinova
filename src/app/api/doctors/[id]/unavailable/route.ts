import { ApiError, ok, parseBody, parseId, qs, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { addUnavailableDate, removeUnavailableDate } from "@/services/doctors";
import { unavailableDateSchema } from "@/validators";

export const dynamic = "force-dynamic";

export const POST = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req, ["doctor", "admin"]);
  const id = parseId(params.id);
  if (user.role === "doctor" && user.doctorId !== id) throw new ApiError(403, "You can only edit your own schedule");
  const input = await parseBody(req, unavailableDateSchema);
  return ok(await addUnavailableDate(id, input.date, input.reason), { status: 201 });
});

export const DELETE = route<{ id: string }>(async (req, { params }) => {
  const user = await requireUser(req, ["doctor", "admin"]);
  const id = parseId(params.id);
  if (user.role === "doctor" && user.doctorId !== id) throw new ApiError(403, "You can only edit your own schedule");
  return ok(await removeUnavailableDate(id, parseId(qs(req).get("id") ?? "", "unavailable date id")));
});
