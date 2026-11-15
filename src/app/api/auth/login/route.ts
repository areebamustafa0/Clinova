import { ApiError, ok, parseBody, route } from "@/lib/api";
import { loadSessionUser, setAuthCookie, signToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { authenticate, getProfile } from "@/services/auth";
import { loginSchema } from "@/validators";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const input = await parseBody(req, loginSchema);
  rateLimit(req, "login", 12, 15 * 60 * 1000, input.email);
  const user = await authenticate(input.email, input.password);
  const loaded = await loadSessionUser(user.id);
  if (!loaded) throw new ApiError(401, "Incorrect email or password");
  const token = signToken(user);
  const res = ok({ user: await getProfile(loaded.user), token });
  setAuthCookie(res, token);
  return res;
});
