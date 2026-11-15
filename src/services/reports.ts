import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { appointments, contactMessages, doctors, treatments, users } from "@/db/schema";
import { addDays, clinicToday, dayOfWeek } from "@/lib/time";

const num = (v: unknown) => Number(v ?? 0);

export async function overviewStats() {
  const today = clinicToday();
  const [[a], [p], [d], [t], [m]] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        pending: sql<number>`count(*) filter (where status = 'pending')::int`,
        confirmed: sql<number>`count(*) filter (where status = 'confirmed')::int`,
        completed: sql<number>`count(*) filter (where status = 'completed')::int`,
        cancelled: sql<number>`count(*) filter (where status in ('cancelled','rejected'))::int`,
        today: sql<number>`count(*) filter (where appointment_date = ${today} and status in ('pending','confirmed','completed'))::int`,
        upcoming: sql<number>`count(*) filter (where appointment_date >= ${today} and status in ('pending','confirmed'))::int`,
        revenue: sql<string>`coalesce(sum(price) filter (where status = 'completed'), 0)`,
        projected: sql<string>`coalesce(sum(price) filter (where status in ('pending','confirmed') and appointment_date >= ${today}), 0)`,
      })
      .from(appointments),
    db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "patient")),
    db.select({ n: sql<number>`count(*)::int` }).from(doctors).where(eq(doctors.isActive, true)),
    db.select({ n: sql<number>`count(*)::int` }).from(treatments).where(eq(treatments.isActive, true)),
    db.select({ n: sql<number>`count(*)::int` }).from(contactMessages).where(eq(contactMessages.isRead, false)),
  ]);
  return {
    patients: p.n,
    doctors: d.n,
    treatments: t.n,
    unreadMessages: m.n,
    appointments: { ...a, revenue: num(a.revenue), projected: num(a.projected) },
  };
}

/** Public numbers for the marketing site. */
export async function publicStats() {
  const [[d], [p], [t], [a]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int`, years: sql<number>`coalesce(sum(experience_years), 0)::int` }).from(doctors).where(eq(doctors.isActive, true)),
    db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "patient")),
    db.select({ n: sql<number>`count(*)::int` }).from(treatments).where(eq(treatments.isActive, true)),
    db.select({ n: sql<number>`count(*)::int` }).from(appointments).where(eq(appointments.status, "completed")),
  ]);
  return { doctors: d.n, patients: p.n, treatments: t.n, completedVisits: a.n, yearsExperience: d.years };
}

type Series = { label: string; key: string; total: number; completed: number; cancelled: number };

function fill(keys: { key: string; label: string }[], rows: { key: string; total: unknown; completed: unknown; cancelled: unknown }[]): Series[] {
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return keys.map(({ key, label }) => {
    const r = byKey.get(key);
    return { key, label, total: num(r?.total), completed: num(r?.completed), cancelled: num(r?.cancelled) };
  });
}

const counts = sql`count(*) filter (where status not in ('cancelled','rejected'))::int as total,
  count(*) filter (where status = 'completed')::int as completed,
  count(*) filter (where status in ('cancelled','rejected'))::int as cancelled`;

export async function appointmentReports() {
  const today = clinicToday();

  // Daily – last 14 days
  const dailyKeys = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const dailyRes = await db.execute(sql`select to_char(appointment_date, 'YYYY-MM-DD') as key, ${counts}
    from appointments where appointment_date between ${dailyKeys[0]} and ${today} group by 1`);
  const daily = fill(
    dailyKeys.map((k) => ({ key: k, label: new Date(`${k}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" }) })),
    dailyRes.rows as never[],
  );

  // Weekly – last 8 ISO weeks (Mon–Sun)
  const monday = addDays(today, -((dayOfWeek(today) + 6) % 7));
  const weekKeys = Array.from({ length: 8 }, (_, i) => addDays(monday, (i - 7) * 7));
  const weeklyRes = await db.execute(sql`select to_char(date_trunc('week', appointment_date), 'YYYY-MM-DD') as key, ${counts}
    from appointments where appointment_date >= ${weekKeys[0]} and appointment_date < ${addDays(monday, 7)} group by 1`);
  const weekly = fill(
    weekKeys.map((k) => ({ key: k, label: `Wk ${new Date(`${k}T00:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" })}` })),
    weeklyRes.rows as never[],
  );

  // Monthly – last 6 months
  const [ty, tm] = today.split("-").map(Number);
  const monthKeys = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(ty, tm - 1 - (5 - i), 1));
    return d.toISOString().slice(0, 7);
  });
  const monthlyRes = await db.execute(sql`select to_char(date_trunc('month', appointment_date), 'YYYY-MM') as key, ${counts}
    from appointments where appointment_date >= ${monthKeys[0] + "-01"} and appointment_date < ${addDays(`${monthKeys[5]}-01`, 32).slice(0, 7) + "-01"} group by 1`);
  const monthly = fill(
    monthKeys.map((k) => ({ key: k, label: new Date(`${k}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }) })),
    monthlyRes.rows as never[],
  );

  const statusRes = await db.execute(sql`select status::text as status, count(*)::int as count from appointments group by 1 order by 2 desc`);
  const popularRes = await db.execute(sql`select t.id, t.name, t.category, count(a.id)::int as count, coalesce(sum(a.price) filter (where a.status = 'completed'), 0) as revenue
    from treatments t left join appointments a on a.treatment_id = t.id and a.status not in ('cancelled','rejected')
    group by t.id order by count desc, t.name limit 8`);
  const doctorRes = await db.execute(sql`select d.id, u.first_name, u.last_name, s.name as specialization, d.photo_url,
      count(a.id)::int as total,
      count(a.id) filter (where a.status = 'completed')::int as completed,
      count(a.id) filter (where a.status in ('cancelled','rejected'))::int as cancelled,
      count(a.id) filter (where a.status in ('pending','confirmed') and a.appointment_date >= ${today})::int as upcoming,
      coalesce(sum(a.price) filter (where a.status = 'completed'), 0) as revenue
    from doctors d join users u on u.id = d.user_id join specializations s on s.id = d.specialization_id
    left join appointments a on a.doctor_id = d.id
    group by d.id, u.first_name, u.last_name, s.name order by total desc`);

  type R = Record<string, unknown>;
  return {
    daily,
    weekly,
    monthly,
    statusBreakdown: (statusRes.rows as R[]).map((r) => ({ status: String(r.status), count: num(r.count) })),
    popularTreatments: (popularRes.rows as R[]).map((r) => ({
      id: num(r.id),
      name: String(r.name),
      category: String(r.category),
      count: num(r.count),
      revenue: num(r.revenue),
    })),
    doctorStats: (doctorRes.rows as R[]).map((r) => ({
      id: num(r.id),
      name: `Dr. ${r.first_name} ${r.last_name}`,
      specialization: String(r.specialization),
      photoUrl: (r.photo_url as string | null) ?? null,
      total: num(r.total),
      completed: num(r.completed),
      cancelled: num(r.cancelled),
      upcoming: num(r.upcoming),
      revenue: num(r.revenue),
    })),
  };
}
