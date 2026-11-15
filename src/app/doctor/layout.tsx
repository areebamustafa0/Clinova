"use client";

import type { ReactNode } from "react";
import { CalendarCheck, CalendarClock, LayoutDashboard, UserRound } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";

const nav: NavItem[] = [
  { href: "/doctor", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/doctor/appointments", label: "Appointments", icon: CalendarCheck },
  { href: "/doctor/schedule", label: "Availability", icon: CalendarClock },
  { href: "/doctor/profile", label: "My Profile", icon: UserRound },
];

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="doctor" nav={nav} label="Doctor Portal">
      {children}
    </DashboardShell>
  );
}
