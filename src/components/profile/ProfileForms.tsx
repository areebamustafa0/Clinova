"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Form";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { errorMessage, fieldErrors, patch, post } from "@/lib/http";

export function ProfileForm() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const isPatient = user?.role === "patient";
  const [f, setF] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    dateOfBirth: user?.dateOfBirth ?? "",
    gender: user?.gender ?? "",
    address: user?.address ?? "",
    emergencyContact: user?.emergencyContact ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      await patch("/auth/me", {
        firstName: f.firstName, lastName: f.lastName, phone: f.phone,
        ...(isPatient ? { dateOfBirth: f.dateOfBirth || null, gender: f.gender || null, address: f.address || null, emergencyContact: f.emergencyContact || null } : {}),
      });
      await refresh();
      toast.success("Profile updated.");
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;
  return (
    <form onSubmit={submit} noValidate className="panel grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
      <h2 className="font-serif text-2xl sm:col-span-2">Personal details</h2>
      <Input label="First name" required value={f.firstName} onChange={set("firstName")} error={errors.firstName} />
      <Input label="Last name" required value={f.lastName} onChange={set("lastName")} error={errors.lastName} />
      <Input label="Email" value={user.email} disabled hint="Your email is your sign-in and can't be changed here." />
      <Input label="Phone number" type="tel" required value={f.phone} onChange={set("phone")} error={errors.phone} />
      {isPatient && (
        <>
          <Input label="Date of birth" type="date" value={f.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={set("dateOfBirth")} error={errors.dateOfBirth} />
          <Select label="Gender" value={f.gender} onChange={set("gender")}>
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </Select>
          <Textarea className="sm:col-span-2" label="Address" rows={2} value={f.address} onChange={set("address")} error={errors.address} />
          <Input className="sm:col-span-2" label="Emergency contact" value={f.emergencyContact} onChange={set("emergencyContact")} placeholder="Name and phone number" />
        </>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" loading={busy} icon={<Save className="h-4 w-4" />}>Save changes</Button>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const toast = useToast();
  const [f, setF] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (!f.currentPassword) local.currentPassword = "Enter your current password";
    if (f.newPassword.length < 8 || !/[A-Za-z]/.test(f.newPassword) || !/\d/.test(f.newPassword)) local.newPassword = "Use 8+ characters with a letter and a number";
    if (f.confirm !== f.newPassword) local.confirm = "Passwords do not match";
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      await post("/auth/password", { currentPassword: f.currentPassword, newPassword: f.newPassword });
      toast.success("Password updated. Other devices have been signed out.");
      setF({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setErrors({ ...fieldErrors(err), ...(fieldErrors(err).currentPassword ? {} : { currentPassword: errorMessage(err) }) });
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="panel grid gap-5 p-6 sm:p-8">
      <h2 className="font-serif text-2xl">Change password</h2>
      <Input label="Current password" type="password" autoComplete="current-password" value={f.currentPassword} onChange={set("currentPassword")} error={errors.currentPassword} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="New password" type="password" autoComplete="new-password" value={f.newPassword} onChange={set("newPassword")} error={errors.newPassword} />
        <Input label="Confirm new password" type="password" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} error={errors.confirm} />
      </div>
      <div><Button type="submit" variant="outline" loading={busy} icon={<KeyRound className="h-4 w-4" />}>Update password</Button></div>
    </form>
  );
}
