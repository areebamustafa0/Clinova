import { and, eq, gte, lte, notInArray, ne, sql } from "drizzle-orm";
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
import {
  addDays,
  clinicNow,
  daysInMonth,
  dayOfWeek,
  isValidDateString,
  normTime,
  toHHMM,
  toMinutes,
} from "@/lib/time";

export type Executor = typeof db;

/** Runs `fn` inside a database transaction. */
export async function withTx<T>(fn: (tx: Executor) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => fn(tx as unknown as Executor));
}

/** Appointments in these statuses no longer occupy the doctor's calendar. */
export const RELEASED_STATUSES = ["cancelled", "rejected"] as const;
/** Patients need at least this much notice to book a slot. */
export const LEAD_MINUTES = 30;
/** Bookings are accepted up to this many days ahead. */
export const MAX_DAYS_AHEAD = 90;

type Range = { start: number; end: number };

export type Slot = {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: "booked" | "past";
};

/** Pure slot generator – the single source of truth for what is bookable. */
export function buildSlots(args: { blocks: Range[]; step: number; duration: number; busy: Range[]; date: string }): Slot[] {
  const now = clinicNow();
  const slots: Slot[] = [];
  const blocks = [...args.blocks].sort((a, b) => a.start - b.start);
  for (const block of blocks) {
    for (let start = block.start; start + args.duration <= block.end; start += args.step) {
      const end = start + args.duration;
      let available = true;
      let reason: Slot["reason"];
      if (args.date < now.date || (args.date === now.date && start < now.minutes + LEAD_MINUTES)) {
        available = false;
        reason = "past";
      } else if (args.busy.some((b) => start < b.end && end > b.start)) {
        available = false;
        reason = "booked";
      }
      slots.push({ startTime: toHHMM(start), endTime: toHHMM(end), available, reason });
    }
  }
  return slots;
}

async function loadContext(exec: Executor, doctorId: number, treatmentId: number) {
  const [doctor] = await exec
    .select({ id: doctors.id, isActive: doctors.isActive, slotDuration: doctors.slotDuration })
    .from(doctors)
    .where(eq(doctors.id, doctorId))
    .limit(1);
  if (!doctor || !doctor.isActive) throw new ApiError(404, "Doctor not found or no longer available");

  const [treatment] = await exec
    .select({
      id: treatments.id,
      name: treatments.name,
      durationMinutes: treatments.durationMinutes,
      price: treatments.price,
      isActive: treatments.isActive,
    })
    .from(treatments)
    .where(eq(treatments.id, treatmentId))
    .limit(1);
  if (!treatment || !treatment.isActive) throw new ApiError(404, "Treatment not found or no longer offered");

  const [link] = await exec
    .select({ doctorId: doctorTreatments.doctorId })
    .from(doctorTreatments)
    .where(and(eq(doctorTreatments.doctorId, doctorId), eq(doctorTreatments.treatmentId, treatmentId)))
    .limit(1);
  if (!link) throw new ApiError(422, "This doctor does not perform the selected treatment");

  return { doctor, treatment };
}

function liveStatusFilter() {
  return notInArray(appointments.status, [...RELEASED_STATUSES]);
}

export type SlotsResult = {
  date: string;
  doctorId: number;
  treatmentId: number;
  durationMinutes: number;
  slots: Slot[];
  closedReason?: string;
};

