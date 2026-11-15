/**
 * Rule-based "Ava" concierge: intent matching, slot filling and answer composition.
 * Pure functions with no I/O, so the UI stays thin and every answer can be tested with live data.
 */
import type { Treatment } from "@/types";
import { CLINIC } from "@/lib/brand";
import { PLANS } from "@/lib/site-extras";

export type Link = { label: string; href: string };
export type Intent =
  | "greet"
  | "thanks"
  | "bye"
  | "treatment"
  | "price"
  | "membership"
  | "book"
  | "hours"
  | "location"
  | "cancel"
  | "downtime"
  | "recommend"
  | "doctors"
  | "safety"
  | "prep"
  | "payment"
  | "gift"
  | "contact"
  | "smalltalk"
  | "unknown";

export type Reply = {
  text: string;
  links?: Link[];
  treatment?: { id: number; name: string; slug: string | null; price: number; durationLabel: string | null; downtime: string | null; imageUrl: string | null };
  offers?: { doctor: string; doctorId: number; date: string; slots: string[] }[];
  chips?: string[];
  handoff?: boolean;
};

const KEYWORDS: Record<string, string[]> = {
  "facial-treatments": ["facial", "glow", "dull", "congest", "pores", "cleanse", "extraction"],
  acne: ["acne", "breakout", "spot", "pimple", "blemish", "congested", "oily"],
  pigmentation: ["pigment", "melasma", "dark spot", "sun spot", "sunspot", "uneven tone", "freckle"],
  "laser-treatments": ["laser", "redness", "vessel", "resurfac", "rosacea", "scar", "texture"],
  "anti-aging": ["anti-aging", "anti aging", "ageing", "aging", "volume", "sagging", "jowl", "lift", "contour"],
  injectables: ["botox", "injectable", "wrinkle", "filler", "lip", "anti-wrinkle", "crow", "line"],
  "skin-boosters": ["booster", "profhilo", "hydrat", "dewy", "crepey", "thirsty", "dry"],
  "skin-rejuvenation": ["rejuven", "led", "radiance", "firm", "collagen", "brightness"],
};

/** Sensitive or medical questions are always escalated to a clinician. */
const MEDICAL = ["pregnan", "breastfeed", "allerg", "medication", "roaccutane", "isotretinoin", "diagnos", "infection", "reaction", "blood thinner", "keloid", "eczema", "psoriasis"];

const hasAny = (q: string, words: string[]) => words.some((w) => q.includes(w));

export function detect(qRaw: string): Intent {
  const q = ` ${qRaw.toLowerCase().trim()} `;
  const has = (...w: string[]) => hasAny(q, w);
  if (has("hello", " hi ", " hey ", "hiya", "good morning", "good afternoon")) return q.trim().length <= 14 ? "greet" : "smalltalk";
  if (has("thank", "cheers", "appreciate")) return "thanks";
  if (has("bye", "goodbye", "see you")) return "bye";
  if (has("gift", "voucher", "present")) return "gift";
  if (has("pay", "payment", "card", "finance", "instal", "deposit", "refund", "insurance")) return "payment";
  if (has("before my", "prepare", "prep", "aftercare", "after my", "avoid", "makeup", "sunbed", "sun exposure")) return "prep";
  if (has("cancel", "reschedul", "change my", "move my", "refund")) return "cancel";
  if (has("member", "subscription", "plan", "monthly")) return "membership";
  if (has("price", "cost", "how much", "£", "fee", "expensive", "cheap", "budget", "price list")) return "price";
  if (has("downtime", "recover", "red after", "swelling", "back to work", "time off")) return "downtime";
  if (has("which", "recommend", "suit", "best for", "right for", "quiz", "help me choose", "what should i")) return "recommend";
  if (has("doctor", "who", "team", "dermatolog", "nurse", "qualified", "treats me", "consultant")) return "doctors";
  if (has("safe", "pain", "hurt", "side effect", "risk", "suitable", "comfortable")) return "safety";
  if (has("book", "appointment", "availability", "available", "slot", "reserve", "next opening", "earliest", "free time")) return "book";
  if (has("open", "hour", "time", "close", "weekend", "saturday", "sunday", "today")) return "hours";
  if (has("where", "address", "location", "direction", "parking", "tube", "station", "map", "postcode", "nearest")) return "location";
  if (has("contact", "call", "phone", "email", "speak to", "human", "team member")) return "contact";
  if (MEDICAL.some((w) => q.includes(w))) return "safety";
  for (const words of Object.values(KEYWORDS)) if (has(...words)) return "treatment";
  return "unknown";
}

