"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  Copy,
  Download,
  Globe2,
  Languages,
  LoaderCircle,
  Mail,
  RotateCcw,
} from "lucide-react";
import { explainText } from "@/lib/api";
import { useAuthSession } from "@/lib/auth";
import { ExplainMode, ExplainResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatAccessStatus, formatPlanLabel } from "@/lib/utils";

type LanguageKey = "zh-CN" | "en" | "ko" | "ja";

type WorkspaceCopy = {
  heroLead: string;
  languageLabel: string;
  languageHelp: string;
  emailLabel: string;
  emailHelp: string;
  inputEyebrow: string;
  inputTitle: string;
  inputPlaceholder: string;
  resultEyebrow: string;
  resultTitle: string;
  resultWaitingTitle: string;
  resultWaitingBody: string;
  resultLoadingBody: string;
  outputLabel: string;
  downloads: {
    label: string;
    title: string;
    description: string;
    apple: string;
    windows: string;
    hint: string;
  };
  buttons: {
    explain: string;
    explaining: string;
    reset: string;
    copy: string;
    copied: string;
  };
  sections: {
    summary: string;
    deep: string;
    keywords: string;
    examples: string;
    takeaway: string;
    model: string;
    latency: string;
    noKeywords: string;
    noExamples: string;
  };
  errors: {
    needInput: string;
    inputTooLong: (limit: number) => string;
    invalidEmail: string;
    requestFailed: string;
  };
};

const UNIFIED_EXPLAIN_MODE: ExplainMode = "professional";
const MAX_INPUT_LENGTH = 3000;
const defaultText =
  "Self-attention enables each token to attend to every other token in parallel, which makes Transformers more scalable than recurrent architectures when modeling long-range dependencies.";
const PUBLIC_PREVIEW_NOTICE =
  "Current public preview exposes only the lightweight interaction layer of Navia-SBP. Core semantic breakpoint processing, interaction abstraction, and enterprise optimization modules operate within authorized deployment environments.";
const DESKTOP_DOWNLOADS = {
  apple: {
    href: "/downloads/navia-x-sbp-macos-apple-silicon.zip",
    fileName: "Navia-X-SBP-macOS-Apple-Silicon-0.1.0.zip",
  },
  windows: {
    href: "/downloads/navia-x-sbp-windows-installer.exe",
    fileName: "Navia-X-SBP-Setup-0.1.0.exe",
  },
} as const;

const languageOptions = [
  { value: "zh-CN", label: "简体中文", hint: "立即切换中文界面与中文解析结果" },
  { value: "en", label: "English", hint: "Switch the interface and explanation to English" },
  { value: "ko", label: "한국어", hint: "인터페이스와 해설 결과를 한국어로 전환" },
  { value: "ja", label: "日本語", hint: "画面表示と解析結果を日本語に切り替え" },
] as const;

