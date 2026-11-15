import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function ok<T>(data: T, opts: { status?: number; meta?: Record<string, unknown> } = {}) {
  return NextResponse.json({ success: true, data, meta: opts.meta }, { status: opts.status ?? 200 });
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json({ success: false, error: { message, details } }, { status });
}

type PgErrorLike = { code?: string; cause?: { code?: string } };

function pgCode(e: unknown): string | undefined {
  const err = e as PgErrorLike;
  return err?.cause?.code ?? err?.code;
}

/** Wraps a route handler with consistent JSON error handling. */
export function route<P = Record<string, string>>(
  fn: (req: NextRequest, ctx: { params: P }) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: { params: Promise<P> }): Promise<Response> => {
    try {
      const params = (await ctx?.params) ?? ({} as P);
      return await fn(req, { params });
    } catch (e) {
      if (e instanceof ApiError) return fail(e.status, e.message, e.details);
      if (e instanceof ZodError) {
        const details = e.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
        return fail(422, details[0]?.message ?? "Validation failed", details);
      }
      const code = pgCode(e);
      if (code === "23505") return fail(409, "That record already exists or the time slot was just taken.");
      if (code === "23503") return fail(409, "This record is referenced by other data and cannot be changed.");
      console.error("[api] unhandled error", e);
      return fail(500, "Something went wrong on our side. Please try again.");
    }
  };
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
  return schema.parse(body);
}

export function parseId(value: string, label = "id"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new ApiError(400, `Invalid ${label}`);
  return n;
}

export function qs(req: NextRequest) {
  return req.nextUrl.searchParams;
}

export function toNumber(value: string | number | null | undefined): number {
  return value == null ? 0 : Number(value);
}
