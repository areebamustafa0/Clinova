import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db";
import { appointments, doctorTreatments, doctors, specializations, treatments, users } from "@/db/schema";
import { ApiError } from "@/lib/api";
import type { treatmentSchema, updateTreatmentSchema } from "@/validators";
import { withTx } from "./availability";

type TreatmentRow = typeof treatments.$inferSelect;

async function hydrate(rows: TreatmentRow[], includeInactiveDoctors = false) {
  if (rows.length === 0) return [];
  const links = await db
    .select({
      treatmentId: doctorTreatments.treatmentId,
      id: doctors.id,
      firstName: users.firstName,
      lastName: users.lastName,
      photoUrl: doctors.photoUrl,
      specialization: specializations.name,
      isActive: doctors.isActive,
    })
    .from(doctorTreatments)
    .innerJoin(doctors, eq(doctors.id, doctorTreatments.doctorId))
    .innerJoin(users, eq(users.id, doctors.userId))
    .innerJoin(specializations, eq(specializations.id, doctors.specializationId))
    .where(inArray(doctorTreatments.treatmentId, rows.map((r) => r.id)));

  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    description: t.description,
    durationMinutes: t.durationMinutes,
    price: Number(t.price),
    imageUrl: t.imageUrl,
    slug: t.slug,
    tagline: t.tagline,
    durationLabel: t.durationLabel,
    sessions: t.sessions,
    downtime: t.downtime,
    isFeatured: t.isFeatured,
    isActive: t.isActive,
    doctors: links
      .filter((l) => l.treatmentId === t.id && (includeInactiveDoctors || l.isActive))
      .map((l) => ({ id: l.id, name: `Dr. ${l.firstName} ${l.lastName}`, photoUrl: l.photoUrl, specialization: l.specialization })),
  }));
}

export async function listTreatments(f: {
  category?: string;
  search?: string;
  doctorId?: number;
  featured?: boolean;
  includeInactive?: boolean;
}) {
  const conds = [];
  if (!f.includeInactive) conds.push(eq(treatments.isActive, true));
  if (f.category) conds.push(eq(treatments.category, f.category));
  if (f.featured) conds.push(eq(treatments.isFeatured, true));
  if (f.doctorId) {
    conds.push(inArray(treatments.id, db.select({ id: doctorTreatments.treatmentId }).from(doctorTreatments).where(eq(doctorTreatments.doctorId, f.doctorId))));
  }
  if (f.search) {
    const like = `%${f.search.replace(/[%_]/g, "")}%`;
    conds.push(or(ilike(treatments.name, like), ilike(treatments.description, like), ilike(treatments.category, like)));
  }
  const rows = await db
    .select()
    .from(treatments)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(treatments.isFeatured), asc(treatments.name));
  return hydrate(rows, f.includeInactive);
}

export async function listCategories() {
  const rows = await db
    .selectDistinct({ category: treatments.category })
    .from(treatments)
    .where(eq(treatments.isActive, true))
    .orderBy(asc(treatments.category));
  return rows.map((r) => r.category);
}

const slugify = (v: string) => v.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "treatment";

async function uniqueSlug(tx: typeof db, wanted: string, exceptId?: number) {
  const base = slugify(wanted);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const [hit] = await tx.select({ id: treatments.id }).from(treatments).where(eq(treatments.slug, candidate)).limit(1);
    if (!hit || hit.id === exceptId) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function getTreatment(idOrSlug: number | string, includeInactive = false) {
  const where = typeof idOrSlug === "number" ? eq(treatments.id, idOrSlug) : eq(treatments.slug, idOrSlug);
  const [row] = await db.select().from(treatments).where(where).limit(1);
  if (!row || (!row.isActive && !includeInactive)) throw new ApiError(404, "Treatment not found");
  const [t] = await hydrate([row], includeInactive);
  return t;
}

export async function createTreatment(input: z.infer<typeof treatmentSchema>) {
  const id = await withTx(async (tx) => {
    const [t] = await tx
      .insert(treatments)
      .values({
        name: input.name,
        category: input.category,
        description: input.description,
        durationMinutes: input.durationMinutes,
        price: String(input.price),
        imageUrl: input.imageUrl ?? null,
        slug: await uniqueSlug(tx, input.slug || input.name),
        tagline: input.tagline ?? null,
        durationLabel: input.durationLabel ?? null,
        sessions: input.sessions ?? null,
        downtime: input.downtime ?? null,
        isFeatured: input.isFeatured,
        isActive: input.isActive,
      })
      .returning({ id: treatments.id });
    if (input.doctorIds.length) {
      await tx.insert(doctorTreatments).values(input.doctorIds.map((doctorId) => ({ doctorId, treatmentId: t.id })));
    }
    return t.id;
  });
  return getTreatment(id, true);
}

export async function updateTreatment(id: number, input: z.infer<typeof updateTreatmentSchema>) {
  const [exists] = await db.select({ id: treatments.id }).from(treatments).where(eq(treatments.id, id));
  if (!exists) throw new ApiError(404, "Treatment not found");
  await withTx(async (tx) => {
    const patch: Partial<typeof treatments.$inferInsert> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.category !== undefined) patch.category = input.category;
    if (input.description !== undefined) patch.description = input.description;
    if (input.durationMinutes !== undefined) patch.durationMinutes = input.durationMinutes;
    if (input.price !== undefined) patch.price = String(input.price);
    if (input.imageUrl !== undefined) patch.imageUrl = input.imageUrl ?? null;
    if (input.slug) patch.slug = await uniqueSlug(tx, input.slug, id);
    if (input.tagline !== undefined) patch.tagline = input.tagline ?? null;
    if (input.durationLabel !== undefined) patch.durationLabel = input.durationLabel ?? null;
    if (input.sessions !== undefined) patch.sessions = input.sessions ?? null;
    if (input.downtime !== undefined) patch.downtime = input.downtime ?? null;
    if (input.isFeatured !== undefined) patch.isFeatured = input.isFeatured;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    if (Object.keys(patch).length) await tx.update(treatments).set(patch).where(eq(treatments.id, id));
    if (input.doctorIds) {
      await tx.delete(doctorTreatments).where(eq(doctorTreatments.treatmentId, id));
      if (input.doctorIds.length) {
        await tx.insert(doctorTreatments).values(input.doctorIds.map((doctorId) => ({ doctorId, treatmentId: id })));
      }
    }
  });
  return getTreatment(id, true);
}

/** Treatments that were booked before are deactivated (history preserved); unused ones are removed. */
export async function deleteTreatment(id: number) {
  const [exists] = await db.select({ id: treatments.id }).from(treatments).where(eq(treatments.id, id));
  if (!exists) throw new ApiError(404, "Treatment not found");
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(appointments).where(eq(appointments.treatmentId, id));
  if (count > 0) {
    await db.update(treatments).set({ isActive: false }).where(eq(treatments.id, id));
    return { deleted: false, deactivated: true };
  }
  await db.delete(treatments).where(eq(treatments.id, id));
  return { deleted: true, deactivated: false };
}