export async function getSlotsForDate(
  exec: Executor,
  args: { doctorId: number; treatmentId: number; date: string; excludeAppointmentId?: number },
): Promise<SlotsResult> {
  if (!isValidDateString(args.date)) throw new ApiError(400, "Invalid date");
  const { doctor, treatment } = await loadContext(exec, args.doctorId, args.treatmentId);
  const now = clinicNow();
  const base = { date: args.date, doctorId: doctor.id, treatmentId: treatment.id, durationMinutes: treatment.durationMinutes };

  if (args.date > addDays(now.date, MAX_DAYS_AHEAD)) {
    return { ...base, slots: [] as Slot[], closedReason: `Bookings open up to ${MAX_DAYS_AHEAD} days in advance` };
  }

  const [off] = await exec
    .select({ reason: doctorUnavailableDates.reason })
    .from(doctorUnavailableDates)
    .where(and(eq(doctorUnavailableDates.doctorId, doctor.id), eq(doctorUnavailableDates.date, args.date)))
    .limit(1);
  if (off) return { ...base, slots: [] as Slot[], closedReason: off.reason || "The doctor is unavailable on this date" };

  const schedule = await exec
    .select({ startTime: doctorSchedules.startTime, endTime: doctorSchedules.endTime })
    .from(doctorSchedules)
    .where(and(eq(doctorSchedules.doctorId, doctor.id), eq(doctorSchedules.dayOfWeek, dayOfWeek(args.date))));
  if (schedule.length === 0) return { ...base, slots: [] as Slot[], closedReason: "The doctor does not consult on this day" };

  const busyRows = await exec
    .select({ startTime: appointments.startTime, endTime: appointments.endTime })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctor.id),
        eq(appointments.appointmentDate, args.date),
        liveStatusFilter(),
        args.excludeAppointmentId ? ne(appointments.id, args.excludeAppointmentId) : undefined,
      ),
    );

  const slots = buildSlots({
    blocks: schedule.map((s) => ({ start: toMinutes(normTime(s.startTime)), end: toMinutes(normTime(s.endTime)) })),
    step: doctor.slotDuration,
    duration: treatment.durationMinutes,
    busy: busyRows.map((b) => ({ start: toMinutes(normTime(b.startTime)), end: toMinutes(normTime(b.endTime)) })),
    date: args.date,
  });
  return { ...base, slots };
}

/** For the booking calendar: which days of a month still have at least one free slot. */
export async function getAvailableDates(exec: Executor, args: { doctorId: number; treatmentId: number; month: string }) {
  if (!/^\d{4}-\d{2}$/.test(args.month)) throw new ApiError(400, "Month must be YYYY-MM");
  const [y, m] = args.month.split("-").map(Number);
  if (m < 1 || m > 12) throw new ApiError(400, "Month must be YYYY-MM");
  const { doctor, treatment } = await loadContext(exec, args.doctorId, args.treatmentId);

  const first = `${args.month}-01`;
  const last = `${args.month}-${String(daysInMonth(y, m)).padStart(2, "0")}`;

  const [schedules, offDays, busyRows] = await Promise.all([
    exec
      .select({ dow: doctorSchedules.dayOfWeek, startTime: doctorSchedules.startTime, endTime: doctorSchedules.endTime })
      .from(doctorSchedules)
      .where(eq(doctorSchedules.doctorId, doctor.id)),
    exec
      .select({ date: doctorUnavailableDates.date })
      .from(doctorUnavailableDates)
      .where(and(eq(doctorUnavailableDates.doctorId, doctor.id), gte(doctorUnavailableDates.date, first), lte(doctorUnavailableDates.date, last))),
    exec
      .select({ date: appointments.appointmentDate, startTime: appointments.startTime, endTime: appointments.endTime })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctor.id),
          gte(appointments.appointmentDate, first),
          lte(appointments.appointmentDate, last),
          liveStatusFilter(),
        ),
      ),
  ]);

  const offSet = new Set(offDays.map((d) => d.date));
  const now = clinicNow();
  const maxDate = addDays(now.date, MAX_DAYS_AHEAD);
  const dates: { date: string; availableSlots: number }[] = [];

  for (let day = 1; day <= daysInMonth(y, m); day++) {
    const date = `${args.month}-${String(day).padStart(2, "0")}`;
    if (date < now.date || date > maxDate || offSet.has(date)) continue;
    const blocks = schedules
      .filter((s) => s.dow === dayOfWeek(date))
      .map((s) => ({ start: toMinutes(normTime(s.startTime)), end: toMinutes(normTime(s.endTime)) }));
    if (blocks.length === 0) continue;
    const busy = busyRows
      .filter((b) => b.date === date)
      .map((b) => ({ start: toMinutes(normTime(b.startTime)), end: toMinutes(normTime(b.endTime)) }));
    const count = buildSlots({ blocks, step: doctor.slotDuration, duration: treatment.durationMinutes, busy, date }).filter(
      (s) => s.available,
    ).length;
    if (count > 0) dates.push({ date, availableSlots: count });
  }
  return { month: args.month, doctorId: doctor.id, treatmentId: treatment.id, dates };
}

/** Serialises concurrent bookings for the same doctor/day (and the same patient) inside a transaction. */
export async function lockForBooking(tx: Executor, doctorId: number, date: string, patientId?: number) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`doctor:${doctorId}:${date}`}))`);
  if (patientId) await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`patient:${patientId}`}))`);
}

