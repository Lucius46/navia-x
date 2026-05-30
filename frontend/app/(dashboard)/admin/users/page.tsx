"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { listAdminUsers, updateAdminUserAccess } from "@/lib/admin-api";
import { isAdminUser, useAuthSession } from "@/lib/auth";
import { AdminUser, UserPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import {
  formatAccessStatus,
  formatDateTime,
  formatPlanLabel,
} from "@/lib/utils";

const planOptions: UserPlan[] = [
  "free",
  "trial",
  "student",
  "pro",
  "enterprise",
  "lifetime",
];

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuthSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [draftPlans, setDraftPlans] = useState<Record<string, UserPlan>>({});
  const [draftLimits, setDraftLimits] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyUserId, setBusyUserId] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !isAdminUser(user)) {
      setIsLoading(false);
      return;
    }

    let active = true;
    void listAdminUsers()
      .then((items) => {
        if (!active) {
          return;
        }

        setUsers(items);
        setDraftPlans(
          Object.fromEntries(items.map((item) => [item.id, item.plan]))
        );
        setDraftLimits(
          Object.fromEntries(
            items.map((item) => [item.id, item.dailyUsageLimit])
          )
        );
        setError("");
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load users."
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

  async function runUpdate(
    userId: string,
    action: "save" | "disable" | "extend"
  ) {
    setError("");
    setBusyUserId(userId);

    const selectedPlan = draftPlans[userId];
    const selectedLimit = draftLimits[userId];

    try {
      const updated = await updateAdminUserAccess(userId, {
        plan: action === "save" ? selectedPlan : undefined,
        accessStatus:
          action === "disable"
            ? "disabled"
            : action === "save"
              ? "active"
              : undefined,
        extendDays: action === "extend" ? 30 : undefined,
        dailyUsageLimit: action === "disable" ? 0 : selectedLimit,
      });

      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      setDraftPlans((current) => ({ ...current, [updated.id]: updated.plan }));
      setDraftLimits((current) => ({
        ...current,
        [updated.id]: updated.dailyUsageLimit,
      }));
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update the user."
      );
    } finally {
      setBusyUserId("");
    }
  }

  const activeCount = useMemo(
    () => users.filter((item) => item.accessStatus === "active").length,
    [users]
  );

  if (!isAuthenticated) {
    return (
      <EmptyState
        title="Admin sign-in required"
        description="User access management is only available to authenticated admin users."
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
        description="This account does not have permission to update user access."
      />
    );
  }

  if (isLoading) {
    return <LoadingState label="Loading users..." />;
  }

  return (
    <div className="space-y-5">
      <Card className="border-blue-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
              User Access Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Review and update user access
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Admin actions update the user record directly, so plan, access state,
              expiration handling, and daily limits all stay backend-controlled.
            </p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-4 py-2">
            {users.length} total users
          </span>
          <span className="rounded-full bg-blue-50 px-4 py-2 text-blue-700">
            {activeCount} active today
          </span>
        </div>

        {error ? (
          <div className="mt-4 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}
      </Card>

      <Card className="border-blue-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-line text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Email",
                  "Role",
                  "Plan",
                  "Status",
                  "Expires",
                  "Today",
                  "Limit",
                  "Actions",
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
              {users.map((item) => {
                const isBusy = busyUserId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {item.email}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {item.role}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <select
                        value={draftPlans[item.id] ?? item.plan}
                        onChange={(event) =>
                          setDraftPlans((current) => ({
                            ...current,
                            [item.id]: event.target.value as UserPlan,
                          }))
                        }
                        className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >
                        {planOptions.map((plan) => (
                          <option key={plan} value={plan}>
                            {formatPlanLabel(plan)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatAccessStatus(item.accessStatus)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {formatDateTime(item.accessExpiresAt)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {item.dailyUsageCount}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <Input
                        type="number"
                        min={0}
                        value={draftLimits[item.id] ?? item.dailyUsageLimit}
                        onChange={(event) =>
                          setDraftLimits((current) => ({
                            ...current,
                            [item.id]: Number(event.target.value),
                          }))
                        }
                        className="min-w-[110px] px-3 py-2"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          disabled={isBusy}
                          onClick={() => void runUpdate(item.id, "save")}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={isBusy}
                          onClick={() => void runUpdate(item.id, "extend")}
                        >
                          +30d
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={isBusy}
                          onClick={() => void runUpdate(item.id, "disable")}
                        >
                          Disable
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
