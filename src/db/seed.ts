import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appointmentStatusHistory,
  appointments,
  contactMessages,
  doctorSchedules,
  doctorTreatments,
  doctorUnavailableDates,
  doctors,
  notifications,
  patients,
  specializations,
  treatments,
  users,
} from "@/db/schema";
import { addDays, clinicNow, dayOfWeek, toHHMM, toMinutes } from "@/lib/time";

/* -------------------------------------------------------------------------- */
/*  Demo credentials (development only – change / remove for production)      */
/* -------------------------------------------------------------------------- */
export const DEMO_ACCOUNTS = {
  admin: { email: "admin@clinova.com", password: "Admin@123" },
  doctor: { email: "doctor@clinova.com", password: "Doctor@123" },
  patient: { email: "patient@clinova.com", password: "Patient@123" },
};

type Status = "pending" | "confirmed" | "completed" | "cancelled" | "rejected" | "no_show";

const SPECIALIZATIONS = [
  ["Medical Director & Consultant Aesthetic Physician", "Doctor-led aesthetic medicine with a long-term view of skin health."],
  ["Consultant Dermatologist", "Medical dermatology for acne, pigmentation and skin conditions."],
  ["Aesthetic Nurse Practitioner", "Injectables and skin boosters with a light, natural touch."],
  ["Laser & Energy Specialist", "Precision laser and energy-based skin treatments."],
  ["Advanced Skin Therapist", "Medical-grade facials and skin health programmes."],
  ["Clinical Skin Specialist", "Structured treatment plans for acne, tone and texture."],
] as const;

const TREATMENTS = [
  { key: "facial", slug: "facial-treatments", name: "Facial Treatments", category: "Facials", duration: 60, label: "60 min", sessions: "Monthly", downtime: "None", price: 150, img: "facial-treatment", featured: true, tagline: "Dullness · Congestion · Dehydration", description: "Medical-grade facials that cleanse, restore and bring back a healthy glow." },
  { key: "rejuv", slug: "skin-rejuvenation", name: "Skin Rejuvenation", category: "Rejuvenation", duration: 45, label: "45 min", sessions: "3 – 6", downtime: "Minimal", price: 280, img: "led-therapy", featured: true, tagline: "Loss of radiance · Fine lines · Uneven tone", description: "Restore radiance, firmness and tone with advanced energy-based therapies." },
  { key: "acne", slug: "acne", name: "Acne & Acne Scarring", category: "Acne Care", duration: 45, label: "30 – 60 min", sessions: "4 – 8", downtime: "1 – 3 days", price: 180, img: "result-texture", featured: true, tagline: "Active acne · Post-acne marks · Textural scarring", description: "Clear active breakouts and soften scarring with a structured medical plan." },
  { key: "pigment", slug: "pigmentation", name: "Pigmentation", category: "Pigmentation", duration: 45, label: "30 – 45 min", sessions: "3 – 5", downtime: "Minimal", price: 260, img: "ipl-laser", featured: true, tagline: "Sun spots · Melasma · Post-inflammatory marks", description: "Even out sun damage, melasma and dark spots for a clearer complexion." },
  { key: "laser", slug: "laser-treatments", name: "Laser Treatments", category: "Laser", duration: 45, label: "30 – 60 min", sessions: "1 – 4", downtime: "0 – 5 days", price: 320, img: "laser-resurfacing", featured: false, tagline: "Texture · Redness & vessels · Fine lines", description: "Precise laser resurfacing for texture, redness, vessels and tone." },
  { key: "aging", slug: "anti-aging", name: "Anti-Aging", category: "Anti-Aging", duration: 45, label: "30 – 45 min", sessions: "Tailored", downtime: "Minimal", price: 350, img: "profiles-layered", featured: false, tagline: "Expression lines · Volume loss · Skin laxity", description: "Soften lines and restore lost volume while keeping your natural expression." },
  { key: "inject", slug: "injectables", name: "Injectables", category: "Injectables", duration: 30, label: "30 min", sessions: "1 – 2", downtime: "Minimal", price: 290, img: "injectables", featured: false, tagline: "Lines & wrinkles · Lip definition · Facial contour", description: "Doctor-led anti-wrinkle and dermal filler treatments with a light touch." },
  { key: "boost", slug: "skin-boosters", name: "Skin Boosters", category: "Skin Boosters", duration: 30, label: "30 min", sessions: "2 – 3", downtime: "24 – 48 hrs", price: 240, img: "skin-boosters", featured: false, tagline: "Dehydration · Crepey texture · Dull skin", description: "Injectable hydration for plump, dewy, quietly luminous skin." },
];

