import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Media";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-mint-500/15 blur-[120px]" />
      <div className="absolute right-6 top-6"><ThemeToggle /></div>
      <div className="relative">
        <div className="mb-10 flex justify-center"><Logo /></div>
        <p className="eyebrow text-mint-400">Error 404</p>
        <h1 className="mt-6 font-serif text-[clamp(3.5rem,11vw,8rem)] leading-[0.95]">
          Page <span className="italic text-mint-400">not found</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-lg text-fog">The page you're looking for may have moved or no longer exists. Let's get you back to better health.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button href="/" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>Back to home</Button>
          <Button href="/dashboard/book" variant="outline" size="lg">Book appointment</Button>
        </div>
      </div>
    </main>
  );
}
