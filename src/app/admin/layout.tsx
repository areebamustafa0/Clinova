"use client";

import type { ReactNode } from "react";
import { BarChart3, CalendarCheck, LayoutDashboard, Mail, Sparkles, Stethoscope, UserRound, Users } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";

const nav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarCheck },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/patients", label: "Patients", icon: Users },
  { href: "/admin/treatments", label: "Treatments", icon: Sparkles },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/profile", label: "My Profile", icon: UserRound },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="admin" nav={nav} label="Administration">
      {children}
    </DashboardShell>
  );
}
