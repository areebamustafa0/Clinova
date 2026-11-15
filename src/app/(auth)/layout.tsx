import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Media";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="relative flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Clinova home"><Logo /></Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-fog transition hover:text-mint-300">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to website</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">{children}</div>
        <p className="text-xs text-fog-dark">© {new Date().getFullYear()} Clinova. Your information is encrypted and never shared.</p>
      </div>
      <div data-scheme="dark" className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/site/hero-poster.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[75%_20%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-900/30 to-ink-900/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-14">
          <p className="font-serif text-4xl italic leading-snug text-white">“The care is exceptional and the booking process is so easy.”</p>
          <p className="mt-5 text-sm text-white/70">— Ayesha Malik, Clinova patient</p>
        </div>
      </div>
    </div>
  );
}
