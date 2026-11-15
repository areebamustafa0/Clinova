# Clinova — Doctor-led Clinic & Appointment System

A full-stack clinic appointment platform with a dark, editorial "private clinic" aesthetic.
Patients explore treatments and doctors and book real, conflict-free appointments; doctors manage
schedules and requests; administrators run the whole clinic with live reports.

> **Stack note.** This build runs on the platform's runtime: **Next.js 16 (App Router, React 19)** with
> REST route handlers, **PostgreSQL** and **Drizzle ORM**. Everything else from the brief is implemented as
> specified — Tailwind CSS, Framer Motion, Lucide icons, Axios, JWT, bcrypt, Zod validation, rate limiting,
> transactional double-booking prevention, three role-based portals. The layered backend
> (`routes → controllers → services → models`) is mapped onto Next.js conventions (see *Architecture*).
> The relational design is identical to what a MySQL schema would use (PKs, FKs, unique constraints, indexes).

---

## Quick start

```bash
npm install
cp .env.example .env            # then edit DATABASE_URL / JWT_SECRET
npx drizzle-kit push --config drizzle.config.json   # create tables
npx tsx src/db/run-seed.ts      # demo data (also auto-runs on first server start if DB is empty)
npm run dev                     # http://localhost:3000
```

Production: `npm run build && npm run start`. Health check: `GET /api/health`.
Re-seed from scratch: `npx tsx src/db/run-seed.ts --reset`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | **Required in production.** Long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `CLINIC_TIMEZONE` | Timezone used for slot generation and "past time" checks (default `America/New_York`) |
| `COOKIE_SECURE` | Set `true` when served over HTTPS |

### Demo accounts (development only — remove/change before production)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@clinova.com` | `Admin@123` |
| Doctor (Dr. Layla Haddad) | `doctor@clinova.com` | `Doctor@123` |
| Patient (Olivia Bennett) | `patient@clinova.com` | `Patient@123` |

All other seeded doctors use `firstname.lastname@clinova.com` / `Doctor@123`; the other 11 patients use `…@example.com` / `Patient@123`.
The login page has one-click buttons that fill these credentials.

Seed data: 8 doctors with different schedules (split shifts, 15/30-minute grids, days off), 9 treatments,
12 patients, ~450 appointments across all statuses (past 75 days + next 18 days), blocked dates, notifications and contact messages.

---

## Features

**Public site** – Home (hero, services, philosophy, specialists carousel, why-us, live stats, schedule widget, testimonials, CTA),
About, Treatments (search + category filters + detail page), Doctors (search + specialty filters + detail page with live availability),
Contact (stored in DB, OpenStreetMap map), responsive navigation with mobile menu.

**Patient portal** (`/dashboard`) – overview stats, **7-step booking flow** (treatment → doctor → date → time → details → review → confirmation
with `.ics` calendar download), my appointments (upcoming/history, details with status timeline, cancel, request reschedule), profile + change password, notifications bell.

**Doctor portal** (`/doctor`) – today / upcoming / pending / completed / cancelled views, accept or reject requests, update statuses,
patient record for their own patients, availability editor (working days, multiple blocks per day, slot interval, unavailable dates).

**Admin dashboard** (`/admin`) – live KPIs and charts, doctor CRUD (+ availability editor, activate/deactivate), patient search & account management,
appointment management (filter by date range / doctor / patient / status; confirm, cancel, reschedule), treatment CRUD, reports
(daily / weekly / monthly, status breakdown, popular treatments, doctor statistics, revenue), contact messages inbox.

## Booking rules (enforced server-side)

* Slots come from the doctor's weekly schedule blocks, stepped by the doctor's slot interval; each slot spans the **treatment duration** and must fit inside a block.
* Unavailable dates return no slots. Past dates/times and anything less than 30 minutes away are rejected. Bookings open 90 days ahead.
* A doctor cannot be double-booked: bookings run inside a **transaction guarded by a Postgres advisory lock** (per doctor + day, and per patient),
  availability is **re-validated inside the transaction**, and a **partial unique index** on `(doctor_id, appointment_date, start_time)` is the last line of defence.
  Overlaps are detected by time range, not just identical start times.
* A patient cannot hold two overlapping appointments (with any doctor).
* New bookings are `pending` until the doctor accepts. `cancelled` and `rejected` appointments immediately release their slot.
* Patients may cancel / request a reschedule up to 2 hours before the start, and reschedule at most twice online. A patient reschedule returns the
  appointment to `pending` for re-confirmation. **The old slot is only released after the new slot has been validated** (single transaction, same row update).
