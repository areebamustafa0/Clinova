import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { z } from "zod";
import { db } from "@/db";
import {
  appointmentStatusHistory,
  appointments,
  doctors,
  patients,
  specializations,
  treatments,
  users,
} from "@/db/schema";
import { ApiError } from "@/lib/api";
import type { SessionUser } from "@/lib/auth";
import { clinicNow, normTime, toMinutes } from "@/lib/time";
import { formatDate, formatTime } from "@/utils/format";
import type { createAppointmentSchema } from "@/validators";
import { assertBookable, lockForBooking, type Executor } from "./availability";
import { notify } from "./notifications";

export const CANCEL_WINDOW_MINUTES = 120;
export const MAX_RESCHEDULES = 2;

const STATUSES = ["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"] as const;
export type AppointmentStatus = (typeof STATUSES)[number];

const doctorUser = alias(users, "doctor_user");
const patientUser = alias(users, "patient_user");

function selectAppointments(exec: Executor) {
  return exec
    .select({
      id: appointments.id,
      reference: appointments.reference,
      status: appointments.status,
      date: appointments.appointmentDate,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      patientName: appointments.patientName,
      patientPhone: appointments.patientPhone,
      patientEmail: appointments.patientEmail,
      reason: appointments.reason,
      notes: appointments.notes,
      price: appointments.price,
      rescheduleCount: appointments.rescheduleCount,
      cancelledBy: appointments.cancelledBy,
      cancellationReason: appointments.cancellationReason,
      createdAt: appointments.createdAt,
      doctorId: doctors.id,
      doctorUserId: doctors.userId,
      doctorFirst: doctorUser.firstName,
      doctorLast: doctorUser.lastName,
      doctorPhoto: doctors.photoUrl,
      specialization: specializations.name,
      treatmentId: treatments.id,
      treatmentName: treatments.name,
      treatmentCategory: treatments.category,
      treatmentDuration: treatments.durationMinutes,
      patientRecordId: patients.id,
      patientUserId: patientUser.id,
      patientFirst: patientUser.firstName,
      patientLast: patientUser.lastName,
      patientAccountEmail: patientUser.email,
    })
    .from(appointments)
    .innerJoin(doctors, eq(doctors.id, appointments.doctorId))
    .innerJoin(doctorUser, eq(doctorUser.id, doctors.userId))
    .innerJoin(specializations, eq(specializations.id, doctors.specializationId))
    .innerJoin(treatments, eq(treatments.id, appointments.treatmentId))
    .innerJoin(patients, eq(patients.id, appointments.patientId))
    .innerJoin(patientUser, eq(patientUser.id, patients.userId));
}

type Row = Awaited<ReturnType<typeof selectAppointments>>[number];

export function mapAppointment(r: Row) {
  return {
    id: r.id,
    reference: r.reference,
    status: r.status as AppointmentStatus,
    date: r.date,
    startTime: normTime(r.startTime),
    endTime: normTime(r.endTime),
    patientName: r.patientName,
    patientPhone: r.patientPhone,
    patientEmail: r.patientEmail,
    reason: r.reason,
    notes: r.notes,
    price: Number(r.price),
    rescheduleCount: r.rescheduleCount,
    cancelledBy: r.cancelledBy,
    cancellationReason: r.cancellationReason,
    createdAt: r.createdAt.toISOString(),
    doctor: {
      id: r.doctorId,
      userId: r.doctorUserId,
      name: `Dr. ${r.doctorFirst} ${r.doctorLast}`,
      specialization: r.specialization,
      photoUrl: r.doctorPhoto,
    },
    treatment: { id: r.treatmentId, name: r.treatmentName, category: r.treatmentCategory, durationMinutes: r.treatmentDuration },
    patient: { id: r.patientRecordId, userId: r.patientUserId, name: `${r.patientFirst} ${r.patientLast}`, email: r.patientAccountEmail },
  };
}

export type AppointmentDTO = ReturnType<typeof mapAppointment>;

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeReference() {
  let out = "";
  for (let i = 0; i < 6; i++) out += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  return `CLN-${out}`;
}

