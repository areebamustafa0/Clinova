"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { homePathFor, useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { errorMessage, fieldErrors } from "@/lib/http";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, register } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  const next = params.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  useEffect(() => {
    if (user) router.replace(safeNext ?? homePathFor(user.role));
  }, [user, router, safeNext]);

  const strength = [f.password.length >= 8, /[A-Z]/.test(f.password), /\d/.test(f.password), /[^A-Za-z0-9]/.test(f.password)].filter(Boolean).length;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const local: Record<string, string> = {};
    if (!f.firstName.trim()) local.firstName = "First name is required";
    if (!f.lastName.trim()) local.lastName = "Last name is required";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) local.email = "Enter a valid email address";
    if (!/^[+()\-\s\d]{7,20}$/.test(f.phone)) local.phone = "Enter a valid phone number";
    if (f.password.length < 8) local.password = "Use at least 8 characters";
    else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) local.password = "Include at least one letter and one number";
    if (f.confirm !== f.password) local.confirm = "Passwords do not match";
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const u = await register({ firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(), phone: f.phone.trim(), password: f.password });
      toast.success("Your account is ready. Welcome to Clinova!");
      router.replace(safeNext ?? homePathFor(u.role));
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="eyebrow text-mint-400">Patient account</p>
      <h1 className="mt-4 font-serif text-5xl leading-tight">Create your account</h1>
      <p className="mt-3 text-fog">Book appointments, track your care and manage your details securely.</p>

      <form onSubmit={submit} noValidate className="mt-9 grid gap-4 sm:grid-cols-2">
        {formError && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 sm:col-span-2">{formError}</p>}
        <Input label="First name" required autoComplete="given-name" value={f.firstName} onChange={set("firstName")} error={errors.firstName} />
        <Input label="Last name" required autoComplete="family-name" value={f.lastName} onChange={set("lastName")} error={errors.lastName} />
        <Input className="sm:col-span-2" label="Email" type="email" required autoComplete="email" value={f.email} onChange={set("email")} error={errors.email} />
        <Input className="sm:col-span-2" label="Phone" type="tel" required autoComplete="tel" value={f.phone} onChange={set("phone")} error={errors.phone} placeholder="+1 555 000 0000" />
        <div className="sm:col-span-2">
          <Input label="Password" type="password" required autoComplete="new-password" value={f.password} onChange={set("password")} error={errors.password} hint="At least 8 characters, with a letter and a number." />
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? (strength <= 1 ? "bg-rose-400" : strength === 2 ? "bg-amber-400" : "bg-mint-400") : "bg-fg/10"}`} />
            ))}
          </div>
        </div>
        <Input className="sm:col-span-2" label="Confirm password" type="password" required autoComplete="new-password" value={f.confirm} onChange={set("confirm")} error={errors.confirm} />
        <Button type="submit" size="lg" loading={busy} className="w-full sm:col-span-2" icon={<UserPlus className="h-4 w-4" />}>Create account</Button>
      </form>

      <p className="mt-8 text-center text-sm text-fog">
        Already have an account? <Link href={safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : "/login"} className="font-medium text-mint-300 hover:underline">Sign in</Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
