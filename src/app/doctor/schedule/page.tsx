"use client";

import { PageHeader } from "@/components/layout/DashboardShell";
import { ScheduleEditor } from "@/components/schedule/ScheduleEditor";
import { Skeleton } from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="My availability" subtitle="Set your working days, consultation hours, slot interval and unavailable dates. Patients only see slots that fit this schedule." />
      {user?.doctorId ? <ScheduleEditor doctorId={user.doctorId} /> : <Skeleton className="h-96" />}
    </>
  );
}
