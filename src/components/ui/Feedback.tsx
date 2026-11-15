"use client";

import clsx from "clsx";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { statusLabel } from "@/utils/format";
import { Button } from "./Button";

export function Skeleton({ className, light }: { className?: string; light?: boolean }) {
  return <div aria-hidden className={clsx("rounded-xl", light ? "skeleton-light" : "skeleton", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx("h-5 w-5 animate-spin text-mint-400", className)} />;
}

export function EmptyState({ title, message, action, icon, light }: { title: string; message?: string; action?: ReactNode; icon?: ReactNode; light?: boolean }) {
  return (
    <div className={clsx("flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center", light ? "border-fg/15" : "border-fg/10")}>
      <div className={clsx("mb-4 flex h-14 w-14 items-center justify-center rounded-full", light ? "bg-fg/5 text-teal-deep" : "bg-fg/[0.05] text-mint-400")}>
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className={clsx("font-serif text-xl", light ? "text-fg" : "text-fg")}>{title}</h3>
      {message && <p className={clsx("mt-2 max-w-md text-sm leading-relaxed", light ? "text-fog-dark" : "text-fog")}>{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, light }: { message: string; onRetry?: () => void; light?: boolean }) {
  return (
    <div className={clsx("flex flex-col items-center rounded-2xl border px-6 py-12 text-center", light ? "border-rose-500/20 bg-rose-50" : "border-rose-400/20 bg-rose-500/[0.06]")}>
      <AlertTriangle className="mb-3 h-7 w-7 text-rose-400" />
      <p className={clsx("max-w-md text-sm", light ? "text-rose-900" : "text-rose-200")}>{message}</p>
      {onRetry && (
        <Button variant={light ? "outlineLight" : "outline"} size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

const statusTone: Record<string, string> = {
  pending: "bg-amber-400/10 text-amber-300 ring-amber-300/25",
  confirmed: "bg-mint-400/10 text-mint-300 ring-mint-300/25",
  completed: "bg-sky-400/10 text-sky-300 ring-sky-300/25",
  cancelled: "bg-rose-400/10 text-rose-300 ring-rose-300/25",
  rejected: "bg-rose-400/10 text-rose-300 ring-rose-300/25",
  no_show: "bg-zinc-400/10 text-zinc-300 ring-zinc-300/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset", statusTone[status] ?? statusTone.pending)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}
