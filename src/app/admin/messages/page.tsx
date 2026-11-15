"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, Mail, Phone, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";
import { useFetch } from "@/hooks/useFetch";
import { del, errorMessage, patch } from "@/lib/http";
import { formatDateTime } from "@/utils/format";

type Msg = { id: number; name: string; email: string; phone: string | null; subject: string; message: string; isRead: boolean; createdAt: string };

export default function AdminMessagesPage() {
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch<Msg[]>("/contact");
  const [remove, setRemove] = useState<Msg | null>(null);
  const [busy, setBusy] = useState(false);

  async function markRead(m: Msg) {
    try { await patch(`/contact/${m.id}`); refetch(); } catch (e) { toast.error(errorMessage(e)); }
  }
  async function doDelete() {
    if (!remove) return;
    setBusy(true);
    try { await del(`/contact/${remove.id}`); toast.success("Message deleted."); setRemove(null); refetch(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Messages" subtitle="Enquiries submitted through the website contact form." />
      {error ? <ErrorState message={error} onRetry={refetch} /> : loading && !data ? <Skeleton className="h-72" /> : data && data.length === 0 ? <EmptyState icon={<Mail className="h-6 w-6" />} title="No messages yet" message="New enquiries from the contact page will appear here." /> : (
        <ul className="space-y-4">
          {data?.map((m) => (
            <li key={m.id} className={clsx("panel p-6", !m.isRead && "border-mint-400/30")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-serif text-xl">{!m.isRead && <span className="h-2 w-2 rounded-full bg-mint-400" />}{m.subject}</p>
                  <p className="mt-1 text-sm text-fog">{m.name} · {formatDateTime(m.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  {!m.isRead && <Button size="sm" variant="subtle" icon={<Check className="h-3.5 w-3.5" />} onClick={() => markRead(m)}>Mark read</Button>}
                  <Button size="sm" variant="danger" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setRemove(m)}>Delete</Button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-fg/85">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-5 text-sm">
                <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="inline-flex items-center gap-2 text-mint-300 hover:underline"><Mail className="h-4 w-4" />{m.email}</a>
                {m.phone && <a href={`tel:${m.phone}`} className="inline-flex items-center gap-2 text-mint-300 hover:underline"><Phone className="h-4 w-4" />{m.phone}</a>}
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!remove} danger loading={busy} title="Delete this message?" confirmLabel="Delete" onClose={() => setRemove(null)} onConfirm={doDelete} message="This cannot be undone." />
    </>
  );
}
