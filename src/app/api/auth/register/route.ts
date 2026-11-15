import { ApiError, ok, parseBody, route } from "@/lib/api";
import { loadSessionUser, setAuthCookie, signToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getProfile, registerPatient } from "@/services/auth";
import { registerSchema } from "@/validators";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  rateLimit(req, "register", 10, 60 * 60 * 1000);
  const input = await parseBody(req, registerSchema);
  const created = await registerPatient(input);
  const loaded = await loadSessionUser(created.id);
  if (!loaded) throw new ApiError(500, "Account was created but could not be loaded");
  const token = signToken(created);
  const res = ok({ user: await getProfile(loaded.user), token }, { status: 201 });
  setAuthCookie(res, token);
  return res;
});