const copyByLanguage: Record<LanguageKey, WorkspaceCopy> = {
  "zh-CN": {
    heroLead: "输入论文、代码或专业文本，立即得到结构化解释与重点拆解。",
    languageLabel: "输出语言",
    languageHelp: "切换后，界面立即更新；如果已有结果，系统会自动生成对应语言的新结果。",
    emailLabel: "当前账户",
    emailHelp: "显示当前登录账户与许可证状态。",
    inputEyebrow: "Input",
    inputTitle: "输入要解析的内容",
    inputPlaceholder: "粘贴你需要理解的句子、代码、论文段落或专业说明。",
    resultEyebrow: "Result",
    resultTitle: "解析结果",
    resultWaitingTitle: "等待开始解析",
    resultWaitingBody: "选择语言后，点击“开始解析”，系统会直接返回结构化解释结果。",
    resultLoadingBody: "正在根据当前语言重新生成结构化解释结果。",
    outputLabel: "当前语言",
    downloads: {
      label: "Desktop Download",
      title: "下载桌面端",
      description: "本地安装后即可直接使用。",
      apple: "Apple / macOS",
      windows: "Windows",
      hint: "当前提供 macOS Apple Silicon 与 Windows 安装包。",
    },
    buttons: {
      explain: "开始解析",
      explaining: "解析中",
      reset: "恢复示例",
      copy: "复制结果",
      copied: "已复制结果",
    },
    sections: {
      summary: "摘要",
      deep: "深度解释",
      keywords: "关键词",
      examples: "例句与应用",
      takeaway: "总结",
      model: "模型",
      latency: "延迟",
      noKeywords: "暂无关键词。",
      noExamples: "暂无例句。",
    },
    errors: {
      needInput: "请先输入需要解析的内容。",
      inputTooLong: (limit) => `单次输入最多 ${limit} 字，请缩短后再试。`,
      invalidEmail: "请输入有效邮箱地址，且不要使用 .local 域名。",
      requestFailed: "解释请求失败，请稍后再试。",
    },
  },
  en: {
    heroLead: "Paste papers, code, or technical text and get a structured explanation fast.",
    languageLabel: "Output language",
    languageHelp: "The interface updates immediately, and any existing result is regenerated in the newly selected language.",
    emailLabel: "Current account",
    emailHelp: "Shows the signed-in account and active license state.",
    inputEyebrow: "Input",
    inputTitle: "Text to explain",
    inputPlaceholder: "Paste the sentence, code, paper paragraph, or technical content you want to understand.",
    resultEyebrow: "Result",
    resultTitle: "Explanation",
    resultWaitingTitle: "Waiting to explain",
    resultWaitingBody: 'Choose a language and click "Explain" to get a structured response.',
    resultLoadingBody: "Generating a fresh explanation in the currently selected language.",
    outputLabel: "Selected language",
    downloads: {
      label: "Desktop Download",
      title: "Download Desktop",
      description: "Install locally and start using it right away.",
      apple: "Apple / macOS",
      windows: "Windows",
      hint: "Available now for macOS Apple Silicon and Windows.",
    },
    buttons: {
      explain: "Explain",
      explaining: "Explaining",
      reset: "Reset sample",
      copy: "Copy result",
      copied: "Copied",
    },
    sections: {
      summary: "Summary",
      deep: "Deep explanation",
      keywords: "Keywords",
      examples: "Examples",
      takeaway: "Takeaway",
      model: "Model",
      latency: "Latency",
      noKeywords: "No keywords yet.",
      noExamples: "No examples yet.",
    },
    errors: {
      needInput: "Please enter the content you want to explain first.",
      inputTooLong: (limit) =>
        `The input is limited to ${limit} characters. Please shorten it and try again.`,
      invalidEmail: "Please enter a valid email address and avoid .local domains.",
      requestFailed: "The explanation request failed. Please try again later.",
    },
  },
  ko: {
    heroLead: "논문, 코드, 전문 텍스트를 넣으면 구조화된 해설을 바로 받아볼 수 있습니다.",
    languageLabel: "출력 언어",
    languageHelp: "언어를 바꾸면 화면이 바로 전환되고, 기존 결과도 새 언어로 다시 생성됩니다.",
    emailLabel: "현재 계정",
    emailHelp: "로그인한 계정과 라이선스 상태를 표시합니다.",
    inputEyebrow: "Input",
    inputTitle: "해설할 내용 입력",
    inputPlaceholder: "이해하고 싶은 문장, 코드, 논문 단락 또는 전문 텍스트를 붙여 넣으세요.",
    resultEyebrow: "Result",
    resultTitle: "해설 결과",
    resultWaitingTitle: "해설 대기 중",
    resultWaitingBody: "언어를 선택한 뒤 “해설 시작”을 누르면 구조화된 결과가 바로 반환됩니다.",
    resultLoadingBody: "현재 선택한 언어에 맞춰 해설 결과를 다시 생성하고 있습니다.",
    outputLabel: "선택 언어",
    downloads: {
      label: "Desktop Download",
      title: "데스크톱 다운로드",
      description: "로컬에 설치한 뒤 바로 사용할 수 있습니다.",
      apple: "Apple / macOS",
      windows: "Windows",
      hint: "현재 macOS Apple Silicon 및 Windows 설치 패키지를 제공합니다.",
    },
    buttons: {
      explain: "해설 시작",
      explaining: "해설 중",
      reset: "예시 복원",
      copy: "결과 복사",
      copied: "복사 완료",
    },
    sections: {
      summary: "요약",
      deep: "심화 설명",
      keywords: "핵심어",
      examples: "예시와 활용",
      takeaway: "정리",
      model: "모델",
      latency: "지연",
      noKeywords: "핵심어가 없습니다.",
      noExamples: "예시가 없습니다.",
    },
    errors: {
      needInput: "먼저 해설할 내용을 입력해 주세요.",
      inputTooLong: (limit) =>
        `한 번에 최대 ${limit}자까지 입력할 수 있습니다. 내용을 줄여 주세요.`,
      invalidEmail: "유효한 이메일 주소를 입력하고 .local 도메인은 사용하지 마세요.",
      requestFailed: "해설 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    },
  },
  ja: {
    heroLead: "論文、コード、専門テキストを入れると、構造化された説明をすぐ返します。",
    languageLabel: "出力言語",
    languageHelp: "切り替えると画面がすぐ更新され、既存の結果も新しい言語で再生成されます。",
    emailLabel: "現在のアカウント",
    emailHelp: "ログイン中のアカウントとライセンス状態を表示します。",
    inputEyebrow: "Input",
    inputTitle: "解析したい内容",
    inputPlaceholder: "理解したい文章、コード、論文の段落、専門的な説明を貼り付けてください。",
    resultEyebrow: "Result",
    resultTitle: "解析結果",
    resultWaitingTitle: "解析待機中",
    resultWaitingBody: "言語を選択して「解析開始」を押すと、構造化された結果が返ります。",
    resultLoadingBody: "現在選択している言語に合わせて結果を再生成しています。",
    outputLabel: "選択言語",
    downloads: {
      label: "Desktop Download",
      title: "デスクトップ版をダウンロード",
      description: "ローカルにインストールしてすぐ使えます。",
      apple: "Apple / macOS",
      windows: "Windows",
      hint: "現在は macOS Apple Silicon と Windows のインストーラを提供しています。",
    },
    buttons: {
      explain: "解析開始",
      explaining: "解析中",
      reset: "サンプルに戻す",
      copy: "結果をコピー",
      copied: "コピー済み",
    },
    sections: {
      summary: "要約",
      deep: "詳しい説明",
      keywords: "キーワード",
      examples: "例文と活用",
      takeaway: "まとめ",
      model: "モデル",
      latency: "遅延",
      noKeywords: "キーワードはまだありません。",
      noExamples: "例文はまだありません。",
    },
    errors: {
      needInput: "まず解析したい内容を入力してください。",
      inputTooLong: (limit) =>
        `入力は最大 ${limit} 文字までです。短くしてから再試行してください。`,
      invalidEmail: "有効なメールアドレスを入力し、.local ドメインは使用しないでください。",
      requestFailed: "解析リクエストに失敗しました。しばらくしてからもう一度お試しください。",
    },
  },
};

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-blue-100 bg-slate-50/80 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
        {title}
      </p>
      <div className="mt-3 text-sm leading-7 text-slate-700">{children}</div>
    </div>
  );
}