type Blocks = Record<number, [string, string][]>;
const weekdays = (blocks: [string, string][], days = [1, 2, 3, 4, 5]): Blocks => Object.fromEntries(days.map((d) => [d, blocks]));

const DOCTORS: {
  first: string; last: string; email: string; spec: string; quals: string; exp: number; fee: number; photo: string;
  grid: number; rating: number; reviews: number; bio: string; treatments: string[]; schedule: Blocks; phone: string;
}[] = [
  {
    first: "Layla", last: "Haddad", email: DEMO_ACCOUNTS.doctor.email, spec: "Medical Director & Consultant Aesthetic Physician", exp: 15, fee: 165, photo: "/images/site/doctor-portrait.jpg", grid: 30, rating: 4.9, reviews: 286, phone: "+44 20 7946 0124",
    quals: "MBBS, King's College London · MSc Aesthetic Medicine, Queen Mary University of London · Member, British College of Aesthetic Medicine",
    bio: "Dr. Haddad spent a decade in NHS dermatology before founding the clinic. She is known for meticulous skin assessments, conservative dosing and long-term plans that put the health of your skin ahead of quick fixes.",
    treatments: ["rejuv", "aging", "inject", "boost", "laser", "facial"],
    schedule: { ...weekdays([["09:00", "13:00"], ["14:00", "17:00"]], [1, 2, 3, 5]), 4: [["12:00", "19:00"]] },
  },
  {
    first: "Julian", last: "Whitmore", email: "julian.whitmore@clinova.com", spec: "Consultant Dermatologist", exp: 18, fee: 190, photo: "julian-whitmore", grid: 30, rating: 4.9, reviews: 156, phone: "+44 20 7946 0125",
    quals: "MD, FRCP · Consultant dermatologist",
    bio: "A medical dermatologist who treats acne, pigmentation and sensitive skin with evidence-led plans — and explains every step in plain language.",
    treatments: ["acne", "pigment", "laser"],
    schedule: weekdays([["08:30", "12:30"], ["13:30", "17:00"]], [1, 3, 4]),
  },
  {
    first: "Amara", last: "Okafor", email: "amara.okafor@clinova.com", spec: "Aesthetic Nurse Practitioner", exp: 9, fee: 130, photo: "amara-okafor", grid: 30, rating: 4.8, reviews: 189, phone: "+44 20 7946 0126",
    quals: "BSc, NMP · Advanced injectables diploma",
    bio: "Amara's philosophy is subtle enhancement. Her signature facial balancing consultations are among the most requested at the clinic.",
    treatments: ["inject", "boost", "aging"],
    schedule: weekdays([["10:00", "18:00"]], [2, 3, 4, 5, 6]),
  },
  {
    first: "Daniel", last: "Reyes", email: "daniel.reyes@clinova.com", spec: "Laser & Energy Specialist", exp: 11, fee: 140, photo: "daniel-reyes", grid: 30, rating: 4.9, reviews: 132, phone: "+44 20 7946 0127",
    quals: "MSc Laser Medicine · Certified laser safety officer",
    bio: "Daniel pairs precise laser technology with a calm chairside manner, tailoring every setting to your skin tone and goals.",
    treatments: ["laser", "pigment", "rejuv"],
    schedule: weekdays([["09:00", "13:00"], ["14:00", "17:00"]]),
  },
  {
    first: "Sofia", last: "Lindqvist", email: "sofia.lindqvist@clinova.com", spec: "Advanced Skin Therapist", exp: 10, fee: 110, photo: "sofia-lindqvist", grid: 15, rating: 4.8, reviews: 241, phone: "+44 20 7946 0128",
    quals: "BTEC Level 5 · Medical-grade skin therapy",
    bio: "Sofia is the steady, unhurried voice of the treatment room — our most requested facial therapist, never rushed and always thorough.",
    treatments: ["facial", "boost", "acne"],
    schedule: { ...weekdays([["09:00", "17:00"]]), 6: [["10:00", "17:00"]] },
  },
  {
    first: "Priya", last: "Raman", email: "priya.raman@clinova.com", spec: "Clinical Skin Specialist", exp: 8, fee: 120, photo: "priya-raman", grid: 30, rating: 4.9, reviews: 118, phone: "+44 20 7946 0129",
    quals: "MSc Clinical Dermatology · Skin health programmes",
    bio: "Priya builds structured, realistic plans for acne, tone and texture — with clear aftercare you can actually follow.",
    treatments: ["facial", "acne", "pigment", "rejuv"],
    schedule: weekdays([["09:00", "17:00"]], [2, 4, 6]),
  },
];

