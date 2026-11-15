/** Content + rules for the skin quiz, concern finder, memberships and "how it works". */

export type Concern = { key: string; label: string; blurb: string; slot: string; weights: Record<string, number> };

export const CONCERNS: Concern[] = [
  { key: "glow", label: "Dullness & dehydration", blurb: "Tired, thirsty or lacklustre skin", slot: "facial-treatment", weights: { "facial-treatments": 3, "skin-boosters": 3, "skin-rejuvenation": 2 } },
  { key: "acne", label: "Acne & breakouts", blurb: "Active spots, congestion, oiliness", slot: "result-texture", weights: { acne: 4, "facial-treatments": 2, "laser-treatments": 1 } },
  { key: "pigmentation", label: "Pigmentation & dark spots", blurb: "Sun damage, melasma, uneven tone", slot: "ipl-laser", weights: { pigmentation: 4, "laser-treatments": 2, "skin-rejuvenation": 2 } },
  { key: "lines", label: "Fine lines & wrinkles", blurb: "Expression lines and early ageing", slot: "profiles-layered", weights: { injectables: 3, "anti-aging": 3, "skin-rejuvenation": 2, "laser-treatments": 1 } },
  { key: "volume", label: "Volume loss & contour", blurb: "Hollowing, laxity, softer jawline", slot: "profile-sculpt", weights: { "anti-aging": 4, injectables: 3, "skin-boosters": 1 } },
  { key: "texture", label: "Texture & scarring", blurb: "Enlarged pores, acne scars, roughness", slot: "laser-resurfacing", weights: { "laser-treatments": 4, acne: 2, "skin-rejuvenation": 2 } },
  { key: "redness", label: "Redness & sensitivity", blurb: "Flushing, visible vessels, reactivity", slot: "led-therapy", weights: { "laser-treatments": 3, "skin-rejuvenation": 2, "facial-treatments": 1 } },
];

/** downtime: 0 none · 1 minimal · 2 a few days · 3 up to a week. kind drives the "approach" filter. */
export const TRAITS: Record<string, { downtime: 0 | 1 | 2 | 3; kind: "skin" | "energy" | "injectable" }> = {
  "facial-treatments": { downtime: 0, kind: "skin" },
  "skin-rejuvenation": { downtime: 1, kind: "energy" },
  acne: { downtime: 2, kind: "skin" },
  pigmentation: { downtime: 1, kind: "energy" },
  "laser-treatments": { downtime: 3, kind: "energy" },
  "anti-aging": { downtime: 1, kind: "injectable" },
  injectables: { downtime: 1, kind: "injectable" },
  "skin-boosters": { downtime: 1, kind: "injectable" },
};

export type QuizOption = { value: string; label: string; hint?: string };
export type QuizStep = { key: "skin" | "downtime" | "approach" | "budget"; title: string; sub: string; options: QuizOption[] };

export const QUIZ_STEPS: QuizStep[] = [
  {
    key: "skin",
    title: "How would you describe your skin?",
    sub: "Pick the one that feels most like you on an average day.",
    options: [
      { value: "dry", label: "Dry", hint: "Feels tight, flaky or thirsty" },
      { value: "oily", label: "Oily", hint: "Shine and enlarged pores" },
      { value: "combination", label: "Combination", hint: "Oily T-zone, drier cheeks" },
      { value: "sensitive", label: "Sensitive", hint: "Reacts easily, prone to redness" },
      { value: "normal", label: "Balanced", hint: "Rarely gives you trouble" },
    ],
  },
  {
    key: "downtime",
    title: "How much downtime can you allow?",
    sub: "Some of the most effective treatments need a little recovery time.",
    options: [
      { value: "none", label: "None at all", hint: "Straight back to plans" },
      { value: "short", label: "A day or two", hint: "Mild redness is fine" },
      { value: "week", label: "Up to a week", hint: "Happy to plan around it" },
    ],
  },
  {
    key: "approach",
    title: "Which treatments are you open to?",
    sub: "Your doctor will only ever recommend what you need.",
    options: [
      { value: "gentle", label: "Gentle only", hint: "Facials and skincare — no needles or lasers" },
      { value: "no-needles", label: "No needles", hint: "Lasers and energy devices are fine" },
      { value: "open", label: "Open to everything", hint: "Including injectables, if right for me" },
    ],
  },
  {
    key: "budget",
    title: "What's your budget per session?",
    sub: "Helps us prioritise — plans can always be spread over time.",
    options: [
      { value: "low", label: "Up to £200" },
      { value: "mid", label: "£200 – £300" },
      { value: "high", label: "£300 and above" },
    ],
  },
];

export type Plan = { key: string; name: string; monthly: number; tagline: string; discount: number; features: string[]; featured?: boolean };

export const PLANS: Plan[] = [
  {
    key: "essential",
    name: "Essential",
    monthly: 95,
    tagline: "Maintain calm, healthy, balanced skin.",
    discount: 10,
    features: ["Monthly medical-grade facial", "10% off every treatment", "Priority online booking", "Personal skin plan, reviewed quarterly"],
  },
  {
    key: "radiance",
    name: "Radiance",
    monthly: 185,
    featured: true,
    tagline: "Our most-loved routine for visible glow.",
    discount: 15,
    features: ["Monthly facial or LED session", "A skin booster every quarter", "15% off every treatment", "Free rescheduling, any time", "Complimentary annual skin analysis"],
  },
  {
    key: "signature",
    name: "Signature",
    monthly: 320,
    tagline: "A fully bespoke, doctor-led programme.",
    discount: 20,
    features: ["Two treatments a month, your choice", "Quarterly review with the Medical Director", "20% off every treatment", "Same-week appointments", "Direct clinician message line"],
  },
];

export const JOURNEY = [
  { title: "Consultation", time: "45 min", text: "An unhurried assessment with a doctor: your history, your goals and a close look at your skin under clinical light." },
  { title: "Your plan", time: "Same day", text: "A written, costed plan with options, timelines and realistic expectations. No pressure and never any upselling." },
  { title: "Treatment", time: "30 – 60 min", text: "Evidence-based treatments delivered by medical professionals in calm, private suites designed around your comfort." },
  { title: "Aftercare", time: "Ongoing", text: "Clear written aftercare, a check-in after every treatment and direct access to your clinician between visits." },
];

export const PRICING_FAQS: [string, string][] = [
  ["Is the consultation charged?", "Your first consultation includes a complimentary skin analysis. If you go ahead with treatment on the day, the consultation fee is deducted from your treatment."],
  ["Can I pause or cancel a membership?", "Memberships run month to month after a three-month minimum. You can pause for up to two months a year, or cancel with 30 days' notice."],
  ["Do prices include aftercare?", "Yes. Every treatment includes written aftercare and a follow-up check-in with your clinician."],
  ["Do you offer payment plans?", "Treatment plans over £600 can be spread across three interest-free monthly payments."],
  ["Why are prices shown as 'from'?", "Your exact price depends on the area treated and the number of sessions. Your doctor confirms everything in writing before you begin."],
];
