import type { ReactNode } from "react";

/** Shown while a server-rendered page is streaming in (route transitions). Mirrors the page rhythm. */
export default function PublicLoading({ children }: { children?: ReactNode }) {
  void children;
  return (
    <div aria-busy="true" aria-live="polite" className="pt-20">
      <span className="sr-only">Loading page…</span>
      <section className="pb-16 pt-32 lg:pb-20 lg:pt-44">
        <div className="container-site flex flex-col items-center text-center">
          <div className="skeleton h-6 w-36 rounded-full" />
          <div className="skeleton mt-8 h-[clamp(2.4rem,5.2vw,4.75rem)] w-[min(90%,44rem)] rounded-2xl" />
          <div className="skeleton mt-4 h-[clamp(2rem,4vw,3.4rem)] w-[min(70%,30rem)] rounded-2xl" />
          <div className="skeleton mt-8 h-5 w-[min(80%,28rem)] rounded-full" />
        </div>
      </section>
      <section className="container-site pb-32">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="skeleton aspect-[4/3] rounded-[var(--radius-card)]" />
          <div className="skeleton aspect-[4/3] rounded-[var(--radius-card)]" />
        </div>
      </section>
    </div>
  );
}
