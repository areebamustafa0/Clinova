import type { Metadata } from "next";
import { BRAND, SITE_URL } from "@/lib/brand";

const DESCRIPTION =
  "A doctor-led aesthetic and skin clinic in Marylebone. Advanced skin treatments and modern aesthetics, tailored by doctors for natural-looking results.";

/**
 * Page metadata helper: canonical URL, Open Graph and Twitter cards in one place.
 * Usage: export const metadata = pageMeta("Treatments", "Optional description");
 */
export function pageMeta(title?: string, description = DESCRIPTION, image = "/og.jpg"): Metadata {
  const full = title ? `${title} — ${BRAND.full}` : `${BRAND.full} — Doctor-led Aesthetic & Skin Clinic`;
  return {
    title: title ?? { absolute: full },
    description,
    alternates: { canonical: SITE_URL },
    openGraph: { title: full, description, siteName: BRAND.full, locale: "en_GB", type: "website", images: [{ url: image, width: 1200, height: 630, alt: BRAND.full }] },
    twitter: { card: "summary_large_image", title: full, description, images: [image] },
  };
}
