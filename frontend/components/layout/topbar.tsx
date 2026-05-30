"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut, Search, Sparkles } from "lucide-react";
import { clearSession, useAuthSession } from "@/lib/auth";
import { formatPlanLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const router = useRouter();
  const { user } = useAuthSession();

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <header className="flex flex-col gap-4 rounded-[30px] border border-line bg-white/94 px-6 py-5 shadow-panel backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
          Navia-X Access Control
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          License, billing, and protected explanation controls
        </h2>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2 rounded-full border border-line bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
          <Search className="h-4 w-4" />
          <span>Search licenses, users, or billing status...</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            <Sparkles className="h-4 w-4" />
            {user ? `${formatPlanLabel(user.plan)} plan` : "Signed out"}
          </div>
          <button className="rounded-full border border-line p-3 text-slate-500 transition hover:bg-blue-50">
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 rounded-full border border-line bg-slate-50 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
              {user?.email?.slice(0, 1).toUpperCase() ?? "N"}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">
                {user?.email ?? "Not signed in"}
              </p>
              <p className="text-xs text-slate-500">
                {user ? `${user.role} account` : "Use /login to continue"}
              </p>
            </div>
            {user ? (
              <Button variant="ghost" className="px-3 py-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
