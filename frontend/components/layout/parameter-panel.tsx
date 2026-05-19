import { Card } from "@/components/ui/card";

const settings = [
  "模型路由已预留 Claude / Gemini / Qwen 扩展位",
  "默认解释结果包含摘要、深度解释、关键词、例句与总结",
  "PDF 上传 UI 已就绪，后端解析逻辑保留 TODO",
  "支持颜色、字体、背景等个人化偏好设置"
];

export function ParameterPanel() {
  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-slate-950/68 p-5 text-white shadow-[0_24px_90px_rgba(0,0,0,0.36)]">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          Right Panel
        </p>
        <h3 className="mt-2 text-lg font-semibold text-white">参数与状态</h3>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">今日调用</p>
            <p className="mt-1 text-2xl font-semibold text-white">128</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">平均耗时</p>
            <p className="mt-1 text-2xl font-semibold text-white">2.1s</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">活跃模型</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              OpenAI
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-white/10 bg-slate-950/68 p-5 text-white shadow-[0_24px_90px_rgba(0,0,0,0.36)]">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          Product Notes
        </p>
        <div className="mt-4 space-y-3">
          {settings.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/8 bg-white/[0.04] p-4 text-sm text-slate-300"
            >
              {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
