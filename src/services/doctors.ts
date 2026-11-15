import { and, asc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db";
import {
  appointments,
  doctorSchedules,
  doctorTreatments,
  doctorUnavailableDates,
  doctors,
  specializations,
  treatments,
  users,
} from "@/db/schema";
import { ApiError } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { clinicToday, normTime } from "@/lib/time";
import type { createDoctorSchema, scheduleSchema, updateDoctorSchema } from "@/validators";
import { withTx, type Executor } from "./availability";

function baseQuery(exec: Executor) {
  return exec
    .select({
      id: doctors.id,
      userId: doctors.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      specializationId: specializations.id,
      specialization: specializations.name,
      qualifications: doctors.qualifications,
      experienceYears: doctors.experienceYears,
      bio: doctors.bio,
      consultationFee: doctors.consultationFee,
      photoUrl: doctors.photoUrl,
      slotDuration: doctors.slotDuration,
      rating: doctors.rating,
      reviewCount: doctors.reviewCount,
      isActive: doctors.isActive,
    })
    .from(doctors)
    .innerJoin(users, eq(users.id, doctors.userId))
    .innerJoin(specializations, eq(specializations.id, doctors.specializationId));
}

type DoctorRow = Awaited<ReturnType<typeof baseQuery>>[number];

async function hydrate(rows: DoctorRow[], opts: { includePrivate?: boolean; includeInactiveTreatments?: boolean }) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [schedules, links] = await Promise.all([
    db
      .select({ doctorId: doctorSchedules.doctorId, dayOfWeek: doctorSchedules.dayOfWeek })
      .from(doctorSchedules)
      .where(inArray(doctorSchedules.doctorId, ids)),
    db
      .select({
        doctorId: doctorTreatments.doctorId,
        id: treatments.id,
        name: treatments.name,
        slug: treatments.slug,
        category: treatments.category,
        price: treatments.price,
        durationMinutes: treatments.durationMinutes,
        isActive: treatments.isActive,
      })
      .from(doctorTreatments)
      .innerJoin(treatments, eq(treatments.id, doctorTreatments.treatmentId))
      .where(inArray(doctorTreatments.doctorId, ids)),
  ]);

  return rows.map((r) => {
    const days = [...new Set(schedules.filter((s) => s.doctorId === r.id).map((s) => s.dayOfWeek))].sort((a, b) => a - b);
    return {
      id: r.id,
      userId: opts.includePrivate ? r.userId : undefined,
      firstName: r.firstName,
      lastName: r.lastName,
      name: `Dr. ${r.firstName} ${r.lastName}`,
      email: opts.includePrivate ? r.email : undefined,
      phone: opts.includePrivate ? r.phone : undefined,
      specializationId: r.specializationId,
      specialization: r.specialization,
      qualifications: r.qualifications,
      experienceYears: r.experienceYears,
      bio: r.bio,
      consultationFee: Number(r.consultationFee),
      photoUrl: r.photoUrl,
      slotDuration: r.slotDuration,
      rating: Number(r.rating),
      reviewCount: r.reviewCount,
      isActive: r.isActive,
      workingDays: days,
      treatments: links
        .filter((l) => l.doctorId === r.id && (opts.includeInactiveTreatments || l.isActive))
        .map((l) => ({ id: l.id, slug: l.slug, name: l.name, category: l.category, price: Number(l.price), durationMinutes: l.durationMinutes })),
    };
  });
}

export async function listDoctors(f: {
  includeInactive?: boolean;
  search?: string;
  specializationId?: number;
  treatmentId?: number;
  includePrivate?: boolean;
}) {
  const conds = [];
  if (!f.includeInactive) conds.push(eq(doctors.isActive, true));
  if (f.specializationId) conds.push(eq(doctors.specializationId, f.specializationId));
  if (f.treatmentId) {
    conds.push(
      inArray(doctors.id, db.select({ id: doctorTreatments.doctorId }).from(doctorTreatments).where(eq(doctorTreatments.treatmentId, f.treatmentId))),
    );
  }
  if (f.search) {
    const like = `%${f.search.replace(/[%_]/g, "")}%`;
    conds.push(or(ilike(sql`${users.firstName} || ' ' || ${users.lastName}`, like), ilike(specializations.name, like)));
  }
  const rows = await baseQuery(db)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(users.firstName));
  return hydrate(rows, { includePrivate: f.includePrivate, includeInactiveTreatments: f.includeInactive });
}

