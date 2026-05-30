"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ShieldAlert } from "lucide-react";
import {
  createLicenseCode,
  disableLicenseCode,
  listLicenseCodes,
} from "@/lib/admin-api";
import { isAdminUser, useAuthSession } from "@/lib/auth";
import { CreateLicensePayload, LicenseCodeRecord, LicensePlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { formatDateTime, formatPlanLabel } from "@/lib/utils";

const planOptions: LicensePlan[] = [
  "trial",
  "student",
  "pro",
  "enterprise",
  "lifetime",
];

export default function AdminLicensesPage() {
  const { user, isAuthenticated } = useAuthSession();
  const [licenses, setLicenses] = useState<LicenseCodeRecord[]>([]);
  const [form, setForm] = useState<CreateLicensePayload>({
    plan: "trial",
    durationDays: 14,
    maxActivations: 1,
    usageLimitPerDay: 50,
    expiresAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !isAdminUser(user)) {
      setIsLoading(false);
      return;
    }

    let active = true;
    void listLicenseCodes()
      .then((items) => {
        if (active) {
          setLicenses(items);
          setError("");
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load license codes."
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFlash("");
    setIsSubmitting(true);

    try {
      const created = await createLicenseCode(form);
      setLicenses((current) => [created, ...current]);
      setFlash(`Created ${created.code}.`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create the license code."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDisable(licenseId: string) {
    setError("");
    setFlash("");

    try {
      const updated = await disableLicenseCode(licenseId);
      setLicenses((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setFlash(`Disabled ${updated.code}.`);
    } catch (disableError) {
      setError(
        disableError instanceof Error
          ? disableError.message
          : "Unable to disable the license code."
      );
    }
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Admin sign-in required"
        description="License generation and management are only available to authenticated admin users."
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

  if (!isAdminUser(user)) {
    return (
      <EmptyState
        title="Admin access only"
        description="This account does not have permission to generate or manage license codes."
      />
    );
  }

  if (isLoading) {
    return <LoadingState label="Loading license codes..." />;
  }

  return (
    <div className="space-y-5">
      <Card className="border-blue-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              License Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Generate and manage access codes
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Codes are generated as secure `NAVIA-XXXX-XXXX-XXXX` strings and
              can be disabled at any time without exposing admin controls to normal users.
            </p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <form className="mt-8 grid gap-4 lg:grid-cols-5" onSubmit={handleSubmit}>
          <select
            value={form.plan}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                plan: event.target.value as LicensePlan,
              }))
            }
            className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            {planOptions.map((plan) => (
              <option key={plan} value={plan}>
                {formatPlanLabel(plan)}
              </option>
            ))}
          </select>

          <Input
            type="number"
            min={1}
            value={form.durationDays ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                durationDays: event.target.value ? Number(event.target.value) : null,
              }))
            }
            placeholder="Duration days"
          />
          <Input
            type="number"
            min={1}
            value={form.maxActivations ?? 1}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                maxActivations: Number(event.target.value),
              }))
            }
            placeholder="Max activations"
          />
          <Input
            type="number"
            min={0}
            value={form.usageLimitPerDay ?? 50}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                usageLimitPerDay: Number(event.target.value),
              }))
            }
            placeholder="Daily limit"
          />
          <Input
            type="datetime-local"
            value={form.expiresAt ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                expiresAt: event.target.value || null,
              }))
            }
          />

          <div className="lg:col-span-5">
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="mr-2 h-4 w-4" />
              {isSubmitting ? "Creating..." : "Generate License Code"}
            </Button>
          </div>
        </form>

        {error ? (
          <div className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {flash ? (
          <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {flash}
          </div>
        ) : null}
      </Card>

      <Card className="border-blue-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Code",
                  "Plan",
                  "Status",
                  "Used",
                  "Limit",
                  "Expires",
                  "Created",
                  "Action",
                ].map((label) => (
                  <th
                    key={label}
                    className="px-4 py-3 text-xs uppercase tracking-[0.24em] text-slate-500"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-white">
              {licenses.map((license) => (
                <tr key={license.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                    {license.code}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatPlanLabel(license.plan)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {license.status}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {license.usedCount}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {license.maxActivations}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatDateTime(license.expiresAt)}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {formatDateTime(license.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <Button
                      variant="secondary"
                      onClick={() => void handleDisable(license.id)}
                      disabled={license.status !== "active"}
                    >
                      Disable
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
