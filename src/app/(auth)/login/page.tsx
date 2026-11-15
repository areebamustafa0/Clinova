"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, LogIn, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { homePathFor, useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { errorMessage, fieldErrors } from "@/lib/http";

const demos = [
  { label: "Patient", email: "patient@clinova.com", password: "Patient@123", Icon: UserRound },
  { label: "Doctor", email: "doctor@clinova.com", password: "Doctor@123", Icon: Stethoscope },
  { label: "Admin", email: "admin@clinova.com", password: "Admin@123", Icon: ShieldCheck },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const next = params.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;

  useEffect(() => {
    if (user) router.replace(safeNext ?? homePathFor(user.role));
  }, [user, router, safeNext]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    const local: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) local.email = "Enter a valid email address";
    if (!password) local.password = "Password is required";
    if (Object.keys(local).length) return setErrors(local);

    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`Welcome back, ${u.firstName}.`);
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
      <p className="eyebrow text-mint-400">Welcome back</p>
      <h1 className="mt-4 font-serif text-5xl leading-tight">Sign in to Clinova</h1>
      <p className="mt-3 text-fog">Manage your appointments, treatments and care in one place.</p>

      <form onSubmit={submit} noValidate className="mt-10 space-y-5">
        {formError && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{formError}</p>}
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="you@example.com" />
        <div className="relative">
          <Input label="Password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} placeholder="••••••••" />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-[38px] rounded-full p-1.5 text-fog hover:text-fg">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button type="submit" size="lg" loading={busy} className="w-full" icon={<LogIn className="h-4 w-4" />}>Sign in</Button>
      </form>

      <p className="mt-8 text-center text-sm text-fog">
        New to Clinova?{" "}
        <Link href={safeNext ? `/register?next=${encodeURIComponent(safeNext)}` : "/register"} className="font-medium text-mint-300 hover:underline">Create a patient account</Link>
      </p>

      <div className="mt-10 rounded-2xl border border-fg/[0.08] bg-fg/[0.03] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fog">Demo accounts</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {demos.map(({ label, email: e, password: p, Icon }) => (
            <button key={label} type="button" onClick={() => { setEmail(e); setPassword(p); setErrors({}); setFormError(""); }} className="flex flex-col items-center gap-1.5 rounded-xl border border-fg/10 px-2 py-3 text-xs text-fg/80 transition hover:border-mint-400/60 hover:text-mint-300">
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-fog-dark">Click a role to fill in its development-only credentials.</p>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
