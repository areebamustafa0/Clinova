import { ok, route } from "@/lib/api";
import { clearAuthCookie, getSessionUser } from "@/lib/auth";
import { revokeTokens } from "@/services/auth";

export const dynamic = "force-dynamic";

/** Clears the cookie and bumps the user's token version so previously issued JWTs stop working. */
export const POST = route(async (req) => {
  const user = await getSessionUser(req);
  if (user) await revokeTokens(user.id);
  const res = ok({ loggedOut: true });
  clearAuthCookie(res);
  return res;
});