* Doctors/admins can move appointments directly; completing / no-show is only possible on or after the appointment day.

## Security

bcrypt (cost 12) password hashing · JWT in an `httpOnly`, `SameSite=Lax` cookie (also accepted as `Authorization: Bearer`) · logout and password change bump a per-user
`token_version`, invalidating every previously issued token · role-based authorization on every endpoint, with ownership checks (doctors only see their own
appointments/patients, patients only their own) · Zod validation on every body · parameterised queries via Drizzle · in-memory rate limiting on login, register,
booking, reschedule, password and contact endpoints · generic error responses (no stack traces) · secrets only from environment variables.

---

## Architecture

```
src/
  app/                    Next.js App Router
    (public)/             marketing site (layout = navbar + footer, template = page transitions)
    (auth)/               login, register
    dashboard/ doctor/ admin/    role portals (layout = DashboardShell + role guard)
    api/**/route.ts       REST controllers (thin: auth → validate → call service → JSON)
  components/             ui/ (Button, Form, Modal, Feedback, Charts, Media) · layout/ · cards/ · booking/ · appointments/ · schedule/ · profile/
  context/                AuthContext, ToastContext
  hooks/                  useFetch (axios)
  lib/                    http (axios client), api (errors/response helpers), auth (JWT/bcrypt/session), rate-limit, time
  services/               business logic: availability, appointments, doctors, treatments, patients, reports, notifications, auth
  validators/             Zod schemas
  db/                     schema.ts (Drizzle models), seed.ts, run-seed.ts, index.ts
  utils/ types/           formatting helpers and shared types
database/schema.sql       generated SQL schema (pg_dump) for reference
```

**Tables:** `users`, `patients`, `doctors`, `specializations`, `treatments`, `doctor_treatments`, `doctor_schedules`, `doctor_unavailable_dates`,
`appointments`, `appointment_status_history`, `notifications`, `contact_messages` — with primary/foreign keys, unique constraints, indexes and created/updated timestamps.

---

## API reference

Base URL `/api`. Responses are `{ "success": true, "data": …, "meta"?: … }` or `{ "success": false, "error": { "message", "details"? } }`.
Status codes: `200/201` success · `400` bad request · `401` unauthenticated · `403` forbidden · `404` not found · `409` conflict (e.g. slot taken) · `422` validation / business rule · `429` rate limited.

### Auth
| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Create patient account (sets cookie, returns `token`) |
| POST | `/auth/login` | public | Sign in (rate limited) |
| POST | `/auth/logout` | any | Clear cookie + revoke all issued tokens |
| GET | `/auth/me` | public | Current user or `null` |
| PATCH | `/auth/me` | auth | Update profile (name, phone, patient details) |
| POST | `/auth/password` | auth | Change password |

### Catalogue
| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/doctors` | public | List (`search`, `specializationId`, `treatmentId`; admin: `all=1`) |
| GET | `/doctors/:id` | public | Doctor details with treatments |
| POST | `/doctors` | admin | Create doctor + login account |
| PATCH | `/doctors/:id` | admin | Update doctor (fee, bio, treatments, `isActive`…) |
| DELETE | `/doctors/:id` | admin | Delete, or deactivate if appointment history exists |
| GET | `/specializations` | public | List specializations |
| GET | `/treatments` | public | List (`category`, `search`, `featured=1`, `doctorId`; admin `all=1`); `meta.categories` |
| GET | `/treatments/:id` | public | Treatment details |
| POST / PATCH / DELETE | `/treatments[/:id]` | admin | CRUD (delete deactivates if booked before) |

### Availability
| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/doctors/:id/schedule` | public | Weekly blocks, slot interval, upcoming unavailable dates |
| PUT | `/doctors/:id/schedule` | doctor (own) / admin | Replace schedule `{ slotDuration?, days:[{dayOfWeek, blocks:[{startTime,endTime}]}] }` |
| POST | `/doctors/:id/unavailable` | doctor (own) / admin | Block a date `{ date, reason? }` |
| DELETE | `/doctors/:id/unavailable?id=` | doctor (own) / admin | Unblock a date |
| GET | `/availability/slots?doctorId&treatmentId&date[&excludeAppointmentId]` | public | All slots for a day with `available` flag |
| GET | `/availability/dates?doctorId&treatmentId&month=YYYY-MM` | public | Days of the month that still have free slots |
| GET | `/availability/next?treatmentId[&doctorId&limit]` | public | Soonest free slots per doctor for a treatment (rate limited) |

