import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/** Installable web app manifest – "Add to Home Screen" on phones. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.full,
    short_name: BRAND.name,
    description: "Doctor-led aesthetic and skin clinic: treatments, live availability and online booking.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fdf7ef",
    theme_color: "#633b2c",
    categories: ["health", "medical", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Book a consultation", short_name: "Book", url: "/contact#book", description: "Request a consultation" },
      { name: "Skin quiz", short_name: "Quiz", url: "/skin-quiz", description: "Find your best-matched treatment" },
      { name: "My appointments", short_name: "Appointments", url: "/dashboard/appointments" },
    ],
  };
}
