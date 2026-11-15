export type Role = "patient" | "doctor" | "admin";

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "rejected" | "no_show";

export type Profile = {
  id: number;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  name: string;
  phone: string | null;
  patientId: number | null;
  doctorId: number | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  photoUrl?: string | null;
  specialization?: string | null;
};

export type TreatmentLite = { id: number; slug: string | null; name: string; category: string; price: number; durationMinutes: number };

export type Doctor = {
  id: number;
  userId?: number;
  firstName: string;
  lastName: string;
  name: string;
  email?: string;
  phone?: string | null;
  specializationId: number;
  specialization: string;
  qualifications: string;
  experienceYears: number;
  bio: string;
  consultationFee: number;
  photoUrl: string | null;
  slotDuration: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  workingDays: number[];
  treatments: TreatmentLite[];
};

export type Treatment = {
  id: number;
  name: string;
  category: string;
  description: string;
  durationMinutes: number;
  price: number;
  imageUrl: string | null;
  slug: string | null;
  tagline: string | null;
  durationLabel: string | null;
  sessions: string | null;
  downtime: string | null;
  isFeatured: boolean;
  isActive: boolean;
  doctors: { id: number; name: string; photoUrl: string | null; specialization: string }[];
};

export type Appointment = {
  id: number;
  reference: string;
  status: AppointmentStatus;
  date: string;
  startTime: string;
  endTime: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;
  reason: string | null;
  notes: string | null;
  price: number;
  rescheduleCount: number;
  cancelledBy: string | null;
  cancellationReason: string | null;
  createdAt: string;
  doctor: { id: number; userId: number; name: string; specialization: string; photoUrl: string | null };
  treatment: { id: number; name: string; category: string; durationMinutes: number };
  patient: { id: number; userId: number; name: string; email: string };
  history?: { id: number; fromStatus: string | null; toStatus: string; note: string | null; createdAt: string }[];
};

export type Slot = { startTime: string; endTime: string; available: boolean; reason?: "booked" | "past" };

export type SlotsResponse = {
  date: string;
  durationMinutes: number;
  slots: Slot[];
  closedReason?: string;
};

export type Summary = {
  total: number;
  pending: number;
  confirmed: number;
  upcoming: number;
  today: number;
  completed: number;
  cancelled: number;
};

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  appointmentId: number | null;
};

export type ScheduleDay = { dayOfWeek: number; blocks: { startTime: string; endTime: string }[] };
export type ScheduleResponse = {
  doctorId: number;
  slotDuration: number;
  days: ScheduleDay[];
  unavailableDates: { id: number; date: string; reason: string | null }[];
};

export type PublicStats = { doctors: number; patients: number; treatments: number; completedVisits: number; yearsExperience: number };

export type PatientRecord = {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  emergencyContact: string | null;
  appointmentCount: number;
  lastVisit: string | null;
  appointments?: Appointment[];
};
