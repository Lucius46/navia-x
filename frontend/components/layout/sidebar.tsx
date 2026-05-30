"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  KeyRound,
  Settings,
  Shield,
  Sparkles
} from "lucide-react";
import { isAdminUser, useAuthSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthSession();
  const items = [
    { href: "/", label: "Explainer", icon: Sparkles },
    { href: "/activate", label: "Activate", icon: KeyRound },
    { href: "/settings/billing", label: "Billing", icon: CreditCard },
    ...(isAdminUser(user)
      ? [
          { href: "/admin/licenses", label: "Admin Licenses", icon: Shield },
          { href: "/admin/users", label: "Admin Users", icon: Settings }
        ]
      : [])
  ];

  return (
    <aside className="sticky top-4 flex h-[calc(100vh-2rem)] w-full max-w-[280px] flex-col justify-between rounded-[34px] border border-line bg-white/92 p-5 shadow-panel backdrop-blur-2xl">
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-[radial-gradient(circle_at_30%_20%,rgba(147,197,253,0.82),rgba(59,130,246,0.16)_60%,rgba(255,255,255,0.96))] text-lg font-bold text-blue-700 shadow-float">
            NX
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
              Access Control
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              Navia-X (SBP) Explainer
            </h1>
          </div>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-float"
                    : "text-slate-500 hover:bg-blue-50 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-[24px] border border-blue-100 bg-blue-50/80 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-blue-500">
          License Flow
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-900">
          Sign in → Activate → Explain → Track usage
        </p>
        <p className="mt-2 text-sm text-slate-600">
          License enforcement now happens on the backend before protected LLM requests are processed.
        </p>
      </div>
    </aside>
  );
}
