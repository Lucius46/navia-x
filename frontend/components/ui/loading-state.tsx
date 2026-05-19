export function LoadingState({ label = "正在加载内容..." }: { label?: string }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-[24px] border border-dashed border-line bg-white/80 text-sm text-slate-500">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 animate-pulse rounded-full bg-brand" />
        <span>{label}</span>
      </div>
    </div>
  );
}

