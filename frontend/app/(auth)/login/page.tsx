"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { loginUser } from "@/lib/api";
import { storeSession, useAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(user?.role === "admin" ? "/admin/licenses" : "/activate");
    }
  }, [isAuthenticated, router, user?.role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await loginUser(email, password);
      storeSession(session);
      router.push(session.user.role === "admin" ? "/admin/licenses" : "/activate");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in right now."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="overflow-hidden border-blue-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(239,246,255,0.98))]">
        <div className="flex h-full flex-col justify-between gap-10">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-blue-500">
              Navia-X Access
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight text-slate-900">
              Sign in to unlock license-based LLM explanations.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              This project now checks backend session auth, license activation,
              expiration, and daily usage before protected explanation requests run.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-blue-100 bg-white/90 p-5">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                Backend-enforced access
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Normal users cannot access admin APIs, and explain requests are
                blocked until an active license is attached to the account.
              </p>
            </div>
            <div className="rounded-[24px] border border-blue-100 bg-white/90 p-5">
              <KeyRound className="h-5 w-5 text-blue-600" />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                Activation-first flow
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                After sign-in, enter a license code on the activation screen and
                the app will immediately refresh your plan, status, and limits.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-blue-100">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
          Account Login
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">
          Continue with your existing credentials
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Use the same email and password already configured in your Supabase Auth users.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <Button className="w-full justify-center py-3" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between rounded-[22px] border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-slate-600">
          <span>Need to activate a code after login?</span>
          <Link href="/activate" className="inline-flex items-center gap-2 font-semibold text-blue-700">
            Open activation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
