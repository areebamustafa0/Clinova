import { ok, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listNotifications, markAllRead } from "@/services/notifications";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const user = await requireUser(req);
  return ok(await listNotifications(user.id));
});

/** POST marks every notification of the signed-in user as read. */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  await markAllRead(user.id);
  return ok({ read: true });
});