export function ExplainerWorkspace() {
  const [text, setText] = useState(defaultText);
  const [outputLanguage, setOutputLanguage] = useState<LanguageKey>("zh-CN");
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const requestSerialRef = useRef(0);
  const { user, isAuthenticated } = useAuthSession();

  const copy = copyByLanguage[outputLanguage];
  const charCount = text.trim().length;
  const currentLanguage = languageOptions.find(
    (item) => item.value === outputLanguage
  );

  async function runExplain(nextLanguage: LanguageKey) {
    const nextCopy = copyByLanguage[nextLanguage];

    if (!text.trim()) {
      setError(nextCopy.errors.needInput);
      return;
    }

    if (text.trim().length > MAX_INPUT_LENGTH) {
      setError(nextCopy.errors.inputTooLong(MAX_INPUT_LENGTH));
      return;
    }

    if (!isAuthenticated) {
      setError("Please sign in and activate a valid license code first.");
      return;
    }

    const requestId = ++requestSerialRef.current;

    setCopied(false);
    setError("");
    setIsRunning(true);
    setResult(null);

    try {
      const response = await explainText({
        text,
        mode: UNIFIED_EXPLAIN_MODE,
        outputLanguage: nextLanguage,
      });

      if (requestId !== requestSerialRef.current) {
        return;
      }

      setResult(response);
    } catch (requestError) {
      if (requestId !== requestSerialRef.current) {
        return;
      }

      setResult(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : nextCopy.errors.requestFailed
      );
    } finally {
      if (requestId === requestSerialRef.current) {
        setIsRunning(false);
      }
    }
  }

  function handleExplain() {
    void runExplain(outputLanguage);
  }

  function handleLanguageChange(nextLanguage: LanguageKey) {
    if (nextLanguage === outputLanguage) {
      return;
    }

    setOutputLanguage(nextLanguage);
    setCopied(false);
    setError("");

    if (result || isRunning) {
      void runExplain(nextLanguage);
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
    requestSerialRef.current += 1;
    setText(defaultText);
    setResult(null);
    setError("");
    setCopied(false);
    setIsRunning(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_52%,#f8fbff_100%)] px-4 py-6 text-slate-900 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Card className="overflow-hidden border-blue-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,246,255,0.96))]">
          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
            <div className="rounded-[24px] border border-blue-100 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_48%),rgba(255,255,255,0.9)] px-5 py-4 shadow-float">
              <p className="text-[11px] uppercase tracking-[0.34em] text-blue-500">
                Public Preview
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">
                Navia-SBP Deployment Notice
              </h2>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-white/90 px-5 py-5">
              <div className="absolute inset-y-5 left-0 w-px bg-gradient-to-b from-transparent via-blue-400 to-transparent" />
              <p className="pl-5 font-mono text-sm leading-7 text-slate-700 lg:text-[15px]">
                {PUBLIC_PREVIEW_NOTICE}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-blue-100 bg-white/96 px-4 py-4 lg:px-5 lg:py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <h1 className="text-3xl font-semibold leading-tight text-slate-900 lg:text-[38px]">
                Navia-X (SBP): 把复杂内容讲清楚
              </h1>
              <p className="max-w-2xl text-sm leading-5 text-slate-600 lg:text-[14px]">
                {copy.heroLead}
              </p>
            </div>

            <div className="rounded-[22px] border border-blue-100 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(239,246,255,0.94))] px-4 py-3 shadow-panel lg:min-w-[440px]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-[linear-gradient(135deg,rgba(219,234,254,0.96),rgba(96,165,250,0.22))] text-blue-700 shadow-float">
                    <Download className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-blue-500">
                      {copy.downloads.label}
                    </p>
                    <p className="mt-1 text-[15px] font-semibold text-slate-900">
                      {copy.downloads.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-5 text-slate-600">
                      {copy.downloads.description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[246px]">
                  <a
                    href={DESKTOP_DOWNLOADS.apple.href}
                    download={DESKTOP_DOWNLOADS.apple.fileName}
                    className="inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-panel transition duration-200 hover:border-blue-200 hover:bg-blue-50"
                  >
                    {copy.downloads.apple}
                  </a>
                  <a
                    href={DESKTOP_DOWNLOADS.windows.href}
                    download={DESKTOP_DOWNLOADS.windows.fileName}
                    className="inline-flex items-center justify-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition duration-200 hover:border-blue-200 hover:bg-blue-100"
                  >
                    {copy.downloads.windows}
                  </a>
                </div>
              </div>

              <p className="mt-2 text-[11px] leading-4 text-slate-500 lg:pl-[52px]">
                {copy.downloads.hint}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <div className="space-y-6">
            <Card className="border-blue-100 bg-white/96">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="rounded-[24px] border border-blue-100 bg-slate-50/80 p-4">
                  <span className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Languages className="h-4 w-4 text-slate-500" />
                    {copy.languageLabel}
                  </span>
                  <select
                    value={outputLanguage}
                    onChange={(event) =>
                      handleLanguageChange(event.target.value as LanguageKey)
                    }
                    className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    {languageOptions.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    {copy.languageHelp}
                  </p>
                </label>

                <div className="rounded-[24px] border border-blue-100 bg-slate-50/80 p-4">
                  <span className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Mail className="h-4 w-4 text-slate-500" />
                    {copy.emailLabel}
                  </span>
                  <Input
                    value={
                      user
                        ? `${user.email} • ${formatPlanLabel(user.plan)} • ${formatAccessStatus(
                            user.accessStatus
                          )}`
                        : "Sign in required"
                    }
                    readOnly
                  />
                  <p className="mt-3 text-xs leading-6 text-slate-500">
                    {isAuthenticated ? (
                      <>
                        Daily limit: {user?.dailyUsageLimit ?? 0}. Manage access in{" "}
                        <Link href="/settings/billing" className="font-semibold text-blue-700">
                          billing
                        </Link>
                        .
                      </>
                    ) : (
                      <>
                        Sign in on the{" "}
                        <Link href="/login" className="font-semibold text-blue-700">
                          login page
                        </Link>{" "}
                        and activate a license code before using the protected explain API.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-blue-100 bg-white/96">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                      {copy.inputEyebrow}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      {copy.inputTitle}
                    </h2>
                  </div>
                  <div className="rounded-full border border-line bg-slate-50 px-4 py-2 text-sm text-slate-600">
                    {charCount} / {MAX_INPUT_LENGTH}
                  </div>
                </div>

                <Textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={copy.inputPlaceholder}
                  className="min-h-[320px]"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button onClick={handleExplain} disabled={isRunning || !isAuthenticated}>
                    {isRunning ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        {copy.buttons.explaining}
                      </>
                    ) : (
                      copy.buttons.explain
                    )}
                  </Button>
                  <Button variant="secondary" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {copy.buttons.reset}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void handleCopy()}
                    disabled={!result}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? copy.buttons.copied : copy.buttons.copy}
                  </Button>
                </div>

                {error ? (
                  <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-blue-100 bg-white/96">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                    {copy.resultEyebrow}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {copy.resultTitle}
                  </h2>
                </div>
                <div className="rounded-[22px] border border-line bg-slate-50 px-4 py-3 text-right text-xs text-slate-500">
                  <div>
                    {copy.outputLabel}：<span className="text-slate-900">{currentLanguage?.label}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {result ? (
                  <>
                    <ResultSection title={copy.sections.summary}>
                      <p>{result.summary}</p>
                    </ResultSection>
                    <ResultSection title={copy.sections.deep}>
                      <p>{result.deepExplanation}</p>
                    </ResultSection>
                    <ResultSection title={copy.sections.keywords}>
                      {result.keywords.length ? (
                        <div className="space-y-3">
                          {result.keywords.map((item) => (
                            <div
                              key={`${item.term}-${item.definition}`}
                              className="rounded-2xl border border-blue-100 bg-white px-4 py-3"
                            >
                              <p className="font-medium text-slate-900">{item.term}</p>
                              <p className="mt-1 text-slate-600">
                                {item.definition}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500">{copy.sections.noKeywords}</p>
                      )}
                    </ResultSection>
                    <ResultSection title={copy.sections.examples}>
                      {result.examples.length ? (
                        <ul className="space-y-3 pl-5">
                          {result.examples.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500">{copy.sections.noExamples}</p>
                      )}
                    </ResultSection>
                    <ResultSection title={copy.sections.takeaway}>
                      <p>{result.takeaway}</p>
                    </ResultSection>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[22px] border border-blue-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        {copy.sections.model}：<span className="text-slate-900">{result.model}</span>
                      </div>
                      <div className="rounded-[22px] border border-blue-100 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        {copy.sections.latency}：
                        <span className="text-slate-900"> {result.latencyMs} ms</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-blue-100 bg-slate-50/80 p-6">
                    <div className="flex items-start gap-3">
                      {isRunning ? (
                        <LoaderCircle className="mt-1 h-5 w-5 animate-spin text-slate-500" />
                      ) : (
                        <Globe2 className="mt-1 h-5 w-5 text-slate-500" />
                      )}
                      <div>
                        <p className="text-base font-medium text-slate-900">
                          {isRunning
                            ? copy.buttons.explaining
                            : copy.resultWaitingTitle}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-500">
                          {isRunning
                            ? copy.resultLoadingBody
                            : copy.resultWaitingBody}
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
