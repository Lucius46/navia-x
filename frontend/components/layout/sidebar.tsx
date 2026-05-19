"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileUp,
  History,
  LayoutDashboard,
  Settings,
  Shield,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "主页", icon: LayoutDashboard },
  { href: "/explain", label: "解释模式", icon: Sparkles },
  { href: "/history", label: "历史记录", icon: History },
  { href: "/pdf", label: "PDF 上传", icon: FileUp },
  { href: "/settings", label: "设置", icon: Settings },
  { href: "/admin", label: "管理后台", icon: Shield }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 flex h-[calc(100vh-2rem)] w-full max-w-[280px] flex-col justify-between rounded-[34px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_28px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-[radial-gradient(circle_at_30%_20%,rgba(96,165,250,0.55),rgba(29,78,216,0.15)_60%,rgba(15,23,42,0.9))] text-lg font-bold text-white shadow-[0_12px_40px_rgba(29,78,216,0.28)]">
            NX
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
              Browser Control
            </p>
            <h1 className="text-lg font-semibold text-white">
              Navia-X Explainer
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
                    ? "bg-gradient-to-r from-cyan-500/25 via-blue-500/25 to-indigo-500/25 text-white shadow-[0_14px_40px_rgba(59,130,246,0.2)]"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          Extension Flow
        </p>
        <p className="mt-2 text-sm font-semibold text-white">
          选词 → 确认 → 后端解释 → 后台留痕
        </p>
        <p className="mt-2 text-sm text-slate-400">
          当前版本默认预留模型路由扩展，并将浏览器扩展和后台请求统一记录。
        </p>
      </div>
    </aside>
  );
}
