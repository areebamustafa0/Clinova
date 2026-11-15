import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import type { Executor } from "./availability";

export async function notify(
  exec: Executor,
  userId: number,
  n: { title: string; message: string; type?: string; appointmentId?: number },
) {
  await exec.insert(notifications).values({
    userId,
    title: n.title,
    message: n.message,
    type: n.type ?? "info",
    appointmentId: n.appointmentId ?? null,
  });
}

export async function listNotifications(userId: number) {
  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(30);
  return { items, unread: items.filter((i) => !i.isRead).length };
}

export async function markAllRead(userId: number, id?: number) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), id ? eq(notifications.id, id) : undefined));
}
