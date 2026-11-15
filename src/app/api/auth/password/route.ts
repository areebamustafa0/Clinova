import { ok, parseBody, route } from "@/lib/api";
import { requireUser, setAuthCookie, signToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { changePassword } from "@/services/auth";
import { changePasswordSchema } from "@/validators";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const user = await requireUser(req);
  rateLimit(req, "password", 8, 15 * 60 * 1000, String(user.id));
  const input = await parseBody(req, changePasswordSchema);
  const updated = await changePassword(user, input);
  const res = ok({ changed: true });
  setAuthCookie(res, signToken(updated)); // keep this device signed in
  return res;
});
