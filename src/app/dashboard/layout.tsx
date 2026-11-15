"use client";

import type { ReactNode } from "react";
import { CalendarCheck, CalendarPlus, LayoutDashboard, UserRound } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";

const nav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/book", label: "Book Appointment", icon: CalendarPlus },
  { href: "/dashboard/appointments", label: "My Appointments", icon: CalendarCheck },
  { href: "/dashboard/profile", label: "My Profile", icon: UserRound },
];

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="patient" nav={nav} label="Patient Portal">
      {children}
    </DashboardShell>
  );
}
