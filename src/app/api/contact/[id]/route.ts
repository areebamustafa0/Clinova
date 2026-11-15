import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { ok, parseId, route } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  await requireUser(req, ["admin"]);
  await db.update(contactMessages).set({ isRead: true }).where(eq(contactMessages.id, parseId(params.id)));
  return ok({ read: true });
});

export const DELETE = route<{ id: string }>(async (req, { params }) => {
  await requireUser(req, ["admin"]);
  await db.delete(contactMessages).where(eq(contactMessages.id, parseId(params.id)));
  return ok({ deleted: true });
});
