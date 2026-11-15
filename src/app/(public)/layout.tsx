import type { ReactNode } from "react";
import { BackToTop } from "@/components/site/BackToTop";
import { CommandPalette } from "@/components/site/CommandPalette";
import { Concierge } from "@/components/site/Concierge";
import { MobileBookBar } from "@/components/site/MobileBookBar";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { SiteCursor } from "@/components/site/SiteCursor";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { BRAND, CLINIC, SITE_URL } from "@/lib/brand";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  name: BRAND.full,
  url: SITE_URL,
  image: `${SITE_URL}/images/site/hero-poster.jpg`,
  telephone: CLINIC.phone,
  email: CLINIC.email,
  medicalSpecialty: "Dermatology",
  address: { "@type": "PostalAddress", streetAddress: CLINIC.address[0], addressLocality: "Marylebone, London", postalCode: "W1U", addressCountry: "GB" },
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "19:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "17:00" },
  ],
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "600" },
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-espresso focus:px-5 focus:py-3 focus:text-cream">
        Skip to content
      </a>
      <ScrollProgress />
      <SiteHeader />
      <div id="page">
        <main id="main">{children}</main>
        <SiteFooter />
      </div>
      <BackToTop />
      <MobileBookBar />
      <Concierge />
      <CommandPalette />
      <SiteCursor />
    </SmoothScroll>
  );
}
