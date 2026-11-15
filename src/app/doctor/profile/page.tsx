"use client";

import { PageHeader } from "@/components/layout/DashboardShell";
import { ChangePasswordForm, ProfileForm } from "@/components/profile/ProfileForms";
import { Skeleton } from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";

export default function DoctorProfilePage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="My profile" subtitle="Update your contact details and password. Public profile information is managed by the clinic administrator." />
      {user ? <div className="space-y-6"><ProfileForm key={`${user.id}-${user.phone ?? ""}`} /><ChangePasswordForm /></div> : <Skeleton className="h-96" />}
    </>
  );
}
