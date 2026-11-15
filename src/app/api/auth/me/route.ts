import { ok, parseBody, route } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";
import { getProfile, updateProfile } from "@/services/auth";
import { profileSchema } from "@/validators";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const user = await getSessionUser(req);
  if (!user) return ok({ user: null });
  return ok({ user: await getProfile(user) });
});

export const PATCH = route(async (req) => {
  const user = await requireUser(req);
  const input = await parseBody(req, profileSchema);
  return ok({ user: await updateProfile(user, input) });
});
