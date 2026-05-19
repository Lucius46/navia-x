import { usageSeries } from "@/lib/mock-data";

export function UsageChart() {
  const max = Math.max(...usageSeries.map((item) => item.requests));

  return (
    <div className="flex h-[240px] items-end gap-3">
      {usageSeries.map((item) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
          <div className="relative flex h-full w-full items-end justify-center rounded-[20px] border border-white/6 bg-slate-950/55">
            <div
              className="w-full rounded-[20px] bg-gradient-to-t from-cyan-500 via-blue-500 to-indigo-300"
              style={{
                height: `${Math.max((item.requests / max) * 100, 18)}%`
              }}
            />
            <span className="absolute top-3 text-xs font-semibold text-slate-200">
              {item.requests}
            </span>
          </div>
          <span className="text-xs uppercase tracking-[0.24em] text-slate-500">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
