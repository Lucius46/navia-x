"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BadgeDollarSign,
  Bot,
  ShieldCheck,
  Users
} from "lucide-react";
import { getAdminSnapshot } from "@/lib/admin-api";
import { adminUsers, modelStatuses, requestLogs, usageSummary } from "@/lib/mock-data";
import {
  AdminUser,
  ModelStatus,
  RequestLog,
  UsageSummary
} from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

interface SnapshotState {
  usage: UsageSummary;
  users: AdminUser[];
  logs: RequestLog[];
  statuses: ModelStatus[];
}

const initialState: SnapshotState = {
  usage: usageSummary,
  users: adminUsers,
  logs: requestLogs,
  statuses: modelStatuses
};

export function AdminConsole() {
  const [snapshot, setSnapshot] = useState<SnapshotState>(initialState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getAdminSnapshot().then((data) => {
      if (!active) {
        return;
      }

      setSnapshot(data);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const successRate = useMemo(() => {
    if (snapshot.usage.totalRequestsToday === 0) {
      return 0;
    }

    return Math.round(
      (snapshot.usage.successfulRequestsToday /
        snapshot.usage.totalRequestsToday) *
        100
    );
  }, [snapshot.usage]);

  const metrics = [
    {
      label: "今日解释请求",
      value: formatNumber(snapshot.usage.totalRequestsToday),
      detail: `${snapshot.usage.successfulRequestsToday} 成功 / ${snapshot.usage.failedRequestsToday} 失败`,
      icon: Activity
    },
    {
      label: "平均响应时间",
      value: `${snapshot.usage.averageLatencyMs} ms`,
      detail: "扩展和后台统一走后端代理",
      icon: Bot
    },
    {
      label: "活跃用户",
      value: formatNumber(snapshot.usage.activeUsers),
      detail: "最近 24 小时有解释行为",
      icon: Users
    },
    {
      label: "成功率",
      value: `${successRate}%`,
      detail: "根据请求日志实时计算",
      icon: ShieldCheck
    }
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-4">
        {metrics.map((item) => {
          const Icon = item.icon;

          return (
            <section
              key={item.label}
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-300">{item.label}</p>
                  <p className="mt-4 text-3xl font-semibold text-white">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                Usage Overview
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                浏览器解释器使用情况
              </h3>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300">
              {isLoading ? "同步中..." : "已接入后端数据"}
            </div>
          </div>

          <div className="mt-8 flex h-[260px] items-end gap-3">
            {snapshot.usage.series.map((point) => {
              const max = Math.max(
                ...snapshot.usage.series.map((item) => item.requests),
                1
              );

              return (
                <div
                  key={point.label}
                  className="flex flex-1 flex-col items-center gap-3"
                >
                  <div className="relative flex h-full w-full items-end justify-center rounded-[20px] border border-white/6 bg-slate-950/50">
                    <div
                      className="w-full rounded-[18px] bg-gradient-to-t from-cyan-500 via-blue-500 to-indigo-300"
                      style={{
                        height: `${Math.max((point.requests / max) * 100, 16)}%`
                      }}
                    />
                    <span className="absolute top-3 text-xs font-semibold text-slate-200">
                      {point.requests}
                    </span>
                  </div>
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <BadgeDollarSign className="h-5 w-5 text-cyan-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                  Cost Placeholder
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  成本与策略看板
                </h3>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                "每位测试用户每天上限 20 次解释",
                "所有扩展请求通过后端代理，不在前端暴露 API Key",
                "扩展选词解释与后台解释共用同一模型路由"
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] border border-white/8 bg-slate-950/55 p-4 text-sm text-slate-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                  Model Status
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  模型与服务状态
                </h3>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {snapshot.statuses.map((status) => (
                <div
                  key={status.provider}
                  className="rounded-[22px] border border-white/8 bg-slate-950/55 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {status.provider}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {status.activeModel}
                      </p>
                    </div>
                    <span
                      className={
                        status.enabled
                          ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"
                          : "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-400"
                      }
                    >
                      {status.enabled ? "Enabled" : "Reserved"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {status.note}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                User Management
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                用户管理
              </h3>
            </div>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300">
              {snapshot.users.length} accounts
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-white/8">
            <table className="min-w-full divide-y divide-white/8 text-left">
              <thead className="bg-slate-950/70">
                <tr>
                  {["邮箱", "角色", "状态", "今日请求", "创建时间"].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-xs uppercase tracking-[0.24em] text-slate-500"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6 bg-slate-950/35">
                {snapshot.users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-4 text-sm text-white">{user.email}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{user.role}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {user.requestsToday}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                Request Logs
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                请求与错误日志
              </h3>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {snapshot.logs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="rounded-[24px] border border-white/8 bg-slate-950/55 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {log.user}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {log.provider ?? "provider"} · {log.model}
                    </p>
                  </div>
                  <span
                    className={
                      log.status === "success"
                        ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"
                        : "rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-300"
                    }
                  >
                    {log.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                  <span>{formatDate(log.createdAt)}</span>
                  <span>{log.latencyMs} ms</span>
                </div>
                {log.errorMessage ? (
                  <p className="mt-3 text-sm leading-6 text-rose-300">
                    {log.errorMessage}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

