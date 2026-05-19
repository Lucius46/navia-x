"use client";

import { useState } from "react";
import {
  Copy,
  Globe2,
  Languages,
  LoaderCircle,
  Mail,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { modeOptions } from "@/lib/mock-data";
import { explainText } from "@/lib/api";
import { ExplainMode, ExplainResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const defaultText =
  "Self-attention enables each token to attend to every other token in parallel, which makes Transformers more scalable than recurrent architectures when modeling long-range dependencies.";

const languageOptions = [
  { value: "zh-CN", label: "简体中文", hint: "面向中文用户输出解释" },
  { value: "en", label: "English", hint: "Return the explanation in English" },
  { value: "ko", label: "한국어", hint: "설명 결과를 한국어로 출력" },
  { value: "ja", label: "日本語", hint: "説明結果を日本語で返す" },
] as const;

const DEFAULT_USER_EMAIL = "web@navia-x.ai";

function isSupportedUserEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/\.local$/i.test(value);
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-neutral-700 bg-neutral-800 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-neutral-500">
        {title}
      </p>
      <div className="mt-3 text-sm leading-7 text-neutral-200">{children}</div>
    </div>
  );
}

export function ExplainerWorkspace() {
  const [text, setText] = useState(defaultText);
  const [userEmail, setUserEmail] = useState(DEFAULT_USER_EMAIL);
  const [selectedMode, setSelectedMode] = useState<ExplainMode>("simple");
  const [outputLanguage, setOutputLanguage] = useState<
    "zh-CN" | "en" | "ko" | "ja"
  >("zh-CN");
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const charCount = text.trim().length;

  async function handleExplain() {
    if (!text.trim()) {
      setError("请先输入需要解析的内容。");
      return;
    }

    if (charCount > 3000) {
      setError("单次输入最多 3000 字，请缩短后再试。");
      return;
    }

    const normalizedEmail = userEmail.trim() || DEFAULT_USER_EMAIL;

    if (!isSupportedUserEmail(normalizedEmail)) {
      setError("请输入有效邮箱地址，且不要使用 .local 域名。");
      return;
    }

    setCopied(false);
    setError("");
    setIsRunning(true);

    try {
      const response = await explainText({
        text,
        mode: selectedMode,
        userEmail: normalizedEmail,
        outputLanguage,
      });
      setResult(response);
    } catch (requestError) {
      setResult(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "解释请求失败，请稍后再试。"
      );
    } finally {
      setIsRunning(false);
    }
  }

  async function handleCopy() {
    if (!result) {
      return;
    }

    const payload = [
      result.summary,
      result.deepExplanation,
      result.keywords.map((item) => `${item.term}: ${item.definition}`).join("\n"),
      result.examples.join("\n"),
      result.takeaway,
    ]
      .filter(Boolean)
      .join("\n\n");

    await navigator.clipboard.writeText(payload);
    setCopied(true);
  }

  function handleReset() {
    setText(defaultText);
    setResult(null);
    setError("");
    setCopied(false);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#121212_0%,#171717_48%,#101010_100%)] px-4 py-6 text-neutral-100 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Card className="border-neutral-800 bg-neutral-900/95">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-neutral-500">
                Navia-X Web
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white lg:text-4xl">
                Navia-X 解析模式
              </h1>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-full border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-300">
                统一后端解析
              </div>
              <div className="rounded-full border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-300">
                多语言输出
              </div>
              <div className="rounded-full border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-300">
                深灰专业界面
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <div className="space-y-6">
            <Card className="border-neutral-800 bg-neutral-900/95">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="rounded-[24px] border border-neutral-700 bg-neutral-800 p-4">
                  <span className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-200">
                    <Languages className="h-4 w-4 text-neutral-400" />
                    输出语言
                  </span>
                  <select
                    value={outputLanguage}
                    onChange={(event) =>
                      setOutputLanguage(
                        event.target.value as "zh-CN" | "en" | "ko" | "ja"
                      )
                    }
                    className="w-full rounded-2xl border border-neutral-600 bg-neutral-700 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-neutral-400"
                  >
                    {languageOptions.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-3 text-xs leading-6 text-neutral-500">
                    {
                      languageOptions.find(
                        (language) => language.value === outputLanguage
                      )?.hint
                    }
                  </p>
                </label>

                <label className="rounded-[24px] border border-neutral-700 bg-neutral-800 p-4">
                  <span className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-200">
                    <Sparkles className="h-4 w-4 text-neutral-400" />
                    解析模式
                  </span>
                  <select
                    value={selectedMode}
                    onChange={(event) =>
                      setSelectedMode(event.target.value as ExplainMode)
                    }
                    className="w-full rounded-2xl border border-neutral-600 bg-neutral-700 px-4 py-3 text-sm text-neutral-100 outline-none transition focus:border-neutral-400"
                  >
                    {modeOptions.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-3 text-xs leading-6 text-neutral-500">
                    {
                      modeOptions.find((mode) => mode.value === selectedMode)
                        ?.note
                    }
                  </p>
                </label>

                <label className="rounded-[24px] border border-neutral-700 bg-neutral-800 p-4">
                  <span className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-200">
                    <Mail className="h-4 w-4 text-neutral-400" />
                    用户邮箱
                  </span>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(event) => setUserEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                  <p className="mt-3 text-xs leading-6 text-neutral-500">
                    用于后端按用户记录请求和历史。
                  </p>
                </label>
              </div>
            </Card>

            <Card className="border-neutral-800 bg-neutral-900/95">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                      Input
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      输入要解析的内容
                    </h2>
                  </div>
                  <div className="rounded-full border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-300">
                    {charCount} / 3000
                  </div>
                </div>

                <Textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="粘贴你需要解释的词语、句子、代码或论文段落。"
                  className="min-h-[320px] bg-neutral-800"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button onClick={() => void handleExplain()} disabled={isRunning}>
                    {isRunning ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        解析中
                      </>
                    ) : (
                      "开始解析"
                    )}
                  </Button>
                  <Button variant="secondary" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    恢复示例
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void handleCopy()}
                    disabled={!result}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "已复制结果" : "复制结果"}
                  </Button>
                </div>

                {error ? (
                  <div className="rounded-[20px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-neutral-800 bg-neutral-900/95">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                    Result
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    解析结果
                  </h2>
                </div>
                <div className="rounded-[22px] border border-neutral-700 bg-neutral-800 px-4 py-3 text-right text-xs text-neutral-400">
                  <div>模式：{modeOptions.find((item) => item.value === selectedMode)?.label}</div>
                  <div className="mt-1">
                    语言：{languageOptions.find((item) => item.value === outputLanguage)?.label}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {result ? (
                  <>
                    <ResultSection title="简明解释">
                      <p>{result.summary}</p>
                    </ResultSection>
                    <ResultSection title="深度解析">
                      <p>{result.deepExplanation}</p>
                    </ResultSection>
                    <ResultSection title="关键词">
                      {result.keywords.length ? (
                        <div className="space-y-3">
                          {result.keywords.map((item) => (
                            <div
                              key={`${item.term}-${item.definition}`}
                              className="rounded-2xl border border-neutral-700 bg-neutral-700 px-4 py-3"
                            >
                              <p className="font-medium text-white">{item.term}</p>
                              <p className="mt-1 text-neutral-400">
                                {item.definition}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-neutral-400">暂无关键词。</p>
                      )}
                    </ResultSection>
                    <ResultSection title="例句与应用">
                      {result.examples.length ? (
                        <ul className="space-y-3 pl-5">
                          {result.examples.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-neutral-400">暂无例句。</p>
                      )}
                    </ResultSection>
                    <ResultSection title="总结">
                      <p>{result.takeaway}</p>
                    </ResultSection>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[22px] border border-neutral-700 bg-neutral-800 px-4 py-4 text-sm text-neutral-300">
                        模型：<span className="text-white">{result.model}</span>
                      </div>
                      <div className="rounded-[22px] border border-neutral-700 bg-neutral-800 px-4 py-4 text-sm text-neutral-300">
                        延迟：<span className="text-white">{result.latencyMs} ms</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-neutral-700 bg-neutral-800/60 p-6">
                    <div className="flex items-start gap-3">
                      <Globe2 className="mt-1 h-5 w-5 text-neutral-500" />
                      <div>
                        <p className="text-base font-medium text-white">
                          等待用户发起解析
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
