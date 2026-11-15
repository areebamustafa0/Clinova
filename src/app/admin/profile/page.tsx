"use client";

import { PageHeader } from "@/components/layout/DashboardShell";
import { ChangePasswordForm, ProfileForm } from "@/components/profile/ProfileForms";
import { Skeleton } from "@/components/ui/Feedback";
import { useAuth } from "@/context/AuthContext";

export default function AdminProfilePage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="My profile" subtitle="Manage your administrator account." />
      {user ? <div className="space-y-6"><ProfileForm key={`${user.id}-${user.phone ?? ""}`} /><ChangePasswordForm /></div> : <Skeleton className="h-96" />}
    </>
  );
}
