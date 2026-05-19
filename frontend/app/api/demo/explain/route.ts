import { NextResponse } from "next/server";

function formatMockExplanation(inputText: string, mode: string) {
  return {
    summary: `这是“${mode}”模式下的简明解释：${inputText.slice(0, 120)}${inputText.length > 120 ? "..." : ""}`,
    deep_explanation:
      "这段内容的核心在于，它先提出一个重要概念，再说明这个概念如何影响整体理解。MVP 中这里会由 FastAPI 后端调用真实模型返回更完整的多段解释。",
    keywords: [
      {
        term: "核心概念",
        definition: "整段文字里最需要先搞懂的主轴。"
      },
      {
        term: "因果关系",
        definition: "说明为什么会这样，以及这样之后带来什么结果。"
      },
      {
        term: "应用场景",
        definition: "把概念放回真实情境，帮助理解使用方式。"
      }
    ],
    examples: [
      "如果把它讲给初学者听，可以先从整体目标讲起，再拆成几个步骤。",
      "如果放在考试或论文语境里，优先抓定义、机制、优缺点和实际影响。"
    ],
    takeaway:
      "先理解它解决什么问题，再理解它是怎么做的，最后记住它适合用在什么场景。",
    meta: {
      model: "demo-local-route",
      latency_ms: 640
    }
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const inputText = String(body.input_text ?? "").trim();
  const mode = String(body.mode ?? "simple");

  if (!inputText) {
    return NextResponse.json(
      { detail: "请输入需要解释的文本。" },
      { status: 400 }
    );
  }

  if (inputText.length > 3000) {
    return NextResponse.json(
      { detail: "单次输入最多 3000 字。" },
      { status: 400 }
    );
  }

  return NextResponse.json(formatMockExplanation(inputText, mode));
}
