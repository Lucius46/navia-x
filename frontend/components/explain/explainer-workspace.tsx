"use client";

import { useRef, useState } from "react";
import {
  Copy,
  Globe2,
  Languages,
  LoaderCircle,
  Mail,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { explainText } from "@/lib/api";
import { ExplainMode, ExplainResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type LanguageKey = "zh-CN" | "en" | "ko" | "ja";

type WorkspaceCopy = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  assistantLabel: string;
  assistantTagline: string;
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
const DEFAULT_USER_EMAIL = "web@navia-x.ai";
const MAX_INPUT_LENGTH = 3000;
const defaultText =
  "Self-attention enables each token to attend to every other token in parallel, which makes Transformers more scalable than recurrent architectures when modeling long-range dependencies.";

const languageOptions = [
  { value: "zh-CN", label: "简体中文", hint: "立即切换中文界面与中文解析结果" },
  { value: "en", label: "English", hint: "Switch the interface and explanation to English" },
  { value: "ko", label: "한국어", hint: "인터페이스와 해설 결과를 한국어로 전환" },
  { value: "ja", label: "日本語", hint: "画面表示と解析結果を日本語に切り替え" },
] as const;

const copyByLanguage: Record<LanguageKey, WorkspaceCopy> = {
  "zh-CN": {
    heroEyebrow: "LLM Explainer",
    heroTitle: "把复杂内容讲清楚",
    heroSubtitle:
      "选择语言后，界面会立即同步切换，并为论文、代码、概念和专业文本返回清晰的结构化解释。",
    assistantLabel: "AI Assistant",
    assistantTagline: "你的大模型助手",
    languageLabel: "输出语言",
    languageHelp: "切换后，界面立即更新；如果已有结果，系统会自动生成对应语言的新结果。",
    emailLabel: "用户邮箱",
    emailHelp: "用于同步你的解析记录与使用信息。",
    inputEyebrow: "Input",
    inputTitle: "输入要解析的内容",
    inputPlaceholder: "粘贴你需要理解的句子、代码、论文段落或专业说明。",
    resultEyebrow: "Result",
    resultTitle: "解析结果",
    resultWaitingTitle: "等待开始解析",
    resultWaitingBody: "选择语言后，点击“开始解析”，系统会直接返回结构化解释结果。",
    resultLoadingBody: "正在根据当前语言重新生成结构化解释结果。",
    outputLabel: "当前语言",
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
    heroEyebrow: "LLM Explainer",
    heroTitle: "Make complex content easy to understand",
    heroSubtitle:
      "Switch the language and the interface updates immediately, while papers, code, concepts, and technical text are turned into clear structured explanations.",
    assistantLabel: "AI Assistant",
    assistantTagline: "Your LLM Assistant",
    languageLabel: "Output language",
    languageHelp: "The interface updates immediately, and any existing result is regenerated in the newly selected language.",
    emailLabel: "User email",
    emailHelp: "Used to sync your history and usage records.",
    inputEyebrow: "Input",
    inputTitle: "Text to explain",
    inputPlaceholder: "Paste the sentence, code, paper paragraph, or technical content you want to understand.",
    resultEyebrow: "Result",
    resultTitle: "Explanation",
    resultWaitingTitle: "Waiting to explain",
    resultWaitingBody: 'Choose a language and click "Explain" to get a structured response.',
    resultLoadingBody: "Generating a fresh explanation in the currently selected language.",
    outputLabel: "Selected language",
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
    heroEyebrow: "LLM Explainer",
    heroTitle: "복잡한 내용을 더 쉽게 이해하세요",
    heroSubtitle:
      "언어를 바꾸면 화면이 즉시 함께 바뀌고, 논문·코드·개념·전문 텍스트를 구조화된 해설로 정리해 줍니다.",
    assistantLabel: "AI Assistant",
    assistantTagline: "당신의 LLM 도우미",
    languageLabel: "출력 언어",
    languageHelp: "언어를 바꾸면 화면이 바로 전환되고, 기존 결과도 새 언어로 다시 생성됩니다.",
    emailLabel: "사용자 이메일",
    emailHelp: "해설 기록과 사용 정보를 동기화할 때 사용합니다.",
    inputEyebrow: "Input",
    inputTitle: "해설할 내용 입력",
    inputPlaceholder: "이해하고 싶은 문장, 코드, 논문 단락 또는 전문 텍스트를 붙여 넣으세요.",
    resultEyebrow: "Result",
    resultTitle: "해설 결과",
    resultWaitingTitle: "해설 대기 중",
    resultWaitingBody: "언어를 선택한 뒤 “해설 시작”을 누르면 구조화된 결과가 바로 반환됩니다.",
    resultLoadingBody: "현재 선택한 언어에 맞춰 해설 결과를 다시 생성하고 있습니다.",
    outputLabel: "선택 언어",
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
    heroEyebrow: "LLM Explainer",
    heroTitle: "複雑な内容をもっと分かりやすく",
    heroSubtitle:
      "言語を切り替えると画面表示がすぐ更新され、論文・コード・概念・専門文書を分かりやすい構造化結果に整えます。",
    assistantLabel: "AI Assistant",
    assistantTagline: "あなたのLLMアシスタント",
    languageLabel: "出力言語",
    languageHelp: "切り替えると画面がすぐ更新され、既存の結果も新しい言語で再生成されます。",
    emailLabel: "ユーザーEmail",
    emailHelp: "解析履歴と利用情報の同期に使用します。",
    inputEyebrow: "Input",
    inputTitle: "解析したい内容",
    inputPlaceholder: "理解したい文章、コード、論文の段落、専門的な説明を貼り付けてください。",
    resultEyebrow: "Result",
    resultTitle: "解析結果",
    resultWaitingTitle: "解析待機中",
    resultWaitingBody: "言語を選択して「解析開始」を押すと、構造化された結果が返ります。",
    resultLoadingBody: "現在選択している言語に合わせて結果を再生成しています。",
    outputLabel: "選択言語",
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
  const [outputLanguage, setOutputLanguage] = useState<LanguageKey>("zh-CN");
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const requestSerialRef = useRef(0);

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

    const normalizedEmail = userEmail.trim() || DEFAULT_USER_EMAIL;

    if (!isSupportedUserEmail(normalizedEmail)) {
      setError(nextCopy.errors.invalidEmail);
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
        userEmail: normalizedEmail,
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_24%),linear-gradient(180deg,#121212_0%,#171717_48%,#0d0d0d_100%)] px-4 py-6 text-neutral-100 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <Card className="border-neutral-800 bg-neutral-900/95">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.34em] text-neutral-500">
                {copy.heroEyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white lg:text-4xl">
                {copy.heroTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-400">
                {copy.heroSubtitle}
              </p>
            </div>

            <div className="self-start rounded-[28px] border border-neutral-700 bg-neutral-800/90 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#d4d4d8,#737373)] text-neutral-950 shadow-[0_14px_30px_rgba(90,90,90,0.3)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-500">
                    {copy.assistantLabel}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {copy.assistantTagline}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <div className="space-y-6">
            <Card className="border-neutral-800 bg-neutral-900/95">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="rounded-[24px] border border-neutral-700 bg-neutral-800 p-4">
                  <span className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-200">
                    <Languages className="h-4 w-4 text-neutral-400" />
                    {copy.languageLabel}
                  </span>
                  <select
                    value={outputLanguage}
                    onChange={(event) =>
                      handleLanguageChange(event.target.value as LanguageKey)
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
                    {copy.languageHelp}
                  </p>
                </label>

                <label className="rounded-[24px] border border-neutral-700 bg-neutral-800 p-4">
                  <span className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-200">
                    <Mail className="h-4 w-4 text-neutral-400" />
                    {copy.emailLabel}
                  </span>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(event) => setUserEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                  <p className="mt-3 text-xs leading-6 text-neutral-500">
                    {copy.emailHelp}
                  </p>
                </label>
              </div>
            </Card>

            <Card className="border-neutral-800 bg-neutral-900/95">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                      {copy.inputEyebrow}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {copy.inputTitle}
                    </h2>
                  </div>
                  <div className="rounded-full border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-neutral-300">
                    {charCount} / {MAX_INPUT_LENGTH}
                  </div>
                </div>

                <Textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={copy.inputPlaceholder}
                  className="min-h-[320px] bg-neutral-800"
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button onClick={handleExplain} disabled={isRunning}>
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
                    {copy.resultEyebrow}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {copy.resultTitle}
                  </h2>
                </div>
                <div className="rounded-[22px] border border-neutral-700 bg-neutral-800 px-4 py-3 text-right text-xs text-neutral-400">
                  <div>
                    {copy.outputLabel}：<span className="text-neutral-200">{currentLanguage?.label}</span>
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
                        <p className="text-neutral-400">{copy.sections.noKeywords}</p>
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
                        <p className="text-neutral-400">{copy.sections.noExamples}</p>
                      )}
                    </ResultSection>
                    <ResultSection title={copy.sections.takeaway}>
                      <p>{result.takeaway}</p>
                    </ResultSection>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[22px] border border-neutral-700 bg-neutral-800 px-4 py-4 text-sm text-neutral-300">
                        {copy.sections.model}：<span className="text-white">{result.model}</span>
                      </div>
                      <div className="rounded-[22px] border border-neutral-700 bg-neutral-800 px-4 py-4 text-sm text-neutral-300">
                        {copy.sections.latency}：
                        <span className="text-white"> {result.latencyMs} ms</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-neutral-700 bg-neutral-800/60 p-6">
                    <div className="flex items-start gap-3">
                      {isRunning ? (
                        <LoaderCircle className="mt-1 h-5 w-5 animate-spin text-neutral-500" />
                      ) : (
                        <Globe2 className="mt-1 h-5 w-5 text-neutral-500" />
                      )}
                      <div>
                        <p className="text-base font-medium text-white">
                          {isRunning
                            ? copy.buttons.explaining
                            : copy.resultWaitingTitle}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-neutral-400">
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