const PATIENTS = [
  ["Olivia", "Bennett", DEMO_ACCOUNTS.patient.email, "female"], ["James", "Carter", "james.carter@example.com", "male"],
  ["Sophia", "Nguyen", "sophia.nguyen@example.com", "female"], ["Liam", "Patel", "liam.patel@example.com", "male"],
  ["Emma", "Rodriguez", "emma.rodriguez@example.com", "female"], ["Noah", "Kim", "noah.kim@example.com", "male"],
  ["Ava", "Thompson", "ava.thompson@example.com", "female"], ["Lucas", "Martin", "lucas.martin@example.com", "male"],
  ["Isabella", "Rossi", "isabella.rossi@example.com", "female"], ["Ethan", "Walker", "ethan.walker@example.com", "male"],
  ["Mia", "Johansson", "mia.johansson@example.com", "female"], ["Daniel", "Okoye", "daniel.okoye@example.com", "male"],
] as const;

const REASONS = ["Routine visit", "Follow-up appointment", "First consultation", "Recommended by a friend", "Seasonal skin concerns", "Annual review", null, null];

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function seedDatabase(opts: { reset?: boolean } = {}) {
  if (opts.reset) {
    await db.execute(sql`truncate table notifications, appointment_status_history, appointments, doctor_unavailable_dates, doctor_schedules, doctor_treatments, treatments, doctors, specializations, patients, contact_messages, users restart identity cascade`);
  }
  const rand = rng(20260);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const hash = {
    admin: await bcrypt.hash(DEMO_ACCOUNTS.admin.password, 10),
    doctor: await bcrypt.hash(DEMO_ACCOUNTS.doctor.password, 10),
    patient: await bcrypt.hash(DEMO_ACCOUNTS.patient.password, 10),
  };

  await db.transaction(async (tx) => {
    /* ------------------------------ users ------------------------------- */
    await tx.insert(users).values({ email: DEMO_ACCOUNTS.admin.email, passwordHash: hash.admin, role: "admin", firstName: "Clinic", lastName: "Administrator", phone: "+1 212 555 0100" });

    const specRows = await tx.insert(specializations).values(SPECIALIZATIONS.map(([name, description]) => ({ name, description }))).returning();
    const specId = (name: string) => specRows.find((s) => s.name === name)!.id;

    const treatmentRows = await tx
      .insert(treatments)
      .values(TREATMENTS.map((t) => ({ name: t.name, category: t.category, description: t.description, durationMinutes: t.duration, price: String(t.price), slug: t.slug, tagline: t.tagline, durationLabel: t.label, sessions: t.sessions, downtime: t.downtime, imageUrl: `/images/site/${t.img}.jpg`, isFeatured: t.featured })))
      .returning();
    const treatmentByKey = new Map(TREATMENTS.map((t, i) => [t.key, treatmentRows[i]]));

    const doctorUsers = await tx
      .insert(users)
      .values(DOCTORS.map((d) => ({ email: d.email, passwordHash: hash.doctor, role: "doctor" as const, firstName: d.first, lastName: d.last, phone: d.phone })))
      .returning({ id: users.id });
    const doctorRows = await tx
      .insert(doctors)
      .values(DOCTORS.map((d, i) => ({
        userId: doctorUsers[i].id, specializationId: specId(d.spec), qualifications: d.quals, experienceYears: d.exp, bio: d.bio,
        consultationFee: String(d.fee), photoUrl: d.photo.startsWith("/") ? d.photo : `/images/doctors/${d.photo}.jpg`, slotDuration: d.grid, rating: d.rating.toFixed(1), reviewCount: d.reviews,
      })))
      .returning({ id: doctors.id });

    await tx.insert(doctorTreatments).values(DOCTORS.flatMap((d, i) => d.treatments.map((k) => ({ doctorId: doctorRows[i].id, treatmentId: treatmentByKey.get(k)!.id }))));
    await tx.insert(doctorSchedules).values(
      DOCTORS.flatMap((d, i) => Object.entries(d.schedule).flatMap(([dow, blocks]) => blocks.map(([startTime, endTime]) => ({ doctorId: doctorRows[i].id, dayOfWeek: Number(dow), startTime, endTime })))),
    );

    const today = clinicNow().date;
    await tx.insert(doctorUnavailableDates).values([
      { doctorId: doctorRows[0].id, date: addDays(today, 9), reason: "Dermatology conference" },
      { doctorId: doctorRows[0].id, date: addDays(today, 10), reason: "Dermatology conference" },
      { doctorId: doctorRows[1].id, date: addDays(today, 6), reason: "Annual leave" },
      { doctorId: doctorRows[4].id, date: addDays(today, 15), reason: "Training day" },
    ]);

    const patientUsers = await tx
      .insert(users)
      .values(PATIENTS.map(([firstName, lastName, email], i) => ({ email, passwordHash: hash.patient, role: "patient" as const, firstName, lastName, phone: `+1 646 555 01${String(10 + i).padStart(2, "0")}` })))
      .returning({ id: users.id, firstName: users.firstName, lastName: users.lastName, phone: users.phone, email: users.email });
    const patientRows = await tx
      .insert(patients)
      .values(patientUsers.map((u, i) => ({ userId: u.id, gender: PATIENTS[i][3], dateOfBirth: `${1978 + ((i * 3) % 24)}-${String(1 + (i % 12)).padStart(2, "0")}-${String(3 + i * 2).padStart(2, "0")}`, address: `${100 + i * 7} West ${20 + i} Street, New York, NY` })))
      .returning({ id: patients.id });

    /* --------------------------- appointments --------------------------- */
    type Draft = { doctorIdx: number; patientIdx: number; treatmentKey: string; date: string; start: number; status: Status; reason: string | null };
    const drafts: Draft[] = [];
    const busyDoctor = new Map<string, [number, number][]>();
    const busyPatient = new Map<string, [number, number][]>();
    const overlaps = (list: [number, number][] | undefined, s: number, e: number) => (list ?? []).some(([a, b]) => s < b && e > a);

    const tryAdd = (doctorIdx: number, patientIdx: number, treatmentKey: string, date: string, start: number, status: Status) => {
      const dur = TREATMENTS.find((t) => t.key === treatmentKey)!.duration;
      const end = start + dur;
      const dKey = `${doctorIdx}:${date}`;
      const pKey = `${patientIdx}:${date}`;
      if (overlaps(busyDoctor.get(dKey), start, end) || overlaps(busyPatient.get(pKey), start, end)) return false;
      busyDoctor.set(dKey, [...(busyDoctor.get(dKey) ?? []), [start, end]]);
      busyPatient.set(pKey, [...(busyPatient.get(pKey) ?? []), [start, end]]);
      drafts.push({ doctorIdx, patientIdx, treatmentKey, date, start, status, reason: pick(REASONS) });
      return true;
    };

    const gridStarts = (d: (typeof DOCTORS)[number], date: string, treatmentKey: string) => {
      const dur = TREATMENTS.find((t) => t.key === treatmentKey)!.duration;
      const out: number[] = [];
      for (const [s, e] of d.schedule[dayOfWeek(date)] ?? []) {
        for (let m = toMinutes(s); m + dur <= toMinutes(e); m += d.grid) out.push(m);
      }
      return out;
    };

    const now = clinicNow();
    const randomStatus = (past: boolean): Status => {
      const r = rand();
      if (past) return r < 0.74 ? "completed" : r < 0.88 ? "cancelled" : r < 0.94 ? "no_show" : "rejected";
      return r < 0.4 ? "pending" : r < 0.93 ? "confirmed" : "cancelled";
    };

    for (let offset = -75; offset <= 18; offset++) {
      const date = addDays(today, offset);
      const past = offset < 0;
      DOCTORS.forEach((d, di) => {
        if (!d.schedule[dayOfWeek(date)]) return;
        const count = past ? (rand() < 0.62 ? 1 + Math.floor(rand() * 3) : 0) : rand() < 0.45 ? 1 + Math.floor(rand() * 2) : 0;
        for (let n = 0; n < count; n++) {
          const key = pick(d.treatments);
          let starts = gridStarts(d, date, key);
          if (offset === 0) starts = starts.filter((s) => s > now.minutes + 60);
          if (!starts.length) continue;
          const patientIdx = rand() < 0.02 ? 0 : 1 + Math.floor(rand() * (PATIENTS.length - 1));
          tryAdd(di, patientIdx, key, date, pick(starts), randomStatus(past));
        }
      });
    }

    // Guarantee a lively demo for the demo patient (Olivia) and demo doctor (Dr. Marchetti)
    const demoDoctor = DOCTORS[0];
    let added = 0;
    for (let offset = 1; offset <= 25 && added < 3; offset++) {
      const date = addDays(today, offset);
      if (!demoDoctor.schedule[dayOfWeek(date)] || added >= 3) continue;
      const key = added === 1 ? "laser" : "facial";
      const starts = gridStarts(demoDoctor, date, key).filter((s) => s >= 10 * 60);
      if (starts.length && tryAdd(0, 0, key, date, starts[Math.min(2 + added, starts.length - 1)], added === 1 ? "pending" : "confirmed")) added++;
    }
    for (const [i, key, status] of [[0, "facial", "completed"], [0, "inject", "completed"], [2, "inject", "cancelled"]] as const) {
      for (let offset = -9 - i * 12; offset > -60; offset--) {
        const date = addDays(today, offset);
        const doctorIdx = i === 2 ? 2 : 0;
        if (!DOCTORS[doctorIdx].schedule[dayOfWeek(date)]) continue;
        const starts = gridStarts(DOCTORS[doctorIdx], date, key);
        if (starts.length && tryAdd(doctorIdx, 0, key, date, starts[1 % starts.length], status)) break;
      }
    }
    if (DOCTORS[0].schedule[dayOfWeek(today)]) {
      const starts = gridStarts(DOCTORS[0], today, "facial").filter((s) => s > now.minutes + 45);
      let c = 0;
      for (const s of starts) {
        if (c >= 2) break;
        if (tryAdd(0, 1 + c * 2, c === 0 ? "facial" : "laser", today, s, c === 0 ? "confirmed" : "pending")) c++;
      }
    }

    const usedRefs = new Set<string>();
    const makeRef = () => {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      for (;;) {
        let r = "CLN-";
        for (let i = 0; i < 6; i++) r += alphabet[Math.floor(rand() * alphabet.length)];
        if (!usedRefs.has(r)) return (usedRefs.add(r), r);
      }
    };

    const treatmentOf = (key: string) => treatmentByKey.get(key)!;
    const inserted: { id: number; status: Status; createdBy: number; date: string }[] = [];
    for (let i = 0; i < drafts.length; i += 150) {
      const chunk = drafts.slice(i, i + 150);
      const rows = await tx
        .insert(appointments)
        .values(chunk.map((a) => {
          const t = treatmentOf(a.treatmentKey);
          const u = patientUsers[a.patientIdx];
          return {
            reference: makeRef(), patientId: patientRows[a.patientIdx].id, doctorId: doctorRows[a.doctorIdx].id, treatmentId: t.id,
            appointmentDate: a.date, startTime: toHHMM(a.start), endTime: toHHMM(a.start + t.durationMinutes), status: a.status,
            patientName: `${u.firstName} ${u.lastName}`, patientPhone: u.phone ?? "", patientEmail: u.email, reason: a.reason, price: t.price,
            cancelledBy: a.status === "cancelled" ? (rand() < 0.6 ? "patient" : "doctor") : a.status === "rejected" ? "doctor" : null,
            cancellationReason: a.status === "cancelled" ? "Schedule conflict" : a.status === "rejected" ? "Doctor unavailable at this time" : null,
          };
        }))
        .returning({ id: appointments.id, status: appointments.status });
      rows.forEach((r, idx) => inserted.push({ id: r.id, status: r.status, createdBy: patientUsers[chunk[idx].patientIdx].id, date: chunk[idx].date }));
    }

    for (let i = 0; i < inserted.length; i += 400) {
      await tx.insert(appointmentStatusHistory).values(
        inserted.slice(i, i + 400).flatMap((a) => {
          const rows: (typeof appointmentStatusHistory.$inferInsert)[] = [{ appointmentId: a.id, fromStatus: null, toStatus: "pending", changedBy: a.createdBy, note: "Appointment requested by patient" }];
          if (a.status !== "pending") rows.push({ appointmentId: a.id, fromStatus: "pending", toStatus: a.status === "completed" || a.status === "no_show" ? "confirmed" : a.status, changedBy: doctorUsers[0].id, note: null });
          if (a.status === "completed" || a.status === "no_show") rows.push({ appointmentId: a.id, fromStatus: "confirmed", toStatus: a.status, changedBy: doctorUsers[0].id, note: null });
          return rows;
        }),
      );
    }

    /* ---------------------- notifications & messages -------------------- */
    const demoAppt = inserted.find((a, i) => drafts[i].patientIdx === 0 && (a.status === "confirmed" || a.status === "pending") && a.date >= today);
    await tx.insert(notifications).values([
      { userId: patientUsers[0].id, appointmentId: demoAppt?.id ?? null, type: "appointment", title: "Welcome to Clinova", message: "Your patient account is ready. Book your next treatment in just a few steps." },
      ...(demoAppt ? [{ userId: patientUsers[0].id, appointmentId: demoAppt.id, type: "appointment", title: "Appointment update", message: "Your upcoming appointment has been scheduled. Check your appointments for the details." }] : []),
      { userId: doctorUsers[0].id, type: "appointment", title: "New appointment request", message: "A patient has requested an appointment. Review your pending requests." },
    ]);
    await tx.insert(contactMessages).values([
      { name: "Hannah Brooks", email: "hannah.brooks@example.com", phone: "+1 917 555 0188", subject: "Question about laser treatments", message: "Hello, I would like to know how many sessions are typically needed for scar treatment and whether there is downtime." },
      { name: "Marco Bellini", email: "marco.bellini@example.com", subject: "Corporate wellness packages", message: "We are a team of 40 and are interested in group health check-ups. Could someone from your team get in touch?" },
      { name: "Priscilla Adeyemi", email: "priscilla.a@example.com", phone: "+1 347 555 0121", subject: "Insurance enquiry", message: "Do you accept private insurance for physiotherapy sessions? Thank you in advance for your help." },
    ]);
  });
}

/** Seeds demo data on first start when the database is empty. */
export async function ensureSeeded() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  if (n > 0) return false;
  console.log("[seed] Empty database detected – inserting CLINOVA demo data…");
  await seedDatabase();
  console.log("[seed] Done.");
  return true;
}
