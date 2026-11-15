import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { ok, parseBody, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { contactSchema } from "@/validators";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  rateLimit(req, "contact", 5, 60 * 60 * 1000);
  const input = await parseBody(req, contactSchema);
  await db.insert(contactMessages).values({ ...input, phone: input.phone ?? null });
  return ok({ received: true }, { status: 201 });
});

export const GET = route(async (req) => {
  await requireUser(req, ["admin"]);
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(200);
  return ok(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});