### Appointments
| Method | Path | Access | Description |
| --- | --- | --- | --- |
| POST | `/appointments` | patient | Book `{ doctorId, treatmentId, date, startTime, patientName, patientPhone, patientEmail?, reason?, notes? }` |
| GET | `/appointments` | auth | Role-scoped list (`status` csv, `from`, `to`, `doctorId`*, `patientId`, `search`, `limit`, `order`) — *admin only |
| GET | `/appointments/summary` | auth | Role-scoped counters |
| GET | `/appointments/:id` | owner / doctor / admin | Details + status history |
| POST | `/appointments/:id/cancel` | owner / doctor / admin | Cancel `{ reason? }` and release slot |
| POST | `/appointments/:id/reschedule` | owner / doctor / admin | Move `{ date, startTime, reason? }` (validated before the old slot is released) |
| PATCH | `/appointments/:id/status` | doctor (own) / admin | `confirmed`, `rejected`, `completed`, `no_show`, `cancelled` |

### Admin, reports & misc
| Method | Path | Access | Description |
| --- | --- | --- | --- |
| GET | `/patients` | admin | Search patients (`search`) |
| GET | `/patients/:id` | admin / doctor (own patients) | Patient record + appointments |
| PATCH | `/patients/:id` | admin | Edit / activate / deactivate |
| GET | `/reports/stats` | admin | Dashboard KPIs |
| GET | `/reports/appointments` | admin | Daily/weekly/monthly series, status breakdown, popular treatments, doctor stats |
| GET | `/reports/treatments` | admin | Popular treatments |
| GET / POST | `/notifications` | auth | List / mark all read |
| GET / POST | `/contact` | admin / public | Inbox / submit contact form (rate limited) |
| PATCH / DELETE | `/contact/:id` | admin | Mark read / delete |
| GET | `/stats` | public | Non-sensitive clinic numbers for the marketing site |
| GET | `/health` | public | Database health check |

---


## Design — editorial "espresso / cream / bronze"

The public site takes its editorial cues from a reference clinic site: Hedvig Letters Serif + Manrope, warm cream/sand surfaces, espresso text, bronze accents, cocoa panels, a
scroll-linked hero with a treatment arc, an accordion treatment list, a before/after slider, a bento results grid and pill buttons with the arrow-swap hover.
Light and dark themes are both supported (system preference by default, toggle in the header, stored as `theme`).

**Images.** Every photo lives in `public/images/site/<slot>.jpg` (hero-poster, portrait-radiant, portrait-profile, facial-treatment, led-therapy, result-before,
result-after, doctor-portrait, …). Replace a file with your own using the *same file name* and the site updates – no code changes. Add `public/assets/hero-portrait.mp4`
(and/or `.webm`) to play a video in the hero's centre panel (the poster image shows until then). Set `PLACEHOLDER_BEFORE_FILTER = false` in
`src/components/site/BeforeAfter.tsx` once real before/after photos are in place.

**Behaviour parity with the reference** – inertial smooth scrolling (Lenis, `lerp 0.1`, disabled on touch / reduced motion), a header that hides on scroll-down and returns on
scroll-up, a clip-path curtain mobile menu with masked link reveals, a hero that opens with a clip-path animation and scales/fades on scroll, a treatment arc that fans in,
word-by-word scroll-linked statement, clip-path + parallax image frames, staggered reveal groups, and the exact icon set (1.5 stroke) in `src/components/site/icons.tsx`.

**Photography.** The 28 photographs and the hero video in `public/images/site` and `public/assets` were fetched from the reference site at the owner's request, resized with `sharp`
(max 2000 px, progressive JPEG) and given tiny blur placeholders (`src/lib/image-meta.ts`) so images fade in like the reference. Make sure you hold the rights to publish them;
swap any file (same name) for your own picture and re-run the one-liner in this README's history or simply keep the existing blur.

**Enhancements beyond the reference** – live *Next available appointments* (home, each treatment, each doctor; powered by `GET /api/availability/next`) that deep-links into the booking
flow with doctor, treatment, date and time pre-selected · filterable / searchable / sortable treatments · editorial Doctors list and profile pages with working hours · count-up statistics ·
trailing cursor ring · reading-progress bar · mobile booking bar · newsletter sign-up (lands in Admin → Messages) · map on the contact page · sitemap, robots, Open Graph and JSON-LD
structured data · page transitions · blur-up image placeholders.

**v3 — beyond the reference.** A new editorial hero (aurora gradients, film grain, arched video portrait, pointer-parallax cards with the *live* next
available appointment and a rotating seal), a treatment marquee, a visual concern finder, a hover-preview treatment showcase, a scroll-drawn
"how it works" timeline and memberships. New features:

