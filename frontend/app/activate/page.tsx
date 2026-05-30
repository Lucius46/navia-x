"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, KeyRound } from "lucide-react";
import { activateLicense, getCurrentUser } from "@/lib/api";
import { readStoredSession, storeSession, useAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatAccessStatus, formatDateTime, formatPlanLabel } from "@/lib/utils";

export default function ActivatePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthSession();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSuccess("");
  }, [code]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const status = await activateLicense(code);
      const freshUser = await getCurrentUser();
      const session = readStoredSession();
      if (session) {
        storeSession({ ...session, user: freshUser });
      }
      setSuccess(
        `Activated ${formatPlanLabel(status.plan)} access. Status: ${formatAccessStatus(
          status.accessStatus
        )}.`
      );
      router.push("/");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to activate this license code."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card className="border-blue-100 text-center">
          <KeyRound className="mx-auto h-10 w-10 text-blue-600" />
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">
            Sign in before activating a license
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            License activation is tied to the authenticated user account, so the
            backend requires a valid session before it accepts a code.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-float"
            >
              Go to sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-blue-100">
          <p className="text-xs uppercase tracking-[0.28em] text-blue-500">
            Activate Access
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Attach a license code to {user?.email}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Once the code is valid, your plan, access status, expiration, and
            daily usage limit will update immediately.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                License code
              </label>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="NAVIA-XXXX-XXXX-XXXX"
                required
              />
            </div>

            {error ? (
              <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <Button className="w-full justify-center py-3" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Activating..." : "Activate Access"}
            </Button>
          </form>
        </Card>

        <Card className="border-blue-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.96))]">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Current Access
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {formatPlanLabel(user?.plan ?? "free")} plan
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Status: {formatAccessStatus(user?.accessStatus ?? "inactive")}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Expires: {formatDateTime(user?.accessExpiresAt ?? null)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Daily limit: {user?.dailyUsageLimit ?? 0}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-blue-100 bg-white/80 p-5">
            <p className="text-sm font-semibold text-slate-900">
              What happens after activation
            </p>
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              <li>The backend writes a `user_licenses` record for your account.</li>
              <li>Your user profile switches to the matching plan and access state.</li>
              <li>Protected LLM routes will start checking the new daily limit immediately.</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
