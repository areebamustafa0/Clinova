import { z } from "zod";
import { isValidDateString, isValidTimeString } from "@/lib/time";

const phone = z
  .string()
  .trim()
  .regex(/^[+()\-\s\d]{7,20}$/, "Enter a valid phone number");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password is too long")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/\d/, "Password must contain a number");

const dateStr = z.string().refine(isValidDateString, "Use the date format YYYY-MM-DD");
const timeStr = z.string().refine(isValidTimeString, "Use the time format HH:MM");
const name = (label: string) => z.string().trim().min(1, `${label} is required`).max(100);
const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(255);
const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

/* ------------------------------- auth ------------------------------------ */

export const registerSchema = z.object({
  firstName: name("First name"),
  lastName: name("Last name"),
  email,
  phone,
  password,
  dateOfBirth: dateStr.optional().nullable(),
  gender: z.enum(["female", "male", "other", "prefer_not_to_say"]).optional().nullable(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const profileSchema = z.object({
  firstName: name("First name"),
  lastName: name("Last name"),
  phone,
  dateOfBirth: dateStr.optional().nullable(),
  gender: z.enum(["female", "male", "other", "prefer_not_to_say"]).optional().nullable(),
  address: optionalText(500),
  emergencyContact: optionalText(255),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: password,
});

/* ----------------------------- appointments ------------------------------ */

export const createAppointmentSchema = z.object({
  doctorId: z.number().int().positive(),
  treatmentId: z.number().int().positive(),
  date: dateStr,
  startTime: timeStr,
  patientName: z.string().trim().min(2, "Patient name is required").max(200),
  patientPhone: phone,
  patientEmail: z.string().trim().toLowerCase().email("Enter a valid email address").optional().nullable().or(z.literal("").transform(() => null)),
  reason: optionalText(1000),
  notes: optionalText(1000),
});

export const rescheduleSchema = z.object({
  date: dateStr,
  startTime: timeStr,
  reason: optionalText(500),
});

export const cancelSchema = z.object({ reason: optionalText(500) });

export const statusSchema = z.object({
  status: z.enum(["confirmed", "rejected", "completed", "cancelled", "no_show"]),
  note: optionalText(500),
});

/* ------------------------------- doctors --------------------------------- */

const scheduleBlock = z
  .object({ startTime: timeStr, endTime: timeStr })
  .refine((b) => b.startTime < b.endTime, "End time must be after start time");

export const scheduleSchema = z
  .object({
    slotDuration: z.number().int().min(10).max(120).optional(),
    days: z
      .array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          blocks: z.array(scheduleBlock).max(4),
        }),
      )
      .max(7),
  })
  .superRefine((val, ctx) => {
    for (const day of val.days) {
      const sorted = [...day.blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startTime < sorted[i - 1].endTime) {
          ctx.addIssue({ code: "custom", message: "Working hour blocks on the same day cannot overlap" });
          return;
        }
      }
    }
  });

export const unavailableDateSchema = z.object({
  date: dateStr,
  reason: optionalText(255),
});

const doctorShape = {
  firstName: name("First name"),
  lastName: name("Last name"),
  email,
  phone: phone.optional().nullable().or(z.literal("").transform(() => null)),
  specializationId: z.number().int().positive().optional(),
  specializationName: z.string().trim().min(2).max(120).optional(),
  qualifications: z.string().trim().max(1000),
  experienceYears: z.number().int().min(0).max(70),
  bio: z.string().trim().max(3000),
  consultationFee: z.number().min(0).max(100000),
  photoUrl: z.string().trim().max(1000).optional().nullable().or(z.literal("").transform(() => null)),
  slotDuration: z.number().int().min(10).max(120),
  treatmentIds: z.array(z.number().int().positive()),
  isActive: z.boolean(),
};

export const createDoctorSchema = z
  .object({
    ...doctorShape,
    qualifications: doctorShape.qualifications.default(""),
    experienceYears: doctorShape.experienceYears.default(0),
    bio: doctorShape.bio.default(""),
    slotDuration: doctorShape.slotDuration.default(30),
    treatmentIds: doctorShape.treatmentIds.default([]),
    isActive: doctorShape.isActive.default(true),
    password,
  })
  .refine((d) => d.specializationId || d.specializationName, { message: "Choose a specialization", path: ["specializationId"] });

// No defaults here: a PATCH must only touch the fields that were actually sent.
export const updateDoctorSchema = z
  .object({ ...doctorShape, password: password.optional().or(z.literal("").transform(() => undefined)) })
  .partial();

/* ------------------------------ treatments ------------------------------- */

const treatmentShape = {
  name: z.string().trim().min(2, "Name is required").max(160),
  category: z.string().trim().min(2, "Category is required").max(80),
  description: z.string().trim().min(10, "Add a short description").max(3000),
  durationMinutes: z.number().int().min(10).max(480),
  price: z.number().min(0).max(1000000),
  imageUrl: z.string().trim().max(1000).optional().nullable().or(z.literal("").transform(() => null)),
  slug: optionalText(120),
  tagline: optionalText(200),
  durationLabel: optionalText(40),
  sessions: optionalText(40),
  downtime: optionalText(40),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  doctorIds: z.array(z.number().int().positive()),
};

export const treatmentSchema = z.object({
  ...treatmentShape,
  isFeatured: treatmentShape.isFeatured.default(false),
  isActive: treatmentShape.isActive.default(true),
  doctorIds: treatmentShape.doctorIds.default([]),
});

export const updateTreatmentSchema = z.object(treatmentShape).partial();

/* ------------------------------- patients -------------------------------- */

export const adminPatientUpdateSchema = z
  .object({
    firstName: name("First name"),
    lastName: name("Last name"),
    phone,
    isActive: z.boolean(),
    address: optionalText(500),
  })
  .partial();

/* ------------------------------- contact --------------------------------- */

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(200),
  email,
  phone: phone.optional().nullable().or(z.literal("").transform(() => null)),
  subject: z.string().trim().min(3, "Add a subject").max(200),
  message: z.string().trim().min(10, "Your message is a little short").max(4000),
});
