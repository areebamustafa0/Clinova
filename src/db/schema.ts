import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/*  Enums                                                                     */
/* -------------------------------------------------------------------------- */

export const userRole = pgEnum("user_role", ["patient", "doctor", "admin"]);

export const appointmentStatus = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rejected",
  "no_show",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

/* -------------------------------------------------------------------------- */
/*  Identity                                                                  */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: userRole("role").notNull().default("patient"),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    isActive: boolean("is_active").notNull().default(true),
    /** Incremented on logout / password change to invalidate previously issued JWTs. */
    tokenVersion: integer("token_version").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("uq_users_email").on(t.email), index("idx_users_role").on(t.role)],
);

export const patients = pgTable(
  "patients",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    gender: varchar("gender", { length: 20 }),
    address: text("address"),
    emergencyContact: varchar("emergency_contact", { length: 255 }),
    ...timestamps,
  },
  (t) => [uniqueIndex("uq_patients_user").on(t.userId)],
);

/* -------------------------------------------------------------------------- */
/*  Clinic catalogue                                                          */
/* -------------------------------------------------------------------------- */

export const specializations = pgTable(
  "specializations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    ...timestamps,
  },
  (t) => [uniqueIndex("uq_specializations_name").on(t.name)],
);

export const doctors = pgTable(
  "doctors",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    specializationId: integer("specialization_id")
      .notNull()
      .references(() => specializations.id, { onDelete: "restrict" }),
    qualifications: text("qualifications").notNull().default(""),
    experienceYears: integer("experience_years").notNull().default(0),
    bio: text("bio").notNull().default(""),
    consultationFee: numeric("consultation_fee", { precision: 10, scale: 2 }).notNull().default("0"),
    photoUrl: text("photo_url"),
    /** Slot grid in minutes (how often a new appointment may start). */
    slotDuration: integer("slot_duration").notNull().default(30),
    rating: numeric("rating", { precision: 2, scale: 1 }).notNull().default("4.8"),
    reviewCount: integer("review_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("uq_doctors_user").on(t.userId),
    index("idx_doctors_specialization").on(t.specializationId),
    index("idx_doctors_active").on(t.isActive),
  ],
);

export const treatments = pgTable(
  "treatments",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    description: text("description").notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
    imageUrl: text("image_url"),
    slug: varchar("slug", { length: 120 }),
    tagline: varchar("tagline", { length: 200 }),
    durationLabel: varchar("duration_label", { length: 40 }),
    sessions: varchar("sessions", { length: 40 }),
    downtime: varchar("downtime", { length: 40 }),
    isFeatured: boolean("is_featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("idx_treatments_category").on(t.category), index("idx_treatments_active").on(t.isActive), uniqueIndex("uq_treatments_slug").on(t.slug)],
);

export const doctorTreatments = pgTable(
  "doctor_treatments",
  {
    doctorId: integer("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    treatmentId: integer("treatment_id")
      .notNull()
      .references(() => treatments.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.doctorId, t.treatmentId] }), index("idx_doctor_treatments_treatment").on(t.treatmentId)],
);

/* -------------------------------------------------------------------------- */
/*  Availability                                                              */
/* -------------------------------------------------------------------------- */

export const doctorSchedules = pgTable(
  "doctor_schedules",
  {
    id: serial("id").primaryKey(),
    doctorId: integer("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    /** 0 = Sunday … 6 = Saturday */
    dayOfWeek: smallint("day_of_week").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("uq_doctor_schedule_block").on(t.doctorId, t.dayOfWeek, t.startTime),
    index("idx_doctor_schedules_doctor_day").on(t.doctorId, t.dayOfWeek),
  ],
);

export const doctorUnavailableDates = pgTable(
  "doctor_unavailable_dates",
  {
    id: serial("id").primaryKey(),
    doctorId: integer("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    reason: varchar("reason", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("uq_doctor_unavailable").on(t.doctorId, t.date)],
);

/* -------------------------------------------------------------------------- */
/*  Appointments                                                              */
/* -------------------------------------------------------------------------- */

export const appointments = pgTable(
  "appointments",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 20 }).notNull(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    doctorId: integer("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "restrict" }),
    treatmentId: integer("treatment_id")
      .notNull()
      .references(() => treatments.id, { onDelete: "restrict" }),
    appointmentDate: date("appointment_date", { mode: "string" }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    status: appointmentStatus("status").notNull().default("pending"),
    patientName: varchar("patient_name", { length: 200 }).notNull(),
    patientPhone: varchar("patient_phone", { length: 30 }).notNull(),
    patientEmail: varchar("patient_email", { length: 255 }),
    reason: text("reason"),
    notes: text("notes"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
    rescheduleCount: integer("reschedule_count").notNull().default(0),
    cancelledBy: varchar("cancelled_by", { length: 20 }),
    cancellationReason: text("cancellation_reason"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("uq_appointments_reference").on(t.reference),
    // Last line of defence against double booking: one live appointment per doctor start time.
    uniqueIndex("uq_appointments_live_slot")
      .on(t.doctorId, t.appointmentDate, t.startTime)
      .where(sql`${t.status} not in ('cancelled', 'rejected')`),
    index("idx_appointments_doctor_date").on(t.doctorId, t.appointmentDate),
    index("idx_appointments_patient_date").on(t.patientId, t.appointmentDate),
    index("idx_appointments_status").on(t.status),
    index("idx_appointments_date").on(t.appointmentDate),
    index("idx_appointments_treatment").on(t.treatmentId),
  ],
);

export const appointmentStatusHistory = pgTable(
  "appointment_status_history",
  {
    id: serial("id").primaryKey(),
    appointmentId: integer("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    fromStatus: appointmentStatus("from_status"),
    toStatus: appointmentStatus("to_status").notNull(),
    changedBy: integer("changed_by").references(() => users.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_status_history_appointment").on(t.appointmentId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    appointmentId: integer("appointment_id").references(() => appointments.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 40 }).notNull().default("info"),
    title: varchar("title", { length: 160 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_notifications_user_read").on(t.userId, t.isRead, t.createdAt)],
);

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    subject: varchar("subject", { length: 200 }).notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_contact_messages_read").on(t.isRead, t.createdAt)],
);
