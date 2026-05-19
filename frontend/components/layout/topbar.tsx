import { Bell, ChevronDown, Search, Sparkles } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex flex-col gap-4 rounded-[30px] border border-white/10 bg-slate-950/68 px-6 py-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
          Navia-X Control Center
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          浏览器解释器与后台管理一体化控制台
        </h2>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-400">
          <Search className="h-4 w-4" />
          <span>搜索用户、请求日志、扩展状态...</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-300">
            <Sparkles className="h-4 w-4" />
            Extension Online
          </div>
          <button className="rounded-full border border-white/10 p-3 text-slate-400 transition hover:bg-white/[0.05]">
            <Bell className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1.5 transition hover:bg-white/[0.06]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-200">
              KL
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Kim Lucius</p>
              <p className="text-xs text-slate-500">Founder Admin</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
