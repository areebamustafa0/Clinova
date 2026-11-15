import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { THEME_SCRIPT, ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { BRAND, SITE_URL } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND.full} — Doctor-led Aesthetic & Skin Clinic`, template: `%s — ${BRAND.full}` },
  description: "A doctor-led aesthetic and skin clinic. Advanced skin treatments and modern aesthetics, tailored by doctors for natural-looking results.",
  manifest: "/manifest.webmanifest",
  applicationName: BRAND.full,
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "default" },
  openGraph: { type: "website", siteName: BRAND.full, locale: "en_GB", images: [{ url: "/og.jpg", width: 1200, height: 630, alt: `${BRAND.full} — doctor-led skin clinic` }] },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf7ef" },
    { media: "(prefers-color-scheme: dark)", color: "#15100d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scheme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hedvig+Letters+Serif&family=Manrope:wght@300..800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
