/** Single place to change the clinic's name, contact details and image slots. */
export const BRAND = {
  name: "Clinova",
  suffix: "",
  full: "Clinova",
  tagline: "Advanced skin treatments, thoughtfully tailored to you.",
};

/** Public origin used for canonical URLs, the sitemap and structured data (set SITE_URL / NEXT_PUBLIC_SITE_URL in production). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const CLINIC = {
  address: ["27 Linden Place", "Marylebone, London W1U"],
  addressLine: "27 Linden Place, Marylebone, London W1U",
  phone: "+44 20 7946 0123",
  phoneHref: "tel:+442079460123",
  email: "hello@clinova.clinic",
  hours: [
    ["Mon – Fri", "9:00 – 19:00"],
    ["Saturday", "10:00 – 17:00"],
    ["Sunday", "Closed"],
  ] as [string, string][],
};

/**
 * Every photograph on the public site lives in /public/images/site/<slot>.jpg.
 * Replace a file (same name) to swap the picture – no code changes needed.
 * The hero video is optional: add /public/assets/hero-portrait.mp4 (and .webm) and it plays over hero-poster.jpg.
 */
export const img = (slot: string) => `/images/site/${slot}.jpg`;