/**
 * Authoritative booking validation. Must be called inside a transaction after `lockForBooking`.
 * Re-checks working hours, unavailable dates, past times, doctor overlaps and patient overlaps.
 */
export async function assertBookable(
  tx: Executor,
  args: {
    doctorId: number;
    treatmentId: number;
    date: string;
    startTime: string;
    patientId: number;
    excludeAppointmentId?: number;
  },
) {
  const result = await getSlotsForDate(tx, args);
  if (result.closedReason) throw new ApiError(422, result.closedReason);

  const slot = result.slots.find((s) => s.startTime === args.startTime);
  if (!slot) throw new ApiError(422, "That start time is outside the doctor's working hours or schedule grid");
  if (!slot.available) {
    if (slot.reason === "past") throw new ApiError(422, "Past or imminent times cannot be booked");
    throw new ApiError(409, "This time slot has just been booked. Please choose another.");
  }

  const start = toMinutes(slot.startTime);
  const end = toMinutes(slot.endTime);
  const mine = await tx
    .select({ startTime: appointments.startTime, endTime: appointments.endTime })
    .from(appointments)
    .where(
      and(
        eq(appointments.patientId, args.patientId),
        eq(appointments.appointmentDate, args.date),
        liveStatusFilter(),
        args.excludeAppointmentId ? ne(appointments.id, args.excludeAppointmentId) : undefined,
      ),
    );
  if (mine.some((a) => start < toMinutes(normTime(a.endTime)) && end > toMinutes(normTime(a.startTime)))) {
    throw new ApiError(409, "You already have an appointment that overlaps with this time");
  }

  return { startTime: slot.startTime, endTime: slot.endTime, durationMinutes: result.durationMinutes };
}

/**
 * The soonest free slots for a treatment: one offer per doctor (their first open day, up to five times),
 * ordered soonest-first. Looks at the current and the following month.
 */
export async function nextAvailable(exec: Executor, args: { treatmentId: number; doctorId?: number; limit?: number }) {
  const [treatment] = await exec
    .select({ id: treatments.id, name: treatments.name, durationMinutes: treatments.durationMinutes, price: treatments.price, isActive: treatments.isActive })
    .from(treatments)
    .where(eq(treatments.id, args.treatmentId))
    .limit(1);
  if (!treatment || !treatment.isActive) throw new ApiError(404, "Treatment not found or no longer offered");

  const team = await exec
    .select({ id: doctors.id, first: users.firstName, last: users.lastName, photo: doctors.photoUrl, spec: specializations.name })
    .from(doctorTreatments)
    .innerJoin(doctors, eq(doctors.id, doctorTreatments.doctorId))
    .innerJoin(users, eq(users.id, doctors.userId))
    .innerJoin(specializations, eq(specializations.id, doctors.specializationId))
    .where(and(eq(doctorTreatments.treatmentId, args.treatmentId), eq(doctors.isActive, true), args.doctorId ? eq(doctors.id, args.doctorId) : undefined));

  const thisMonth = clinicNow().date.slice(0, 7);
  const months = [thisMonth, addDays(`${thisMonth}-01`, 32).slice(0, 7)];
  type Offer = { doctor: { id: number; name: string; specialization: string; photoUrl: string | null }; date: string; slots: string[] };

  const found = await Promise.all(
    team.map(async (d): Promise<Offer | null> => {
      for (const month of months) {
        const { dates } = await getAvailableDates(exec, { doctorId: d.id, treatmentId: args.treatmentId, month });
        if (dates.length === 0) continue;
        const day = await getSlotsForDate(exec, { doctorId: d.id, treatmentId: args.treatmentId, date: dates[0].date });
        const slots = day.slots.filter((x) => x.available).slice(0, 5).map((x) => x.startTime);
        if (slots.length) {
          return { doctor: { id: d.id, name: `Dr. ${d.first} ${d.last}`, specialization: d.spec, photoUrl: d.photo }, date: dates[0].date, slots };
        }
      }
      return null;
    }),
  );

  const offers = found
    .filter((o): o is Offer => o !== null)
    .sort((a, b) => (a.date + a.slots[0]).localeCompare(b.date + b.slots[0]))
    .slice(0, args.limit ?? 3);

  return { treatment: { id: treatment.id, name: treatment.name, durationMinutes: treatment.durationMinutes, price: Number(treatment.price) }, offers };
}
