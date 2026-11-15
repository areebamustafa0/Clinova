import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import type { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { doctors, patients, users } from "@/db/schema";
import { ApiError } from "./api";

export type Role = "patient" | "doctor" | "admin";

export type SessionUser = {
  id: number;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone: string | null;
  patientId: number | null;
  doctorId: number | null;
};

export const AUTH_COOKIE = "clinova_token";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 16) return s;
  if (!globalThis.__clinovaSecretWarned) {
    console.warn("[auth] JWT_SECRET is missing or too short – using an insecure development secret. Set JWT_SECRET in production!");
    globalThis.__clinovaSecretWarned = true;
  }
  return "clinova-insecure-development-secret-change-me";
}

declare global {
  // eslint-disable-next-line no-var
  var __clinovaSecretWarned: boolean | undefined;
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export function signToken(user: { id: number; role: Role; tokenVersion: number }): string {
  return jwt.sign({ sub: String(user.id), role: user.role, tv: user.tokenVersion }, secret(), {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

function extractToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return req.cookies.get(AUTH_COOKIE)?.value ?? null;
}

export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  const token = extractToken(req);
  if (!token) return null;
  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(token, secret());
    if (typeof decoded === "string") return null;
    payload = decoded;
  } catch {
    return null;
  }
  const id = Number(payload.sub);
  if (!Number.isInteger(id)) return null;

  const loaded = await loadSessionUser(id);
  if (!loaded || !loaded.isActive || loaded.tokenVersion !== payload.tv) return null;
  return loaded.user;
}

export async function loadSessionUser(id: number) {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      isActive: users.isActive,
      tokenVersion: users.tokenVersion,
      patientId: patients.id,
      doctorId: doctors.id,
    })
    .from(users)
    .leftJoin(patients, eq(patients.userId, users.id))
    .leftJoin(doctors, eq(doctors.userId, users.id))
    .where(eq(users.id, id))
    .limit(1);

  if (!row) return null;
  const { isActive, tokenVersion, ...user } = row;
  return { user: user as SessionUser, isActive, tokenVersion };
}

/** Ensures a valid session and (optionally) one of the allowed roles. */
export async function requireUser(req: NextRequest, roles?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser(req);
  if (!user) throw new ApiError(401, "Please sign in to continue");
  if (roles && !roles.includes(user.role)) throw new ApiError(403, "You do not have permission to perform this action");
  return user;
}

export function fullName(u: { firstName: string; lastName: string }) {
  return `${u.firstName} ${u.lastName}`.trim();
}