export async function getDoctor(id: number, opts: { includeInactive?: boolean; includePrivate?: boolean } = {}) {
  const [row] = await baseQuery(db).where(eq(doctors.id, id)).limit(1);
  if (!row || (!row.isActive && !opts.includeInactive)) throw new ApiError(404, "Doctor not found");
  const [doctor] = await hydrate([row], { includePrivate: opts.includePrivate, includeInactiveTreatments: opts.includeInactive });
  return doctor;
}

export async function listSpecializations() {
  return db.select().from(specializations).orderBy(asc(specializations.name));
}

async function resolveSpecialization(tx: Executor, input: { specializationId?: number; specializationName?: string }) {
  if (input.specializationId) {
    const [s] = await tx.select({ id: specializations.id }).from(specializations).where(eq(specializations.id, input.specializationId));
    if (!s) throw new ApiError(422, "Specialization not found");
    return s.id;
  }
  if (input.specializationName) {
    const [existing] = await tx.select({ id: specializations.id }).from(specializations).where(ilike(specializations.name, input.specializationName));
    if (existing) return existing.id;
    const [created] = await tx.insert(specializations).values({ name: input.specializationName }).returning({ id: specializations.id });
    return created.id;
  }
  return undefined;
}

async function assertEmailFree(tx: Executor, email: string, exceptUserId?: number) {
  const [taken] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (taken && taken.id !== exceptUserId) throw new ApiError(409, "An account with this email already exists");
}

export async function createDoctor(input: z.infer<typeof createDoctorSchema>) {
  const passwordHash = await hashPassword(input.password);
  const id = await withTx(async (tx) => {
    await assertEmailFree(tx, input.email);
    const specializationId = await resolveSpecialization(tx, input);
    if (!specializationId) throw new ApiError(422, "Choose a specialization");
    const [user] = await tx
      .insert(users)
      .values({
        email: input.email,
        passwordHash,
        role: "doctor",
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        isActive: input.isActive,
      })
      .returning({ id: users.id });
    const [doctor] = await tx
      .insert(doctors)
      .values({
        userId: user.id,
        specializationId,
        qualifications: input.qualifications,
        experienceYears: input.experienceYears,
        bio: input.bio,
        consultationFee: String(input.consultationFee),
        photoUrl: input.photoUrl ?? null,
        slotDuration: input.slotDuration,
        isActive: input.isActive,
      })
      .returning({ id: doctors.id });
    if (input.treatmentIds.length) {
      await tx.insert(doctorTreatments).values(input.treatmentIds.map((treatmentId) => ({ doctorId: doctor.id, treatmentId })));
    }
    // Sensible default: Monday – Friday, 09:00 – 17:00 (editable from the availability screen)
    await tx
      .insert(doctorSchedules)
      .values([1, 2, 3, 4, 5].map((dayOfWeek) => ({ doctorId: doctor.id, dayOfWeek, startTime: "09:00", endTime: "17:00" })));
    return doctor.id;
  });
  return getDoctor(id, { includeInactive: true, includePrivate: true });
}

export async function updateDoctor(id: number, input: z.infer<typeof updateDoctorSchema>) {
  const [current] = await db.select({ userId: doctors.userId }).from(doctors).where(eq(doctors.id, id));
  if (!current) throw new ApiError(404, "Doctor not found");
  const passwordHash = input.password ? await hashPassword(input.password) : undefined;

  await withTx(async (tx) => {
    if (input.email) await assertEmailFree(tx, input.email, current.userId);
    const specializationId = await resolveSpecialization(tx, input);

    const userPatch: Partial<typeof users.$inferInsert> = {};
    if (input.firstName !== undefined) userPatch.firstName = input.firstName;
    if (input.lastName !== undefined) userPatch.lastName = input.lastName;
    if (input.email !== undefined) userPatch.email = input.email;
    if (input.phone !== undefined) userPatch.phone = input.phone ?? null;
    if (input.isActive !== undefined) userPatch.isActive = input.isActive;
    if (passwordHash) {
      userPatch.passwordHash = passwordHash;
      userPatch.tokenVersion = sql`${users.tokenVersion} + 1` as unknown as number;
    }
    if (Object.keys(userPatch).length) await tx.update(users).set(userPatch).where(eq(users.id, current.userId));

    const docPatch: Partial<typeof doctors.$inferInsert> = {};
    if (specializationId) docPatch.specializationId = specializationId;
    if (input.qualifications !== undefined) docPatch.qualifications = input.qualifications;
    if (input.experienceYears !== undefined) docPatch.experienceYears = input.experienceYears;
    if (input.bio !== undefined) docPatch.bio = input.bio;
    if (input.consultationFee !== undefined) docPatch.consultationFee = String(input.consultationFee);
    if (input.photoUrl !== undefined) docPatch.photoUrl = input.photoUrl ?? null;
    if (input.slotDuration !== undefined) docPatch.slotDuration = input.slotDuration;
    if (input.isActive !== undefined) docPatch.isActive = input.isActive;
    if (Object.keys(docPatch).length) await tx.update(doctors).set(docPatch).where(eq(doctors.id, id));

    if (input.treatmentIds) {
      await tx.delete(doctorTreatments).where(eq(doctorTreatments.doctorId, id));
      if (input.treatmentIds.length) {
        await tx.insert(doctorTreatments).values(input.treatmentIds.map((treatmentId) => ({ doctorId: id, treatmentId })));
      }
    }
  });
  return getDoctor(id, { includeInactive: true, includePrivate: true });
}