| Feature | Where |
| --- | --- |
| **Skin quiz** – 5 questions (concerns, skin type, downtime, approach, budget) scored against every treatment; top 3 matches with reasons, deep-links into booking, "email me my plan" | `/skin-quiz`, `src/components/site/SkinQuiz.tsx`, rules in `src/lib/site-extras.ts` |
| **Pricing & memberships** – monthly / annual toggle, three plans, interactive plan estimator (sessions × treatments, membership discount, quote by email) | `/pricing`, `PricingView.tsx`, `Plans.tsx` |
| **Command palette** – ⌘K / Ctrl K / `/` search across pages, treatments, doctors and actions (book, call, theme, portal) with keyboard navigation | `CommandPalette.tsx` |
| **Virtual concierge** – rule-based chat (no external AI) answering prices, treatments, hours, directions, booking and policy questions with live data and links | `Concierge.tsx` |
| **Live opening status** – open / closed computed in Europe/London, refreshed every minute | `OpenStatus.tsx` (header menu, footer, concierge) |
| Membership & treatment deep links pre-fill the consultation form (`/contact?plan=radiance#book`) | contact page |

The Medical Director is now **Dr. Layla Haddad** (MBBS, King's College London · MSc Aesthetic Medicine · BCAM member, 15 years). Run `node scripts/image-meta.cjs`
after replacing any photo in `public/images/site` to refresh the blur placeholders.

## Concierge & final design pass

**Ava, the clinic concierge** (`src/components/site/Concierge.tsx`, rules in `src/lib/concierge.ts`) is a rule-based assistant — no external AI service or key required.
It recognises ~20 intents (treatments, prices, memberships, live availability, opening hours, directions, cancellation, downtime, preparation, payment, gifting, safety, team)
and answers with live data: treatment cards with photo, duration and price; real bookable slots from `GET /api/availability/next`; deep links into booking.
Quick-reply chips guide the conversation, a typing indicator and timestamps give it a natural pace, and the transcript survives page loads (`localStorage`) with a
"start again" control. Sensitive or medical questions are never guessed at — the concierge asks for an email and files the conversation in **Admin → Messages** for the care team.
Escape closes the panel, focus returns to the launcher, and reduced-motion users get instant replies without animation.

**New home sections** – `EditorialSplit` (magazine-style promise and live price card), `ResultsGallery` (drag-to-compare feature plus a tiled grid with a keyboard-navigable lightbox),
`RewardsBand` (scrolling promises, membership prompt and proof points). Scripts to regenerate assets: `node scripts/favicons.cjs` and `node scripts/image-meta.cjs`.

## Finishing touches

- **Favicon & app icons** – generated from one vector source by `node scripts/favicons.cjs`: `src/app/favicon.ico` (16/32/48 px), `src/app/icon.svg`, `src/app/apple-icon.png` (180 px) and, for the installable app, `public/icon-192.png`, `icon-512.png` and a maskable 512 px icon. The same script renders the 1200×630 social card at `public/og.jpg`.
- **Web app manifest** (`/manifest.webmanifest`) with four icons, theme colours for light and dark, and shortcuts to booking, the skin quiz and appointments.
- **Per-page sharing metadata** – `src/lib/seo.ts` gives every marketing page its own canonical URL, Open Graph and Twitter card (default image `public/og.jpg`). Set `SITE_URL` in production so the URLs resolve to your domain.
- **Loading state** – `src/app/(public)/loading.tsx` shows a skeleton in the page rhythm while a server-rendered page streams in.
- **Back to top** – a round control with a reading-progress ring appears after the first screen (offset above the mobile booking bar).

**Brand.** Name, tagline, address, phone, e-mail and opening hours are defined once in `src/lib/brand.ts` (and the logo lock-up in `SiteHeader.tsx`). The favicon is
`src/app/icon.svg` + `favicon.ico` + `apple-icon.png`.

## Design system (dashboards)

**Light & dark mode** – a toggle in the website header, auth pages and every dashboard switches the whole app between a dark (default) and light theme. The choice is stored in `localStorage` and applied before first paint (no flash). All colours are CSS variables selected by `data-scheme` on `<html>`; sections such as the hero or the final CTA pin their own scheme with `data-scheme` so they stay dark in both modes.

Near-black teal backgrounds (`ink-*`), mint accent (`mint-*`) with deep-teal buttons on light sections, Playfair Display headings with Inter body text,
glass panels, hairline borders, generous whitespace and restrained motion (Framer Motion entrance / scroll reveals, reduced-motion respected).
Photography: generated hero/interior images plus Pexels stock portraits and treatment photos stored in `public/images`.
"# Clinova" 
"# Clinova" 
