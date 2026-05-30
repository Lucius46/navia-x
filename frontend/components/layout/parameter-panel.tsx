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
      <Card className="border-blue-100 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
          Right Panel
        </p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">Access health</h3>
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-blue-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Today&apos;s protected requests</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">128</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Average latency</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">2.1s</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Active model</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              OpenAI
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-blue-100 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
          Product Notes
        </p>
        <div className="mt-4 space-y-3">
          {settings.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-blue-100 bg-slate-50 p-4 text-sm text-slate-600"
            >
              {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
