import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db";
import { appointments, patients, users } from "@/db/schema";
import { ApiError } from "@/lib/api";
import type { SessionUser } from "@/lib/auth";
import type { adminPatientUpdateSchema } from "@/validators";
import { withTx } from "./availability";
import { listAppointments } from "./appointments";

function patientSelect() {
  return db
    .select({
      id: patients.id,
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
      createdAt: users.createdAt,
      dateOfBirth: patients.dateOfBirth,
      gender: patients.gender,
      address: patients.address,
      emergencyContact: patients.emergencyContact,
      appointmentCount: sql<number>`(select count(*)::int from appointments a where a.patient_id = ${patients.id})`,
      lastVisit: sql<string | null>`(select max(a.appointment_date)::text from appointments a where a.patient_id = ${patients.id} and a.status = 'completed')`,
    })
    .from(patients)
    .innerJoin(users, eq(users.id, patients.userId));
}

const map = (r: Awaited<ReturnType<typeof patientSelect>>[number]) => ({
  ...r,
  name: `${r.firstName} ${r.lastName}`,
  createdAt: r.createdAt.toISOString(),
});

export async function listPatients(search?: string) {
  const like = search ? `%${search.replace(/[%_]/g, "")}%` : null;
  const rows = await patientSelect()
    .where(
      like
        ? or(
            ilike(sql`${users.firstName} || ' ' || ${users.lastName}`, like),
            ilike(users.email, like),
            ilike(users.phone, like),
          )
        : undefined,
    )
    .orderBy(desc(users.createdAt))
    .limit(500);
  return rows.map(map);
}

export async function getPatient(user: SessionUser, id: number) {
  if (user.role === "doctor") {
    const [link] = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(and(eq(appointments.patientId, id), eq(appointments.doctorId, user.doctorId ?? -1)))
      .limit(1);
    if (!link) throw new ApiError(404, "Patient not found");
  }
  const [row] = await patientSelect().where(eq(patients.id, id)).limit(1);
  if (!row) throw new ApiError(404, "Patient not found");
  const history = await listAppointments(user, { patientId: id, order: "desc", limit: 100 });
  return { ...map(row), appointments: history };
}

export async function updatePatient(id: number, input: z.infer<typeof adminPatientUpdateSchema>) {
  const [row] = await db.select({ userId: patients.userId }).from(patients).where(eq(patients.id, id));
  if (!row) throw new ApiError(404, "Patient not found");
  await withTx(async (tx) => {
    const patch: Partial<typeof users.$inferInsert> = {};
    if (input.firstName !== undefined) patch.firstName = input.firstName;
    if (input.lastName !== undefined) patch.lastName = input.lastName;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.isActive !== undefined) {
      patch.isActive = input.isActive;
      if (!input.isActive) patch.tokenVersion = sql`${users.tokenVersion} + 1` as unknown as number;
    }
    if (Object.keys(patch).length) await tx.update(users).set(patch).where(eq(users.id, row.userId));
    if (input.address !== undefined) await tx.update(patients).set({ address: input.address ?? null }).where(eq(patients.id, id));
  });
  const [updated] = await patientSelect().where(eq(patients.id, id)).limit(1);
  return map(updated);
}
