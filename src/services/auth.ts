import { eq, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/db";
import { doctors, patients, specializations, users } from "@/db/schema";
import { ApiError } from "@/lib/api";
import { hashPassword, verifyPassword, type SessionUser } from "@/lib/auth";
import type { changePasswordSchema, profileSchema, registerSchema } from "@/validators";
import { withTx } from "./availability";

export async function registerPatient(input: z.infer<typeof registerSchema>) {
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (exists) throw new ApiError(409, "An account with this email already exists. Try signing in instead.");
  const passwordHash = await hashPassword(input.password);

  return withTx(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        email: input.email,
        passwordHash,
        role: "patient",
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      })
      .returning({ id: users.id, role: users.role, tokenVersion: users.tokenVersion });
    await tx.insert(patients).values({ userId: user.id, dateOfBirth: input.dateOfBirth ?? null, gender: input.gender ?? null });
    return user;
  });
}

export async function authenticate(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) throw new ApiError(401, "Incorrect email or password");
  if (!user.isActive) throw new ApiError(403, "This account has been deactivated. Please contact the clinic.");
  return user;
}

export async function revokeTokens(userId: number) {
  await db.update(users).set({ tokenVersion: sql`${users.tokenVersion} + 1` }).where(eq(users.id, userId));
}

export async function getProfile(user: SessionUser) {
  const base = { ...user, name: `${user.firstName} ${user.lastName}` };
  if (user.role === "patient" && user.patientId) {
    const [p] = await db.select().from(patients).where(eq(patients.id, user.patientId));
    return {
      ...base,
      dateOfBirth: p?.dateOfBirth ?? null,
      gender: p?.gender ?? null,
      address: p?.address ?? null,
      emergencyContact: p?.emergencyContact ?? null,
    };
  }
  if (user.role === "doctor" && user.doctorId) {
    const [d] = await db
      .select({ photoUrl: doctors.photoUrl, specialization: specializations.name })
      .from(doctors)
      .innerJoin(specializations, eq(specializations.id, doctors.specializationId))
      .where(eq(doctors.id, user.doctorId));
    return { ...base, name: `Dr. ${user.firstName} ${user.lastName}`, photoUrl: d?.photoUrl ?? null, specialization: d?.specialization ?? null };
  }
  return base;
}

export async function updateProfile(user: SessionUser, input: z.infer<typeof profileSchema>) {
  await withTx(async (tx) => {
    await tx.update(users).set({ firstName: input.firstName, lastName: input.lastName, phone: input.phone }).where(eq(users.id, user.id));
    if (user.role === "patient" && user.patientId) {
      await tx
        .update(patients)
        .set({
          dateOfBirth: input.dateOfBirth ?? null,
          gender: input.gender ?? null,
          address: input.address ?? null,
          emergencyContact: input.emergencyContact ?? null,
        })
        .where(eq(patients.id, user.patientId));
    }
  });
  return getProfile({ ...user, firstName: input.firstName, lastName: input.lastName, phone: input.phone });
}

export async function changePassword(user: SessionUser, input: z.infer<typeof changePasswordSchema>) {
  const [row] = await db.select().from(users).where(eq(users.id, user.id));
  if (!row || !(await verifyPassword(input.currentPassword, row.passwordHash))) {
    throw new ApiError(400, "Your current password is incorrect");
  }
  if (input.currentPassword === input.newPassword) throw new ApiError(422, "Choose a password you have not used before");
  const [updated] = await db
    .update(users)
    .set({ passwordHash: await hashPassword(input.newPassword), tokenVersion: sql`${users.tokenVersion} + 1` })
    .where(eq(users.id, user.id))
    .returning({ id: users.id, role: users.role, tokenVersion: users.tokenVersion });
  return updated;
}