function minutesUntil(date: string, startTime: string): number {
  const now = clinicNow();
  const dayDiff = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${now.date}T00:00:00Z`)) / 60000;
  return dayDiff + toMinutes(startTime) - now.minutes;
}

function describe(a: Pick<AppointmentDTO, "treatment" | "date" | "startTime">) {
  return `${a.treatment.name} on ${formatDate(a.date)} at ${formatTime(a.startTime)}`;
}

function assertAccess(user: SessionUser, a: AppointmentDTO) {
  const allowed =
    user.role === "admin" ||
    (user.role === "patient" && user.patientId === a.patient.id) ||
    (user.role === "doctor" && user.doctorId === a.doctor.id);
  if (!allowed) throw new ApiError(404, "Appointment not found");
}

async function lockAndLoad(tx: Executor, id: number): Promise<AppointmentDTO> {
  await tx.select({ id: appointments.id }).from(appointments).where(eq(appointments.id, id)).for("update");
  const [row] = await selectAppointments(tx).where(eq(appointments.id, id)).limit(1);
  if (!row) throw new ApiError(404, "Appointment not found");
  return mapAppointment(row);
}

async function withTx<T>(fn: (tx: Executor) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => fn(tx as unknown as Executor));
}

async function logStatus(
  tx: Executor,
  appointmentId: number,
  from: AppointmentStatus | null,
  to: AppointmentStatus,
  userId: number,
  note?: string | null,
) {
  await tx.insert(appointmentStatusHistory).values({ appointmentId, fromStatus: from, toStatus: to, changedBy: userId, note: note ?? null });
}

/* ------------------------------- queries --------------------------------- */

export type ListFilters = {
  status?: string[];
  doctorId?: number;
  patientId?: number;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  order?: "asc" | "desc";
};

export async function listAppointments(user: SessionUser, f: ListFilters = {}) {
  const conds = [];
  if (user.role === "patient") conds.push(eq(appointments.patientId, user.patientId ?? -1));
  if (user.role === "doctor") conds.push(eq(appointments.doctorId, user.doctorId ?? -1));
  if (user.role === "admin" && f.doctorId) conds.push(eq(appointments.doctorId, f.doctorId));
  if (user.role !== "patient" && f.patientId) conds.push(eq(appointments.patientId, f.patientId));
  const statuses = (f.status ?? []).filter((s): s is AppointmentStatus => (STATUSES as readonly string[]).includes(s));
  if (statuses.length) conds.push(inArray(appointments.status, statuses));
  if (f.from) conds.push(gte(appointments.appointmentDate, f.from));
  if (f.to) conds.push(lte(appointments.appointmentDate, f.to));
  if (f.search) {
    const like = `%${f.search.replace(/[%_]/g, "")}%`;
    conds.push(
      or(
        ilike(appointments.reference, like),
        ilike(appointments.patientName, like),
        ilike(treatments.name, like),
        ilike(sql`${doctorUser.firstName} || ' ' || ${doctorUser.lastName}`, like),
      ),
    );
  }
  const dir = f.order === "desc" ? desc : asc;
  const rows = await selectAppointments(db)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(dir(appointments.appointmentDate), dir(appointments.startTime))
    .limit(Math.min(f.limit ?? 300, 1000));
  return rows.map(mapAppointment);
}

export async function getAppointment(user: SessionUser, id: number) {
  const [row] = await selectAppointments(db).where(eq(appointments.id, id)).limit(1);
  if (!row) throw new ApiError(404, "Appointment not found");
  const dto = mapAppointment(row);
  assertAccess(user, dto);
  const history = await db
    .select({
      id: appointmentStatusHistory.id,
      fromStatus: appointmentStatusHistory.fromStatus,
      toStatus: appointmentStatusHistory.toStatus,
      note: appointmentStatusHistory.note,
      createdAt: appointmentStatusHistory.createdAt,
    })
    .from(appointmentStatusHistory)
    .where(eq(appointmentStatusHistory.appointmentId, id))
    .orderBy(asc(appointmentStatusHistory.createdAt), asc(appointmentStatusHistory.id));
  return { ...dto, history: history.map((h) => ({ ...h, createdAt: h.createdAt.toISOString() })) };
}

export async function appointmentSummary(user: SessionUser) {
  const today = clinicNow().date;
  const scope =
    user.role === "patient"
      ? eq(appointments.patientId, user.patientId ?? -1)
      : user.role === "doctor"
        ? eq(appointments.doctorId, user.doctorId ?? -1)
        : undefined;
  const c = (cond: ReturnType<typeof sql>) => sql<number>`count(*) filter (where ${cond})::int`;
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: c(sql`${appointments.status} = 'pending'`),
      confirmed: c(sql`${appointments.status} = 'confirmed'`),
      upcoming: c(sql`${appointments.status} in ('pending','confirmed') and ${appointments.appointmentDate} >= ${today}`),
      today: c(sql`${appointments.status} in ('pending','confirmed','completed') and ${appointments.appointmentDate} = ${today}`),
      completed: c(sql`${appointments.status} = 'completed'`),
      cancelled: c(sql`${appointments.status} in ('cancelled','rejected')`),
    })
    .from(appointments)
    .where(scope);
  return row;
}

/* ------------------------------- commands -------------------------------- */

export async function createAppointment(user: SessionUser, input: z.infer<typeof createAppointmentSchema>) {
  if (user.role !== "patient" || !user.patientId) throw new ApiError(403, "Only patient accounts can book appointments");
  const patientId = user.patientId;

  const id = await withTx(async (tx) => {
    await lockForBooking(tx, input.doctorId, input.date, patientId);
    const slot = await assertBookable(tx, {
      doctorId: input.doctorId,
      treatmentId: input.treatmentId,
      date: input.date,
      startTime: input.startTime,
      patientId,
    });
    const [treatment] = await tx.select({ price: treatments.price, name: treatments.name }).from(treatments).where(eq(treatments.id, input.treatmentId));
    const [doctor] = await tx.select({ userId: doctors.userId }).from(doctors).where(eq(doctors.id, input.doctorId));

    const [created] = await tx
      .insert(appointments)
      .values({
        reference: makeReference(),
        patientId,
        doctorId: input.doctorId,
        treatmentId: input.treatmentId,
        appointmentDate: input.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: "pending",
        patientName: input.patientName,
        patientPhone: input.patientPhone,
        patientEmail: input.patientEmail ?? user.email,
        reason: input.reason ?? null,
        notes: input.notes ?? null,
        price: treatment.price,
      })
      .returning({ id: appointments.id });

    await logStatus(tx, created.id, null, "pending", user.id, "Appointment requested by patient");
    const when = `${treatment.name} on ${formatDate(input.date)} at ${formatTime(slot.startTime)}`;
    await notify(tx, doctor.userId, {
      title: "New appointment request",
      message: `${input.patientName} requested ${when}.`,
      type: "appointment",
      appointmentId: created.id,
    });
    await notify(tx, user.id, {
      title: "Request received",
      message: `Your request for ${when} is awaiting confirmation from the doctor.`,
      type: "appointment",
      appointmentId: created.id,
    });
    return created.id;
  });

  return getAppointment(user, id);
}

export async function cancelAppointment(user: SessionUser, id: number, reason?: string | null) {
  await withTx(async (tx) => {
    const appt = await lockAndLoad(tx, id);
    assertAccess(user, appt);
    if (appt.status !== "pending" && appt.status !== "confirmed") {
      throw new ApiError(409, `A ${appt.status.replace("_", " ")} appointment cannot be cancelled`);
    }
    if (user.role === "patient" && minutesUntil(appt.date, appt.startTime) < CANCEL_WINDOW_MINUTES) {
      throw new ApiError(
        422,
        `Online cancellation closes ${CANCEL_WINDOW_MINUTES / 60} hours before the appointment. Please call the clinic to make changes.`,
      );
    }
    await tx
      .update(appointments)
      .set({ status: "cancelled", cancelledBy: user.role, cancellationReason: reason ?? null })
      .where(eq(appointments.id, id));
    await logStatus(tx, id, appt.status, "cancelled", user.id, reason ?? `Cancelled by ${user.role}`);

    const msg = `${describe(appt)} was cancelled${reason ? `: ${reason}` : "."}`;
    if (user.role !== "patient") await notify(tx, appt.patient.userId, { title: "Appointment cancelled", message: msg, type: "appointment", appointmentId: id });
    if (user.role !== "doctor") await notify(tx, appt.doctor.userId, { title: "Appointment cancelled", message: `${appt.patientName}: ${msg}`, type: "appointment", appointmentId: id });
  });
  return getAppointment(user, id);
}

export async function rescheduleAppointment(
  user: SessionUser,
  id: number,
  input: { date: string; startTime: string; reason?: string | null },
) {
  await withTx(async (tx) => {
    const current = await lockAndLoad(tx, id);
    assertAccess(user, current);
    if (current.status !== "pending" && current.status !== "confirmed") {
      throw new ApiError(409, `A ${current.status.replace("_", " ")} appointment cannot be rescheduled`);
    }
    if (user.role === "patient") {
      if (minutesUntil(current.date, current.startTime) < CANCEL_WINDOW_MINUTES) {
        throw new ApiError(422, "Reschedule requests close 2 hours before the appointment. Please call the clinic.");
      }
      if (current.rescheduleCount >= MAX_RESCHEDULES) {
        throw new ApiError(422, `An appointment can be rescheduled online up to ${MAX_RESCHEDULES} times. Please contact the clinic.`);
      }
    }
    if (current.date === input.date && current.startTime === input.startTime) {
      throw new ApiError(422, "Please choose a different date or time");
    }

    // Validate the NEW slot first (ignoring this appointment's own current slot). The old slot is
    // only released by the UPDATE below, after validation succeeded, inside the same transaction.
    await lockForBooking(tx, current.doctor.id, input.date, current.patient.id);
    const slot = await assertBookable(tx, {
      doctorId: current.doctor.id,
      treatmentId: current.treatment.id,
      date: input.date,
      startTime: input.startTime,
      patientId: current.patient.id,
      excludeAppointmentId: id,
    });

    // Patient-initiated changes need to be re-approved by the doctor.
    const nextStatus: AppointmentStatus = user.role === "patient" ? "pending" : current.status;
    await tx
      .update(appointments)
      .set({
        appointmentDate: input.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: nextStatus,
        rescheduleCount: current.rescheduleCount + 1,
      })
      .where(eq(appointments.id, id));

    const note = `Rescheduled from ${formatDate(current.date)} ${formatTime(current.startTime)} to ${formatDate(input.date)} ${formatTime(slot.startTime)}${input.reason ? ` – ${input.reason}` : ""}`;
    await logStatus(tx, id, current.status, nextStatus, user.id, note);

    const next = { treatment: current.treatment, date: input.date, startTime: slot.startTime };
    if (user.role !== "patient") {
      await notify(tx, current.patient.userId, { title: "Appointment rescheduled", message: `Your appointment is now ${describe(next)}.`, type: "appointment", appointmentId: id });
    }
    if (user.role !== "doctor") {
      await notify(tx, current.doctor.userId, {
        title: user.role === "patient" ? "Reschedule requested" : "Appointment rescheduled",
        message: `${current.patientName} moved to ${describe(next)}${user.role === "patient" ? " – please re-confirm." : "."}`,
        type: "appointment",
        appointmentId: id,
      });
    }
  });
  return getAppointment(user, id);
}

const TRANSITIONS: Record<string, AppointmentStatus[]> = {
  pending: ["confirmed", "rejected", "cancelled"],
  confirmed: ["completed", "no_show", "cancelled"],
};

export async function changeStatus(user: SessionUser, id: number, status: AppointmentStatus, note?: string | null) {
  if (user.role === "patient") throw new ApiError(403, "Patients can only cancel or reschedule their own appointments");
  if (status === "cancelled") return cancelAppointment(user, id, note);

  await withTx(async (tx) => {
    const appt = await lockAndLoad(tx, id);
    assertAccess(user, appt);
    if (!TRANSITIONS[appt.status]?.includes(status)) {
      throw new ApiError(409, `A ${appt.status.replace("_", " ")} appointment cannot be marked as ${status.replace("_", " ")}`);
    }
    if ((status === "completed" || status === "no_show") && appt.date > clinicNow().date) {
      throw new ApiError(422, "Future appointments cannot be marked as completed or no-show yet");
    }
    await tx
      .update(appointments)
      .set({
        status,
        ...(status === "rejected" ? { cancelledBy: user.role, cancellationReason: note ?? null } : {}),
      })
      .where(eq(appointments.id, id));
    await logStatus(tx, id, appt.status, status, user.id, note);

    const copy: Record<string, string> = {
      confirmed: "has been confirmed. We look forward to seeing you.",
      rejected: `could not be accommodated${note ? `: ${note}` : "."}`,
      completed: "is marked as completed. Thank you for visiting Clinova.",
      no_show: "was marked as a no-show.",
    };
    await notify(tx, appt.patient.userId, {
      title: `Appointment ${status.replace("_", " ")}`,
      message: `Your appointment for ${describe(appt)} ${copy[status]}`,
      type: "appointment",
      appointmentId: id,
    });
  });
  return getAppointment(user, id);
}
