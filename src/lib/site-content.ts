export const SLUG_ORDER = ["facial-treatments", "skin-rejuvenation", "acne", "pigmentation", "laser-treatments", "anti-aging", "injectables", "skin-boosters"];

export const sortTreatments = <T extends { slug: string | null }>(list: T[]): T[] =>
  [...list].sort((a, b) => {
    const ia = SLUG_ORDER.indexOf(a.slug ?? "");
    const ib = SLUG_ORDER.indexOf(b.slug ?? "");
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

export const TESTIMONIALS = [
  { quote: "The consultation alone was worth it. Nothing was rushed and nothing was pushed. My skin has never looked calmer.", name: "Sophie R.", treatment: "Skin Rejuvenation" },
  { quote: "After years of trying everything for my acne, I finally have a plan that works. The difference in six months is remarkable.", name: "Hannah M.", treatment: "Acne & Scarring" },
  { quote: "Subtle is exactly the word. Friends say I look rested. Nobody can tell I've had anything done.", name: "Claire D.", treatment: "Injectables" },
  { quote: "My pigmentation has faded more than I thought possible, and the aftercare advice was so clear.", name: "Priya K.", treatment: "Pigmentation" },
  { quote: "A beautiful clinic with genuinely expert people. I trust them completely with my skin.", name: "Olivia T.", treatment: "Skin Boosters" },
];

export const HOME_FAQS: [string, string][] = [
  ["How do I book a consultation?", "Book online through our consultation form or call the clinic. We'll confirm a time within one working day."],
  ["What happens during my first appointment?", "A calm, unhurried consultation with a clinician. We assess your skin, listen to your goals and outline a personal plan."],
  ["How do I know which treatment is right for me?", "You don't need to. Tell us what you'd like to change and we'll recommend the safest, most effective route."],
  ["Are treatments suitable for my skin type?", "We treat all skin types and tones, adjusting technology and settings to your skin."],
  ["How long does a treatment take?", "Most treatments take 30 to 60 minutes, and many fit easily into a lunch break."],
  ["Is there any downtime?", "Many treatments have little or none. We'll always explain recovery clearly before you begin."],
];

/** Concern groups for the treatments filter bar. */
export const GROUPS: { label: string; slugs: string[] }[] = [
  { label: "Medical skincare", slugs: ["facial-treatments", "acne", "pigmentation"] },
  { label: "Laser & energy", slugs: ["skin-rejuvenation", "laser-treatments"] },
  { label: "Injectables & anti-aging", slugs: ["anti-aging", "injectables", "skin-boosters"] },
];
