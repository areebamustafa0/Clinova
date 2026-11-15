"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-400/10 text-rose-400">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="mt-8 font-serif text-5xl">Something went wrong</h1>
      <p className="mt-4 max-w-md text-fog">An unexpected error occurred. Please try again — if it keeps happening, contact our care team.</p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href="/" variant="outline">Go home</Button>
      </div>
    </main>
  );
}
