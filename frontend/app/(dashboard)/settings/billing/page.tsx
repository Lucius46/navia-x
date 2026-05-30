"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, KeyRound, Zap } from "lucide-react";
import { getCurrentUser, getMyLicenseStatus } from "@/lib/api";
import { readStoredSession, storeSession, useAuthSession } from "@/lib/auth";
import { LicenseStatus } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { formatAccessStatus, formatDateTime, formatPlanLabel } from "@/lib/utils";

export default function BillingPage() {
  const { isAuthenticated } = useAuthSession();
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    let active = true;

    void Promise.all([getMyLicenseStatus(), getCurrentUser()])
      .then(([license, user]) => {
        if (!active) {
          return;
        }

        const session = readStoredSession();
        if (session) {
          storeSession({ ...session, user });
        }

        setStatus(license);
        setError("");
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load billing data."
        );
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Sign in to view billing"
        description="Your plan, license status, expiration date, and usage limits are attached to the authenticated account."
        action={
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-float"
          >
            Open sign in
          </Link>
        }
      />
    );
  }

  if (isLoading) {
    return <LoadingState label="Loading billing status..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Billing data unavailable"
        description={error}
        action={
          <Link
            href="/activate"
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-float"
          >
            Open activation
          </Link>
        }
      />
    );
  }

  if (!status) {
    return (
      <EmptyState
        title="No billing data yet"
        description="Activate a license code to attach paid access to this account."
      />
    );
  }

  const usagePercent =
    status.dailyUsageLimit > 0
      ? Math.min((status.dailyUsageCount / status.dailyUsageLimit) * 100, 100)
      : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Current plan",
            value: formatPlanLabel(status.plan),
            detail: "Applied from the active license",
            icon: CreditCard
          },
          {
            label: "Access status",
            value: formatAccessStatus(status.accessStatus),
            detail: "Checked on every protected explain request",
            icon: KeyRound
          },
          {
            label: "Access expires",
            value: formatDateTime(status.accessExpiresAt),
            detail: "Null means the current access does not expire",
            icon: Zap
          },
          {
            label: "Today",
            value: `${status.dailyUsageCount} / ${status.dailyUsageLimit}`,
            detail: "Successful protected explanation requests",
            icon: CreditCard
          }
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label} className="border-blue-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-4 text-2xl font-semibold text-slate-900">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.detail}
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-blue-100">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Daily Usage
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Protected explain quota
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The backend increments usage only after a successful explanation response.
          </p>

          <div className="mt-8 rounded-full bg-slate-100 p-2">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all"
              style={{ width: `${Math.max(usagePercent, 4)}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
            <span>{status.dailyUsageCount} used today</span>
            <span>{status.dailyUsageLimit} total allowed</span>
          </div>
        </Card>

        <Card className="border-blue-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.96))]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Next Step
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Need a new code or extension?
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            If this account is inactive, expired, or close to its daily limit,
            you can activate a fresh code or ask an admin to extend access.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/activate"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-float"
            >
              Activate a code
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Open explainer
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