export function matchTreatment(qRaw: string, treatments: Treatment[]): Treatment | undefined {
  const q = ` ${qRaw.toLowerCase()} `;
  for (const [slug, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => q.includes(w))) {
      const t = treatments.find((x) => x.slug === slug);
      if (t) return t;
    }
  }
  return treatments.find((t) => q.includes(t.name.toLowerCase()));
}

const money = (n: number) => `£${n.toLocaleString("en-GB")}`;

export type LiveData = {
  treatments: Treatment[];
  offers?: { doctor: string; doctorId: number; date: string; slots: string[] }[];
  today: string;
};

/** Builds the concierge's reply from the question plus live data. */
export function reply(qRaw: string, data: LiveData): Reply {
  const q = qRaw.toLowerCase();
  const { treatments } = data;
  const intent = detect(qRaw);
  const cheapest = [...treatments].sort((a, b) => a.price - b.price)[0];
  const handoff: Link = { label: "Message the team", href: "/contact#book" };

  switch (intent) {
    case "greet":
      return {
        text: "Hello! I'm Ava, the clinic's virtual concierge. I can help with treatments, live availability, prices, memberships and getting here.",
        chips: ["What's available this week?", "Treatment prices", "Which treatment suits me?", "Opening hours"],
      };
    case "smalltalk":
      return { text: "Lovely to hear from you. What can I help with — a treatment question, booking, or something else?", chips: ["Book a visit", "Treatment prices", "Directions"] };
    case "thanks":
      return { text: "You're very welcome. Anything else I can help with?", chips: ["Book a visit", "Opening hours"] };
    case "bye":
      return { text: "Take care — we're here whenever you're ready. You can book online any time.", links: [{ label: "Book a consultation", href: "/contact#book" }] };
    case "treatment": {
      const t = matchTreatment(qRaw, treatments);
      if (!t) return { text: "Which treatment are you curious about? I can talk you through facials, rejuvenation, acne, pigmentation, laser, anti-aging, injectables or boosters.", chips: ["Facials", "Laser treatments", "Injectables", "Skin boosters"] };
      return {
        text: `${t.name}: ${t.description} Sessions take ${t.durationLabel ?? `${t.durationMinutes} min`}${t.sessions ? `, usually ${t.sessions} sessions` : ""}${t.downtime ? `, with ${t.downtime.toLowerCase()} downtime` : ""}. From ${money(t.price)}.`,
        treatment: { id: t.id, name: t.name, slug: t.slug, price: t.price, durationLabel: t.durationLabel, downtime: t.downtime, imageUrl: t.imageUrl },
        links: [{ label: `Book ${t.name.split(" ")[0]}`, href: `/dashboard/book?treatmentId=${t.id}` }, { label: "Read the details", href: `/treatments/${t.slug}` }],
        chips: ["Is there downtime?", "What does it cost?", "Book me in"],
      };
    }
    case "price": {
      const list = [...treatments].sort((a, b) => a.price - b.price).slice(0, 4).map((t) => `${t.name} from ${money(t.price)}`).join(" · ");
      return {
        text: `Prices start from ${cheapest ? money(cheapest.price) : "£150"}${cheapest ? ` (${cheapest.name})` : ""}. Some popular ones: ${list}. Memberships start at ${money(Math.min(...PLANS.map((p) => p.monthly)))} a month. Prices are shown in full before you book, and payment is taken at the clinic.`,
        links: [{ label: "Pricing & estimator", href: "/pricing" }, ...(cheapest ? [{ label: `Book ${cheapest.name}`, href: `/dashboard/book?treatmentId=${cheapest.id}` }] : [])],
        chips: ["Memberships", "Book a visit", "Do you take insurance?"],
      };
    }
    case "membership":
      return {
        text: `${PLANS.length} memberships: ${PLANS.map((p) => `${p.name} at ${money(p.monthly)}/month`).join(", ")}. Every plan includes a regular treatment and a discount on everything else, and annual billing gives you two months free.`,
        links: [{ label: "Compare memberships", href: "/pricing" }],
        chips: ["What's included?", "Can I cancel?"],
      };
    case "book": {
      const offers = (data.offers ?? []).slice(0, 2);
      if (offers.length) {
        return {
          text: "Here's the soonest we can see you, straight from the live diary. Choose a time and I'll take you to the booking form.",
          offers,
          links: [{ label: "Full calendar", href: "/dashboard/book" }],
        };
      }
      return {
        text: "You can book online in under two minutes with live availability, or send a consultation request and we'll call you back within one working day.",
        links: [{ label: "Book online", href: "/dashboard/book" }, { label: "Request a consultation", href: "/contact#book" }],
        chips: ["Opening hours", "What happens first?"],
      };
    }
    case "hours":
      return {
        text: `We're open ${CLINIC.hours.map(([d, h]) => `${d} ${h}`).join(", ")}. Appointments outside these hours may be possible for existing patients — just ask the team.`,
        links: [{ label: "Book a visit", href: "/contact#book" }],
        chips: ["Where are you?", "Book a visit"],
      };
    case "location":
      return {
        text: `We're at ${CLINIC.addressLine}. The nearest stations are Baker Street and Bond Street, both about a 7-minute walk. Paid parking is on Marylebone Lane.`,
        links: [{ label: "Map & directions", href: "/contact" }],
      };
    case "cancel":
      return {
        text: "You can cancel or reschedule online up to two hours before your appointment, free of charge, from your patient dashboard. The slot is released straight away for someone else.",
        links: [{ label: "My appointments", href: "/dashboard/appointments" }, { label: "I need to sign in", href: "/login" }],
      };
    case "downtime":
      return {
        text: "Most treatments need little recovery: facials none at all, injectables and boosters a day or so of mild redness, and resurfacing laser up to five days. Your clinician will explain exactly what to expect before you begin.",
        links: [{ label: "Explore treatments", href: "/treatments" }],
      };
    case "recommend":
      return {
        text: "The quickest way is our skin quiz: four questions about your skin, downtime, treatment comfort and budget, then we suggest your best-matched treatments with prices.",
        links: [{ label: "Take the skin quiz", href: "/skin-quiz" }],
        chips: ["Acne & breakouts", "Fine lines", "Dullness", "Pigmentation"],
      };
    case "doctors":
      return {
        text: "Every client is seen by a medical professional. The team is led by our Medical Director, a consultant aesthetic physician, working alongside a consultant dermatologist, an aesthetic nurse practitioner and laser specialists. Every plan starts with a consultation and a doctor signs off your treatment plan.",
        links: [{ label: "Meet the doctors", href: "/doctors" }],
      };
    case "safety":
      return {
        text: "Every plan starts with a medical consultation, so suitability, comfort and any risks are discussed before treatment. For anything specific — pregnancy, medication, allergies or a skin condition — it's best to speak with a clinician; I can pass your question to the team now.",
        links: [{ label: "Ask a clinician", href: "/contact#book" }],
        handoff: true,
      };
    case "prep":
      return {
        text: "For most treatments: arrive with clean skin, avoid alcohol for 24 hours and sunbeds or strong sun for a week. For injectables, avoid blood-thinning painkillers for a couple of days unless prescribed. You'll receive written aftercare after every visit.",
        links: [{ label: "Ask about my treatment", href: "/contact#book" }],
      };
    case "payment":
      return {
        text: "Prices are shown in full before booking and payment is taken at the clinic by card. Most treatments can be split into instalments with our finance partner for plans over £500 — ask the team when you book. Do check with your insurer about cover.",
        links: [{ label: "See pricing", href: "/pricing" }],
      };
    case "gift":
      return {
        text: "We offer gift vouchers for any value and can post a beautifully wrapped card. Send us a message with the amount and we'll arrange it — vouchers are valid for 12 months.",
        links: [{ label: "Request a voucher", href: "/contact#book" }],
      };
    case "contact":
      return {
        text: `You can reach the team on ${CLINIC.phone} or ${CLINIC.email}, or send a message and we'll reply within one working day.`,
        links: [{ label: "Contact the team", href: "/contact" }, { label: "Request a call back", href: "/contact#book" }],
      };
    default:
      return {
        text: `I'm not certain about that one, so I won't guess — the care team will know. Call ${CLINIC.phone} or send a message and we'll come back to you within one working day.`,
        links: [handoff],
        handoff: true,
      };
  }
}

/** Opening line, with the treatment count so the first message feels alive. */
export function greeting(treatments: Treatment[]): Reply {
  return {
    text: `Hello, I'm Ava — the clinic's virtual concierge. I can help with our ${treatments.length || 8} treatments, live availability, prices and directions. What would you like to know?`,
    chips: ["What's available this week?", "Treatment prices", "Which treatment suits me?", "Opening hours"],
  };
}