/** Hard-deletes doctors without history, otherwise deactivates to keep appointment records intact. */
export async function deleteDoctor(id: number) {
  const [current] = await db.select({ userId: doctors.userId }).from(doctors).where(eq(doctors.id, id));
  if (!current) throw new ApiError(404, "Doctor not found");
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(appointments).where(eq(appointments.doctorId, id));
  if (count > 0) {
    await withTx(async (tx) => {
      await tx.update(doctors).set({ isActive: false }).where(eq(doctors.id, id));
      await tx.update(users).set({ isActive: false, tokenVersion: sql`${users.tokenVersion} + 1` }).where(eq(users.id, current.userId));
    });
    return { deleted: false, deactivated: true };
  }
  await db.delete(users).where(eq(users.id, current.userId)); // cascades to the doctor row
  return { deleted: true, deactivated: false };
}

/* ------------------------------ availability ----------------------------- */

export async function getSchedule(doctorId: number) {
  const [doctor] = await db.select({ slotDuration: doctors.slotDuration }).from(doctors).where(eq(doctors.id, doctorId));
  if (!doctor) throw new ApiError(404, "Doctor not found");
  const [blocks, unavailable] = await Promise.all([
    db.select().from(doctorSchedules).where(eq(doctorSchedules.doctorId, doctorId)).orderBy(asc(doctorSchedules.dayOfWeek), asc(doctorSchedules.startTime)),
    db
      .select({ id: doctorUnavailableDates.id, date: doctorUnavailableDates.date, reason: doctorUnavailableDates.reason })
      .from(doctorUnavailableDates)
      .where(and(eq(doctorUnavailableDates.doctorId, doctorId), gte(doctorUnavailableDates.date, clinicToday())))
      .orderBy(asc(doctorUnavailableDates.date)),
  ]);
  const days = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    blocks: blocks
      .filter((b) => b.dayOfWeek === dayOfWeek)
      .map((b) => ({ startTime: normTime(b.startTime), endTime: normTime(b.endTime) })),
  }));
  return { doctorId, slotDuration: doctor.slotDuration, days, unavailableDates: unavailable };
}

export async function saveSchedule(doctorId: number, input: z.infer<typeof scheduleSchema>) {
  await withTx(async (tx) => {
    await tx.delete(doctorSchedules).where(eq(doctorSchedules.doctorId, doctorId));
    const values = input.days.flatMap((d) => d.blocks.map((b) => ({ doctorId, dayOfWeek: d.dayOfWeek, startTime: b.startTime, endTime: b.endTime })));
    if (values.length) await tx.insert(doctorSchedules).values(values);
    if (input.slotDuration) await tx.update(doctors).set({ slotDuration: input.slotDuration }).where(eq(doctors.id, doctorId));
  });
  return getSchedule(doctorId);
}

export async function addUnavailableDate(doctorId: number, date: string, reason: string | null) {
  if (date < clinicToday()) throw new ApiError(422, "Choose a date in the future");
  await db
    .insert(doctorUnavailableDates)
    .values({ doctorId, date, reason })
    .onConflictDoUpdate({ target: [doctorUnavailableDates.doctorId, doctorUnavailableDates.date], set: { reason } });
  return getSchedule(doctorId);
}

export async function removeUnavailableDate(doctorId: number, id: number) {
  await db.delete(doctorUnavailableDates).where(and(eq(doctorUnavailableDates.id, id), eq(doctorUnavailableDates.doctorId, doctorId)));
  return getSchedule(doctorId);
}
