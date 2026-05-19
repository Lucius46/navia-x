const bubbleShell = document.querySelector("#bubbleShell");
const bubbleView = document.querySelector("#bubbleView");
const panelView = document.querySelector("#panelView");
const appShell = document.querySelector("#app");
const panelMain = document.querySelector(".panel-main");
const bubbleExpandButton = document.querySelector("#bubbleExpandButton");
const minimizeButton = document.querySelector("#minimizeButton");
const docsButton = document.querySelector("#docsButton");
const clipboardButton = document.querySelector("#clipboardButton");
const explainButton = document.querySelector("#explainButton");
const copyResultButton = document.querySelector("#copyResultButton");
const inputText = document.querySelector("#inputText");
const statusBar = document.querySelector("#statusBar");
const historyBoard = document.querySelector("#historyBoard");
const resultBoard = document.querySelector("#resultBoard");
const resultLabel = document.querySelector("#resultLabel");
const clipboardHint = document.querySelector("#clipboardHint");
const charCount = document.querySelector("#charCount");
const healthPill = document.querySelector("#healthPill");
const activeModeValue = document.querySelector("#activeModeValue");
const activeModeCopy = document.querySelector("#activeModeCopy");
const historySectionLabel = document.querySelector("#historySectionLabel");
const sourceSectionLabel = document.querySelector("#sourceSectionLabel");
const resultSectionLabel = document.querySelector("#resultSectionLabel");
const modeMenuButton = document.querySelector("#modeMenuButton");
const modeMenu = document.querySelector("#modeMenu");
const languageMenuButton = document.querySelector("#languageMenuButton");
const languageMenu = document.querySelector("#languageMenu");

const INPUT_LIMIT = 3000;
const DEFAULT_USER_EMAIL = "desktop@navia-x.ai";

function isSupportedUserEmail(value) {
  return typeof value === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) &&
    !/\.local$/i.test(value.trim());
}

function normalizeUserEmail(value) {
  return isSupportedUserEmail(value) ? value.trim() : DEFAULT_USER_EMAIL;
}

const modeCatalog = [
  {
    key: "quick",
    backendMode: "simple",
    label: {
      "zh-CN": "快速",
      en: "Quick",
      ko: "빠른",
      ja: "クイック"
    },
    subtitle: {
      "zh-CN": "先抓住一句话最核心的意思。",
      en: "Start with the main meaning in one line.",
      ko: "문장의 가장 핵심 의미부터 빠르게 잡습니다.",
      ja: "まず一文の中心的な意味を素早くつかみます。"
    }
  },
  {
    key: "student",
    backendMode: "exam",
    label: {
      "zh-CN": "学生",
      en: "Student",
      ko: "학생",
      ja: "学生"
    },
    subtitle: {
      "zh-CN": "更像老师讲题，适合抓重点和考点。",
      en: "Teacher-style explanation for key points and test focus.",
      ko: "선생님이 설명하듯 핵심과 시험 포인트를 짚어 줍니다.",
      ja: "先生のように重要点と試験ポイントを整理します。"
    }
  },
  {
    key: "expert",
    backendMode: "professor",
    label: {
      "zh-CN": "教授",
      en: "Professor",
      ko: "교수",
      ja: "教授"
    },
    subtitle: {
      "zh-CN": "以讲课风格解释概念、背景和推理过程。",
      en: "Lecture-style explanation with context and reasoning.",
      ko: "개념, 배경, 추론 과정을 강의식으로 설명합니다.",
      ja: "概念、背景、推論を講義風に説明します。"
    }
  },
  {
    key: "professional",
    backendMode: "professional",
    label: {
      "zh-CN": "专业",
      en: "Professional",
      ko: "전문",
      ja: "専門"
    },
    subtitle: {
      "zh-CN": "更正式、准确，适合工作场景和行业内容。",
      en: "More formal and precise for work and industry topics.",
      ko: "업무와 업계 문서에 맞춰 더 정확하고 정제된 설명을 제공합니다.",
      ja: "仕事や業界向けに、より正確で正式な説明を行います。"
    }
  },
  {
    key: "science",
    backendMode: "science",
    label: {
      "zh-CN": "科学",
      en: "Science",
      ko: "과학",
      ja: "科学"
    },
    subtitle: {
      "zh-CN": "偏机制、因果和结构拆解。",
      en: "Focus on mechanism, cause, and structure.",
      ko: "작동 원리, 인과관계, 구조 분해에 초점을 맞춥니다.",
      ja: "仕組み、因果、構造の分解に重点を置きます。"
    }
  },
  {
    key: "literature",
    backendMode: "literature",
    label: {
      "zh-CN": "文学",
      en: "Literature",
      ko: "문학",
      ja: "文学"
    },
    subtitle: {
      "zh-CN": "偏语言风格、语境和修辞理解。",
      en: "Focus on tone, context, and rhetoric.",
      ko: "문체, 맥락, 수사 표현을 중심으로 설명합니다.",
      ja: "文体、文脈、修辞の理解を重視します。"
    }
  },
  {
    key: "research",
    backendMode: "research",
    label: {
      "zh-CN": "论文",
      en: "Research",
      ko: "논문",
      ja: "論文"
    },
    subtitle: {
      "zh-CN": "更适合摘要、方法、实验和术语阅读。",
      en: "Better for abstracts, methods, experiments, and terms.",
      ko: "초록, 방법론, 실험, 용어 읽기에 적합합니다.",
      ja: "要旨、手法、実験、用語の読解に向いています。"
    }
  },
  {
    key: "code",
    backendMode: "code",
    label: {
      "zh-CN": "代码",
      en: "Code",
      ko: "코드",
      ja: "コード"
    },
    subtitle: {
      "zh-CN": "解释代码作用、调用关系和设计意图。",
      en: "Explain code purpose, calls, and design intent.",
      ko: "코드의 역할, 호출 관계, 설계 의도를 설명합니다.",
      ja: "コードの役割、呼び出し関係、設計意図を説明します。"
    }
  }
];

const languageCatalog = [
  {
    key: "zh-CN",
    short: {
      "zh-CN": "中文",
      en: "Chinese",
      ko: "중국어",
      ja: "中国語"
    },
    long: {
      "zh-CN": "简体中文",
      en: "Simplified Chinese",
      ko: "중국어(간체)",
      ja: "簡体字中国語"
    }
  },
  {
    key: "en",
    short: {
      "zh-CN": "英文",
      en: "English",
      ko: "영어",
      ja: "英語"
    },
    long: {
      "zh-CN": "English",
      en: "English",
      ko: "English",
      ja: "English"
    }
  },
  {
    key: "ko",
    short: {
      "zh-CN": "韩文",
      en: "Korean",
      ko: "한국어",
      ja: "韓国語"
    },
    long: {
      "zh-CN": "한국어",
      en: "Korean",
      ko: "한국어",
      ja: "한국어"
    }
  },
  {
    key: "ja",
    short: {
      "zh-CN": "日文",
      en: "Japanese",
      ko: "일본어",
      ja: "日本語"
    },
    long: {
      "zh-CN": "日本語",
      en: "Japanese",
      ko: "일본어",
      ja: "日本語"
    }
  }
];

const translations = {
  "zh-CN": {
    nav: {
      home: "主页",
      history: "历史",
      settings: "设置",
      modeButton: "模式"
    },
    sections: {
      overview: "剪贴板",
      source: "解释文本",
      result: "解释结果"
    },
    buttons: {
      clipboard: "抓取剪贴板",
      copy: "复制结果",
      explain: "开始解释",
      api: "接口",
      minimize: "最小化",
      open: "打开 Navia-X"
    },
    placeholder:
      "把你不理解的词语、句子、代码或论文段落放到这里。按 Enter 直接解释，Shift+Enter 换行。",
    pages: {
      home: {
        title: "主页",
        subtitle: "桌面悬浮球、解释入口和当前工作方式会显示在这里。"
      },
      history: {
        title: "历史",
        subtitle: "点击历史记录后，可以把文本重新带回右侧工作区。"
      },
      settings: {
        title: "设置",
        subtitle: "配置语言、主题、字体、快捷键和桌面自动化行为。"
      }
    },
    hints: {
      waiting: "等待剪贴板内容",
      autoImported: "已自动带入最新剪贴板内容",
      manualImported: "已抓取最新剪贴板内容",
      shortcutImported: "快捷键已导入剪贴板内容",
      detected: "检测到新的剪贴板文本",
      historyLoaded: (value) => `已载入历史记录 · ${value}`
    },
    overview: {
      online: (language) => `输出语言：${language}。后端已连接，可以直接返回完整解释。`,
      offline: (language) => `输出语言：${language}。后端未连通，解释请求暂时无法执行。`
    },
    status: {
      ready: "桌面解释器已准备好。单击悬浮球展开，或复制内容后按 Ctrl+Shift+E。",
      openImported: (source) => `${source}已展开，并自动带入了最新复制的内容。`,
      openPlain: (source) => `${source}已展开，可以直接输入内容或抓取剪贴板开始解释。`,
      noClipboard: "剪贴板里还没有可解释的文字。",
      importedClipboard: "已将剪贴板文字带入中央解释区。",
      needInput: "请先输入内容，或从剪贴板抓取要解释的文本。",
      inputTooLong: (limit) => `单次输入最多 ${limit} 字，请先缩短内容。`,
      invalidEmail: "请输入有效邮箱地址，且不要使用 .local 域名。",
      explaining: "正在调用后端解释服务...",
      explainDone: "解释完成，结果已同步到桌面历史。",
      fallback: (warning) => `后端不可用，解释请求失败。${warning}`,
      copiedEmpty: "还没有可复制的解释结果。",
      copiedDone: "解释结果已复制到系统剪贴板。",
      historyLoaded: "已载入这条历史，同时恢复到中央解释区。",
      historyTextOnly: "已带回历史文本预览。点击开始解释即可重新获取完整结果。",
      modeChanged: (modeLabel) => `已切换到 ${modeLabel} 模式。`,
      settingsSaved: "桌面设置已保存，并已重新加载历史与后端状态。",
      clipboardDetectedImported: "检测到新的复制内容，已自动带入解释区。",
      clipboardDetectedManual: "检测到新的复制内容，你可以点击“抓取剪贴板”手动带入。",
      shortcutImported: "已通过全局快捷键带入最新复制内容。"
    },
    result: {
      waiting: "等待开始解释",
      recentHistory: "最近历史",
      historyEmptyTitle: "还没有历史记录",
      historyEmptyBody: "完成一次解释后，这里会自动显示最近历史记录。",
      summary: "简明解释",
      deep: "深度解释",
      keywords: "关键词",
      examples: "例句与应用",
      takeaway: "总结",
      noKeywords: "暂无关键词。",
      noExamples: "暂无示例。",
      model: "模型",
      source: "来源",
      latency: "延迟",
      requestId: "请求 ID"
    },
    home: {
      bubbleTitle: "悬浮球",
      bubbleBody: "悬浮球固定尺寸，只保留 logo 和 Navia-X 字标。",
      modeTitle: "当前模式",
      modeBody: (label, subtitle) => `${label}：${subtitle}`,
      languageTitle: "输出语言",
      languageBody: (label) => `当前解释结果和界面会一起切换到 ${label}。`,
      resizeTitle: "缩放布局",
      resizeBody: "窗口缩放时，模块会像浏览器页面一样稳定贴满，不再留下上部空白。"
    },
    settings: {
      language: "界面与解释语言",
      languageHelp: "右上角语言按钮与这里会同步切换。",
      api: "API 地址",
      apiHelp: "桌面端所有解释都通过后端发起。",
      email: "用户邮箱",
      emailHelp: "历史和请求统计会按这个邮箱归档。",
      defaultMode: "默认模式",
      shortcut: "快捷键",
      shortcutHelp: "默认是 Ctrl+Shift+E，保存后会立即重新注册。",
      accent: "强调色",
      background: "背景",
      font: "字体大小",
      density: "信息密度",
      monitor: "监听剪贴板",
      monitorHelp: "持续监听新的复制内容。",
      autoImport: "自动带入",
      autoImportHelp: "检测到新剪贴板内容时，自动带入中央输入区。",
      autoCopy: "自动复制结果",
      autoCopyHelp: "解释完成后自动复制到系统剪贴板。",
      save: "保存设置",
      accentOptions: {
        ice: "冰蓝",
        silver: "银灰",
        ocean: "海青"
      },
      backgroundOptions: {
        aurora: "极光玻璃",
        obsidian: "曜石",
        graphite: "石墨"
      },
      fontOptions: {
        compact: "紧凑",
        comfortable: "舒适",
        large: "大号"
      },
      densityOptions: {
        compact: "紧凑",
        balanced: "平衡",
        rich: "丰富"
      }
    }
  },
  en: {
    nav: {
      home: "Home",
      history: "History",
      settings: "Settings",
      modeButton: "Mode"
    },
    sections: {
      overview: "Clipboard",
      source: "Text",
      result: "Explanation"
    },
    buttons: {
      clipboard: "Paste Clipboard",
      copy: "Copy Result",
      explain: "Explain",
      api: "API",
      minimize: "Minimize",
      open: "Open Navia-X"
    },
    placeholder:
      "Paste the word, sentence, code, or paper paragraph you want explained. Press Enter to explain and Shift+Enter for a new line.",
    pages: {
      home: {
        title: "Home",
        subtitle: "The floating ball, entry flow, and current workspace state appear here."
      },
      history: {
        title: "History",
        subtitle: "Click a past explanation to load it back into the workspace."
      },
      settings: {
        title: "Settings",
        subtitle: "Configure language, theme, fonts, shortcuts, and automation behavior."
      }
    },
    hints: {
      waiting: "Waiting for clipboard text",
      autoImported: "Latest clipboard text imported automatically",
      manualImported: "Latest clipboard text imported",
      shortcutImported: "Clipboard text imported by shortcut",
      detected: "New clipboard text detected",
      historyLoaded: (value) => `History loaded · ${value}`
    },
    overview: {
      online: (language) => `Output language: ${language}. Backend is connected and ready.`,
      offline: (language) =>
        `Output language: ${language}. The backend is offline, so explanation requests are temporarily unavailable.`
    },
    status: {
      ready: "The desktop explainer is ready. Click the floating ball or press Ctrl+Shift+E after copying text.",
      openImported: (source) => `${source} opened and imported the latest copied text automatically.`,
      openPlain: (source) => `${source} opened. You can type directly or import clipboard text.`,
      noClipboard: "There is no explainable text in the clipboard yet.",
      importedClipboard: "Clipboard text has been loaded into the input area.",
      needInput: "Please enter some text or import it from the clipboard first.",
      inputTooLong: (limit) => `Each request is limited to ${limit} characters. Please shorten the text first.`,
      invalidEmail: "Please enter a valid email address and avoid .local domains.",
      explaining: "Calling the backend explanation service...",
      explainDone: "Explanation finished and synced to desktop history.",
      fallback: (warning) => `Backend unavailable. The explanation request failed. ${warning}`,
      copiedEmpty: "There is no explanation result to copy yet.",
      copiedDone: "The explanation result has been copied to the clipboard.",
      historyLoaded: "This history entry has been restored to the workspace.",
      historyTextOnly: "The history text preview has been restored. Explain again to get a fresh structured result.",
      modeChanged: (modeLabel) => `Switched to ${modeLabel} mode.`,
      settingsSaved: "Desktop settings were saved and data was reloaded.",
      clipboardDetectedImported: "New copied text was detected and imported automatically.",
      clipboardDetectedManual: "New copied text was detected. You can import it manually.",
      shortcutImported: "The latest copied text was imported by the global shortcut."
    },
    result: {
      waiting: "Waiting to explain",
      recentHistory: "Recent History",
      historyEmptyTitle: "No history yet",
      historyEmptyBody: "After your first explanation, recent records will appear here automatically.",
      summary: "Summary",
      deep: "Deep Explanation",
      keywords: "Keywords",
      examples: "Examples",
      takeaway: "Takeaway",
      noKeywords: "No keywords yet.",
      noExamples: "No examples yet.",
      model: "Model",
      source: "Source",
      latency: "Latency",
      requestId: "Request ID"
    },
    home: {
      bubbleTitle: "Floating Ball",
      bubbleBody: "The floating ball keeps a fixed size and shows only the logo and Navia-X wordmark.",
      modeTitle: "Current Mode",
      modeBody: (label, subtitle) => `${label}: ${subtitle}`,
      languageTitle: "Output Language",
      languageBody: (label) => `Both the UI and explanations switch to ${label}.`,
      resizeTitle: "Responsive Layout",
      resizeBody: "When the window resizes, the layout stays filled like a browser page without empty space at the top."
    },
    settings: {
      language: "UI and output language",
      languageHelp: "The top-right language button and this field stay in sync.",
      api: "API Base URL",
      apiHelp: "All desktop explanations go through the backend endpoint.",
      email: "User email",
      emailHelp: "History and request usage are grouped under this test user.",
      defaultMode: "Default mode",
      shortcut: "Shortcut",
      shortcutHelp: "Default is Ctrl+Shift+E and it is re-registered on save.",
      accent: "Accent color",
      background: "Background",
      font: "Font size",
      density: "Information density",
      monitor: "Monitor clipboard",
      monitorHelp: "Continuously watch for new copied text.",
      autoImport: "Auto import",
      autoImportHelp: "Bring newly copied text into the input area automatically.",
      autoCopy: "Auto copy result",
      autoCopyHelp: "Copy the explanation result automatically after it finishes.",
      save: "Save settings",
      accentOptions: {
        ice: "Ice",
        silver: "Silver",
        ocean: "Ocean"
      },
      backgroundOptions: {
        aurora: "Aurora Glass",
        obsidian: "Obsidian",
        graphite: "Graphite"
      },
      fontOptions: {
        compact: "Compact",
        comfortable: "Comfortable",
        large: "Large"
      },
      densityOptions: {
        compact: "Compact",
        balanced: "Balanced",
        rich: "Rich"
      }
    }
  },
  ko: {
    nav: {
      home: "홈",
      history: "기록",
      settings: "설정",
      modeButton: "모드"
    },
    sections: {
      overview: "클립보드",
      source: "설명할 텍스트",
      result: "설명 결과"
    },
    buttons: {
      clipboard: "클립보드 가져오기",
      copy: "결과 복사",
      explain: "설명 시작",
      api: "API",
      minimize: "최소화",
      open: "Navia-X 열기"
    },
    placeholder:
      "이해가 어려운 단어, 문장, 코드, 논문 문단을 여기에 넣으세요. Enter로 설명하고 Shift+Enter로 줄바꿈합니다.",
    pages: {
      home: {
        title: "홈",
        subtitle: "플로팅 볼, 설명 진입 흐름, 현재 작업 상태가 여기에 표시됩니다."
      },
      history: {
        title: "기록",
        subtitle: "이전 설명을 클릭하면 오른쪽 작업 영역으로 다시 가져올 수 있습니다."
      },
      settings: {
        title: "설정",
        subtitle: "언어, 테마, 글꼴, 단축키, 자동화 동작을 설정합니다."
      }
    },
    hints: {
      waiting: "클립보드 텍스트 대기 중",
      autoImported: "최신 클립보드 텍스트를 자동으로 불러왔습니다",
      manualImported: "최신 클립보드 텍스트를 불러왔습니다",
      shortcutImported: "단축키로 클립보드 텍스트를 불러왔습니다",
      detected: "새 클립보드 텍스트가 감지되었습니다",
      historyLoaded: (value) => `기록 불러옴 · ${value}`
    },
    overview: {
      online: (language) => `출력 언어: ${language}. 백엔드가 연결되어 있습니다.`,
      offline: (language) =>
        `출력 언어: ${language}. 백엔드가 연결되지 않아 설명 요청을 실행할 수 없습니다.`
    },
    status: {
      ready: "데스크톱 설명기가 준비되었습니다. 플로팅 볼을 누르거나, 복사 후 Ctrl+Shift+E를 누르세요.",
      openImported: (source) => `${source}이(가) 열렸고 최신 복사 내용을 자동으로 가져왔습니다.`,
      openPlain: (source) => `${source}이(가) 열렸습니다. 직접 입력하거나 클립보드 내용을 가져올 수 있습니다.`,
      noClipboard: "설명할 수 있는 클립보드 텍스트가 아직 없습니다.",
      importedClipboard: "클립보드 텍스트를 입력 영역으로 가져왔습니다.",
      needInput: "먼저 텍스트를 입력하거나 클립보드에서 가져오세요.",
      inputTooLong: (limit) => `한 번에 최대 ${limit}자까지 입력할 수 있습니다. 내용을 줄여 주세요.`,
      invalidEmail: "유효한 이메일 주소를 입력하고 .local 도메인은 사용하지 마세요.",
      explaining: "백엔드 설명 서비스를 호출하고 있습니다...",
      explainDone: "설명이 완료되었고 데스크톱 기록에 저장되었습니다.",
      fallback: (warning) => `백엔드를 사용할 수 없어 설명 요청에 실패했습니다. ${warning}`,
      copiedEmpty: "복사할 설명 결과가 아직 없습니다.",
      copiedDone: "설명 결과를 클립보드에 복사했습니다.",
      historyLoaded: "이 기록을 다시 작업 영역으로 불러왔습니다.",
      historyTextOnly: "기록 텍스트만 불러왔습니다. 다시 설명하면 최신 구조화 결과를 받을 수 있습니다.",
      modeChanged: (modeLabel) => `${modeLabel} 모드로 전환했습니다.`,
      settingsSaved: "설정이 저장되었고 데이터가 다시 로드되었습니다.",
      clipboardDetectedImported: "새로 복사한 텍스트를 감지해 자동으로 가져왔습니다.",
      clipboardDetectedManual: "새로 복사한 텍스트를 감지했습니다. 수동으로 가져올 수 있습니다.",
      shortcutImported: "전역 단축키로 최신 복사 내용을 가져왔습니다."
    },
    result: {
      waiting: "설명 대기 중",
      recentHistory: "최근 기록",
      historyEmptyTitle: "기록이 아직 없습니다",
      historyEmptyBody: "첫 설명을 완료하면 최근 기록이 여기에 자동으로 표시됩니다.",
      summary: "요약 설명",
      deep: "심화 설명",
      keywords: "핵심어",
      examples: "예시와 활용",
      takeaway: "정리",
      noKeywords: "핵심어가 아직 없습니다.",
      noExamples: "예시가 아직 없습니다.",
      model: "모델",
      source: "출처",
      latency: "지연",
      requestId: "요청 ID"
    },
    home: {
      bubbleTitle: "플로팅 볼",
      bubbleBody: "플로팅 볼은 고정 크기이며 logo와 Navia-X만 표시합니다.",
      modeTitle: "현재 모드",
      modeBody: (label, subtitle) => `${label}: ${subtitle}`,
      languageTitle: "출력 언어",
      languageBody: (label) => `설명 결과와 인터페이스가 함께 ${label}(으)로 바뀝니다.`,
      resizeTitle: "반응형 레이아웃",
      resizeBody: "창 크기를 바꿔도 브라우저처럼 상단 공백 없이 안정적으로 채워집니다."
    },
    settings: {
      language: "인터페이스 및 출력 언어",
      languageHelp: "오른쪽 위 언어 버튼과 여기 설정이 함께 바뀝니다.",
      api: "API 주소",
      apiHelp: "데스크톱 설명 요청은 모두 백엔드를 통해 전송됩니다.",
      email: "사용자 이메일",
      emailHelp: "기록과 사용량 통계는 이 테스트 사용자 기준으로 저장됩니다.",
      defaultMode: "기본 모드",
      shortcut: "단축키",
      shortcutHelp: "기본값은 Ctrl+Shift+E이며 저장 시 다시 등록됩니다.",
      accent: "포인트 색상",
      background: "배경",
      font: "글꼴 크기",
      density: "정보 밀도",
      monitor: "클립보드 감시",
      monitorHelp: "새로 복사된 텍스트를 계속 감지합니다.",
      autoImport: "자동 가져오기",
      autoImportHelp: "새 클립보드 텍스트를 자동으로 입력 영역에 넣습니다.",
      autoCopy: "결과 자동 복사",
      autoCopyHelp: "설명이 끝나면 결과를 자동으로 클립보드에 복사합니다.",
      save: "설정 저장",
      accentOptions: {
        ice: "아이스",
        silver: "실버",
        ocean: "오션"
      },
      backgroundOptions: {
        aurora: "오로라 글래스",
        obsidian: "옵시디언",
        graphite: "그래파이트"
      },
      fontOptions: {
        compact: "좁게",
        comfortable: "보통",
        large: "크게"
      },
      densityOptions: {
        compact: "좁게",
        balanced: "균형",
        rich: "풍부"
      }
    }
  },
  ja: {
    nav: {
      home: "ホーム",
      history: "履歴",
      settings: "設定",
      modeButton: "モード"
    },
    sections: {
      overview: "クリップボード",
      source: "説明するテキスト",
      result: "説明結果"
    },
    buttons: {
      clipboard: "クリップボード取得",
      copy: "結果をコピー",
      explain: "説明開始",
      api: "API",
      minimize: "最小化",
      open: "Navia-X を開く"
    },
    placeholder:
      "わからない単語、文章、コード、論文の段落をここに入れてください。Enter で説明、Shift+Enter で改行します。",
    pages: {
      home: {
        title: "ホーム",
        subtitle: "フローティングボール、説明の入口、現在の作業状態がここに表示されます。"
      },
      history: {
        title: "履歴",
        subtitle: "過去の説明をクリックすると、右側の作業領域に戻せます。"
      },
      settings: {
        title: "設定",
        subtitle: "言語、テーマ、フォント、ショートカット、自動化動作を設定します。"
      }
    },
    hints: {
      waiting: "クリップボードのテキストを待機中",
      autoImported: "最新のクリップボード内容を自動で取り込みました",
      manualImported: "最新のクリップボード内容を取り込みました",
      shortcutImported: "ショートカットでクリップボード内容を取り込みました",
      detected: "新しいクリップボード内容を検出しました",
      historyLoaded: (value) => `履歴を読み込みました · ${value}`
    },
    overview: {
      online: (language) => `出力言語: ${language}。バックエンドは接続済みです。`,
      offline: (language) =>
        `出力言語: ${language}。バックエンドに接続できないため、説明リクエストを実行できません。`
    },
    status: {
      ready: "デスクトップ説明ツールの準備ができました。フローティングボールをクリックするか、コピー後に Ctrl+Shift+E を押してください。",
      openImported: (source) => `${source}を開き、最新のコピー内容を自動で取り込みました。`,
      openPlain: (source) => `${source}を開きました。直接入力するか、クリップボード内容を取り込めます。`,
      noClipboard: "説明できるクリップボードのテキストがまだありません。",
      importedClipboard: "クリップボード内容を入力欄に取り込みました。",
      needInput: "まずテキストを入力するか、クリップボードから取り込んでください。",
      inputTooLong: (limit) => `1 回の入力は最大 ${limit} 文字です。先に内容を短くしてください。`,
      invalidEmail: "有効なメールアドレスを入力し、.local ドメインは使用しないでください。",
      explaining: "バックエンド説明サービスを呼び出しています...",
      explainDone: "説明が完了し、デスクトップ履歴に同期されました。",
      fallback: (warning) => `バックエンドが使えないため、説明リクエストに失敗しました。${warning}`,
      copiedEmpty: "コピーできる説明結果がまだありません。",
      copiedDone: "説明結果をクリップボードにコピーしました。",
      historyLoaded: "この履歴を作業領域に戻しました。",
      historyTextOnly: "履歴テキストだけを戻しました。再度説明すると最新の構造化結果を取得できます。",
      modeChanged: (modeLabel) => `${modeLabel} モードに切り替えました。`,
      settingsSaved: "設定を保存し、データを再読み込みしました。",
      clipboardDetectedImported: "新しいコピー内容を検出し、自動で取り込みました。",
      clipboardDetectedManual: "新しいコピー内容を検出しました。手動で取り込めます。",
      shortcutImported: "グローバルショートカットで最新のコピー内容を取り込みました。"
    },
    result: {
      waiting: "説明待機中",
      recentHistory: "最近の履歴",
      historyEmptyTitle: "履歴はまだありません",
      historyEmptyBody: "最初の説明を完了すると、ここに最近の履歴が自動で表示されます。",
      summary: "要点説明",
      deep: "詳しい説明",
      keywords: "キーワード",
      examples: "例と活用",
      takeaway: "まとめ",
      noKeywords: "キーワードはまだありません。",
      noExamples: "例はまだありません。",
      model: "モデル",
      source: "ソース",
      latency: "遅延",
      requestId: "リクエスト ID"
    },
    home: {
      bubbleTitle: "フローティングボール",
      bubbleBody: "フローティングボールは固定サイズで、logo と Navia-X だけを表示します。",
      modeTitle: "現在のモード",
      modeBody: (label, subtitle) => `${label}: ${subtitle}`,
      languageTitle: "出力言語",
      languageBody: (label) => `説明結果と UI の両方が ${label} に切り替わります。`,
      resizeTitle: "レスポンシブ配置",
      resizeBody: "ウィンドウを拡大縮小しても、ブラウザのページのように上部の空白なく安定して表示されます。"
    },
    settings: {
      language: "UI と出力言語",
      languageHelp: "右上の言語ボタンとこの設定は同期します。",
      api: "API URL",
      apiHelp: "デスクトップ説明はすべてバックエンド経由で送信されます。",
      email: "ユーザー Email",
      emailHelp: "履歴と使用量統計はこのテストユーザーでまとめられます。",
      defaultMode: "既定モード",
      shortcut: "ショートカット",
      shortcutHelp: "既定は Ctrl+Shift+E で、保存時に再登録されます。",
      accent: "アクセントカラー",
      background: "背景",
      font: "フォントサイズ",
      density: "情報密度",
      monitor: "クリップボード監視",
      monitorHelp: "新しくコピーされたテキストを継続的に監視します。",
      autoImport: "自動取り込み",
      autoImportHelp: "新しいクリップボード内容を自動で入力欄に入れます。",
      autoCopy: "結果を自動コピー",
      autoCopyHelp: "説明完了後に結果を自動でクリップボードへコピーします。",
      save: "設定を保存",
      accentOptions: {
        ice: "アイス",
        silver: "シルバー",
        ocean: "オーシャン"
      },
      backgroundOptions: {
        aurora: "オーロラガラス",
        obsidian: "オブシディアン",
        graphite: "グラファイト"
      },
      fontOptions: {
        compact: "コンパクト",
        comfortable: "標準",
        large: "大きい"
      },
      densityOptions: {
        compact: "コンパクト",
        balanced: "バランス",
        rich: "豊富"
      }
    }
  }
};

const accentThemes = {
  ice: {
    accent: "#7dd3fc",
    accentDeep: "#2563eb",
    accentSoft: "rgba(125, 211, 252, 0.18)",
    panelGlow: "rgba(59, 130, 246, 0.18)"
  },
  silver: {
    accent: "#cbd5e1",
    accentDeep: "#64748b",
    accentSoft: "rgba(203, 213, 225, 0.18)",
    panelGlow: "rgba(148, 163, 184, 0.18)"
  },
  ocean: {
    accent: "#5eead4",
    accentDeep: "#0f766e",
    accentSoft: "rgba(94, 234, 212, 0.18)",
    panelGlow: "rgba(20, 184, 166, 0.18)"
  }
};

const backgroundThemes = {
  aurora: {
    bgTop: "rgba(7, 12, 26, 0.94)",
    bgBottom: "rgba(4, 9, 20, 0.91)"
  },
  obsidian: {
    bgTop: "rgba(10, 10, 16, 0.96)",
    bgBottom: "rgba(4, 7, 14, 0.92)"
  },
  graphite: {
    bgTop: "rgba(18, 23, 35, 0.94)",
    bgBottom: "rgba(8, 11, 20, 0.91)"
  }
};

const fontScales = {
  compact: "15px",
  comfortable: "16px",
  large: "17px"
};

const state = {
  settings: null,
  activePage: "home",
  currentModeKey: "quick",
  history: [],
  usage: null,
  health: null,
  historySource: "local",
  lastResult: null,
  isExplaining: false,
  clipboardHint: {
    kind: "waiting",
    value: ""
  },
  openMenu: null
};

let lastRenderedText = "";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getLocale() {
  return state.settings?.outputLanguage || "zh-CN";
}

function getUi() {
  return translations[getLocale()] || translations["zh-CN"];
}

function getModeByKey(modeKey) {
  return modeCatalog.find((item) => item.key === modeKey) || modeCatalog[0];
}

function getModeLabel(modeOrKey) {
  const mode = typeof modeOrKey === "string" ? getModeByKey(modeOrKey) : modeOrKey;
  return mode.label[getLocale()] || mode.label["zh-CN"];
}

function getModeSubtitle(modeOrKey) {
  const mode = typeof modeOrKey === "string" ? getModeByKey(modeOrKey) : modeOrKey;
  return mode.subtitle[getLocale()] || mode.subtitle["zh-CN"];
}

function getLanguageByKey(languageKey) {
  return languageCatalog.find((item) => item.key === languageKey) || languageCatalog[0];
}

function getLanguageShort(languageKey) {
  const language = getLanguageByKey(languageKey);
  return language.short[getLocale()] || language.short["zh-CN"];
}

function getLanguageLong(languageKey) {
  const language = getLanguageByKey(languageKey);
  return language.long[getLocale()] || language.long["zh-CN"];
}

function getHealthLabel(isOnline) {
  const locale = getLocale();
  const labels = {
    "zh-CN": {
      online: "后端在线",
      offline: "后端离线"
    },
    en: {
      online: "Backend Ready",
      offline: "Backend Offline"
    },
    ko: {
      online: "백엔드 연결",
      offline: "백엔드 오프라인"
    },
    ja: {
      online: "バックエンド接続",
      offline: "バックエンド未接続"
    }
  };

  const copy = labels[locale] || labels["zh-CN"];
  return isOnline ? copy.online : copy.offline;
}

function resolveModeKey(rawMode) {
  const direct = modeCatalog.find((item) => item.key === rawMode);
  if (direct) {
    return direct.key;
  }

  const fromBackend = modeCatalog.find((item) => item.backendMode === rawMode);
  return fromBackend ? fromBackend.key : "quick";
}

function setStatus(text, tone = "info") {
  if (typeof text === "string") {
    statusBar.textContent = text;
  } else if (text instanceof Error) {
    statusBar.textContent = text.message;
  } else {
    statusBar.textContent = String(text ?? "");
  }
  statusBar.dataset.tone = tone;
}

function setWindowMode(mode) {
  const isPanel = mode === "panel";
  bubbleView.classList.toggle("panel-hidden", isPanel);
  panelView.classList.toggle("panel-hidden", !isPanel);
  appShell.classList.toggle("shell-panel", isPanel);
  appShell.classList.toggle("shell-bubble", !isPanel);
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat(getLocale(), {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value || "";
  }
}

function buildClipboardText(result) {
  const ui = getUi();
  const keywords = Array.isArray(result.keywords)
    ? result.keywords.map((item) => `${item.term}: ${item.definition}`).join("\n")
    : "";
  const examples = Array.isArray(result.examples) ? result.examples.join("\n") : "";

  return [
    result.summary || "",
    result.deep_explanation || "",
    keywords ? `${ui.result.keywords}\n${keywords}` : "",
    examples ? `${ui.result.examples}\n${examples}` : "",
    result.takeaway || ""
  ]
    .filter(Boolean)
    .join("\n\n");
}

function applyAppearance() {
  if (!state.settings) {
    return;
  }

  const accentTheme = accentThemes[state.settings.themeAccent] || accentThemes.ice;
  const backgroundTheme =
    backgroundThemes[state.settings.backgroundStyle] || backgroundThemes.aurora;

  document.body.style.setProperty("--accent", accentTheme.accent);
  document.body.style.setProperty("--accent-deep", accentTheme.accentDeep);
  document.body.style.setProperty("--accent-soft", accentTheme.accentSoft);
  document.body.style.setProperty("--panel-glow", accentTheme.panelGlow);
  document.body.style.setProperty("--bg-top", backgroundTheme.bgTop);
  document.body.style.setProperty("--bg-bottom", backgroundTheme.bgBottom);
  document.body.style.setProperty(
    "--root-font-size",
    fontScales[state.settings.fontScale] || fontScales.comfortable
  );
}

function updateCharCount() {
  const length = inputText.value.length;
  charCount.textContent = `${length} / ${INPUT_LIMIT}`;
  charCount.style.color = length > INPUT_LIMIT ? "var(--danger)" : "";
}

function setClipboardHint(kind, value = "") {
  state.clipboardHint = { kind, value };
  renderClipboardHint();
}

function renderClipboardHint() {
  const ui = getUi();
  const hint = state.clipboardHint;

  if (hint.kind === "autoImported") {
    clipboardHint.textContent = ui.hints.autoImported;
    return;
  }

  if (hint.kind === "manualImported") {
    clipboardHint.textContent = ui.hints.manualImported;
    return;
  }

  if (hint.kind === "shortcutImported") {
    clipboardHint.textContent = ui.hints.shortcutImported;
    return;
  }

  if (hint.kind === "detected") {
    clipboardHint.textContent = ui.hints.detected;
    return;
  }

  if (hint.kind === "historyLoaded") {
    clipboardHint.textContent = ui.hints.historyLoaded(hint.value || "");
    return;
  }

  clipboardHint.textContent = ui.hints.waiting;
}

function setInputValue(value, hintKind = "manualImported", hintValue = "") {
  inputText.value = value;
  setClipboardHint(hintKind, hintValue);
  updateCharCount();
}

function focusInput() {
  requestAnimationFrame(() => {
    inputText.focus();
    try {
      inputText.setSelectionRange(inputText.value.length, inputText.value.length);
    } catch {
      // Ignore selection failures in non-text contexts.
    }
  });
}

async function maybeImportClipboardOnOpen() {
  if (!state.settings?.autoImportClipboard || inputText.value.trim()) {
    return false;
  }

  const value = await window.naviaDesktop.getClipboardText();
  if (!value) {
    return false;
  }

  setInputValue(value, "autoImported");
  return true;
}

async function openPanelFromBubble(triggerSource = "Navia-X") {
  const ui = getUi();
  setWindowMode("panel");
  await window.naviaDesktop.setWindowMode("panel");

  const imported = await maybeImportClipboardOnOpen().catch(() => false);
  focusInput();
  setStatus(
    imported ? ui.status.openImported(triggerSource) : ui.status.openPlain(triggerSource),
    imported ? "success" : "info"
  );
}

function closeMenus() {
  state.openMenu = null;
  modeMenu.classList.add("menu-hidden");
  languageMenu.classList.add("menu-hidden");
  modeMenuButton.setAttribute("aria-expanded", "false");
  languageMenuButton.setAttribute("aria-expanded", "false");
}

function toggleMenu(menuName) {
  if (state.openMenu === menuName) {
    closeMenus();
    return;
  }

  closeMenus();
  state.openMenu = menuName;

  if (menuName === "mode") {
    modeMenu.classList.remove("menu-hidden");
    modeMenuButton.setAttribute("aria-expanded", "true");
    return;
  }

  languageMenu.classList.remove("menu-hidden");
  languageMenuButton.setAttribute("aria-expanded", "true");
}

function renderMenus() {
  const currentMode = getModeByKey(state.currentModeKey);
  const modeButtonLabel =
    typeof getUi().nav.modeButton === "function"
      ? getUi().nav.modeButton(getModeLabel(currentMode))
      : getUi().nav.modeButton;

  modeMenuButton.textContent = modeButtonLabel;
  languageMenuButton.textContent = getLanguageShort(state.settings.outputLanguage);

  modeMenu.innerHTML = modeCatalog
    .map((mode) => {
      const activeClass = mode.key === state.currentModeKey ? "active" : "";
      return `
        <button type="button" class="menu-option ${activeClass}" data-mode-key="${escapeHtml(mode.key)}">
          <strong>${escapeHtml(getModeLabel(mode))}</strong>
          <span>${escapeHtml(getModeSubtitle(mode))}</span>
        </button>
      `;
    })
    .join("");

  languageMenu.innerHTML = languageCatalog
    .map((language) => {
      const activeClass = language.key === state.settings.outputLanguage ? "active" : "";
      return `
        <button
          type="button"
          class="menu-option ${activeClass}"
          data-language-key="${escapeHtml(language.key)}"
        >
          <strong>${escapeHtml(getLanguageLong(language.key))}</strong>
          <span>${escapeHtml(language.long["en"] || language.long["zh-CN"])}</span>
        </button>
      `;
    })
    .join("");
}

function renderNavState() {
  renderMenus();
}

function renderOverview() {
  const currentMode = getModeByKey(state.currentModeKey);
  const backendOnline = (state.health?.status || "offline") !== "offline";

  activeModeValue.textContent = getModeLabel(currentMode);
  activeModeCopy.textContent = getModeSubtitle(currentMode);
  healthPill.textContent = getHealthLabel(backendOnline);
}

function renderHistoryList(historyItems, allowEmpty = true) {
  const ui = getUi();

  if (!historyItems.length && allowEmpty) {
    return `
      <div class="empty-state">
        <div>
          <h3>${escapeHtml(ui.result.historyEmptyTitle)}</h3>
          <p>${escapeHtml(ui.result.historyEmptyBody)}</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="history-grid">
      ${historyItems
        .map(
          (item, index) => `
            <button type="button" class="history-item" data-history-index="${index}">
              <strong>${escapeHtml(item.textPreview || item.inputText || "Untitled")}</strong>
              <div class="history-meta">
                <span class="history-badge">${escapeHtml(
                  getModeLabel(resolveModeKey(item.backendMode || item.mode))
                )}</span>
                <span class="history-badge">${escapeHtml(formatDate(item.createdAt))}</span>
              </div>
              <p>${escapeHtml(item.summary || item.takeaway || item.source || "")}</p>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderStaticText() {
  const ui = getUi();
  sourceSectionLabel.textContent = ui.sections.source;
  historySectionLabel.textContent = ui.nav.history;
  resultSectionLabel.textContent = ui.sections.result;
  clipboardButton.textContent = ui.buttons.clipboard;
  copyResultButton.textContent = ui.buttons.copy;
  explainButton.textContent = ui.buttons.explain;
  docsButton.textContent = ui.buttons.api;
  minimizeButton.setAttribute("aria-label", ui.buttons.minimize);
  bubbleExpandButton.setAttribute("aria-label", ui.buttons.open);
  inputText.placeholder = ui.placeholder;
}

function renderLayoutState() {
  const shouldFocusResult = state.isExplaining || Boolean(state.lastResult);
  panelMain.classList.toggle("result-priority", shouldFocusResult);
}

function renderResultBoard() {
  const ui = getUi();

  if (!state.lastResult) {
    resultLabel.textContent = state.isExplaining ? ui.status.explaining : ui.result.waiting;
    resultBoard.innerHTML = `
      <div class="empty-state">
        <div>
          <h3>${escapeHtml(state.isExplaining ? ui.status.explaining : ui.result.waiting)}</h3>
          <p>${escapeHtml(state.isExplaining ? ui.status.explaining : ui.status.ready)}</p>
        </div>
      </div>
    `;
    lastRenderedText = "";
    return;
  }

  const result = state.lastResult;
  resultLabel.textContent = getModeLabel(state.currentModeKey);

  const keywordList = Array.isArray(result.keywords)
    ? result.keywords
        .map(
          (item) =>
            `<li><strong>${escapeHtml(item.term || ui.result.keywords)}</strong>：${escapeHtml(item.definition || "")}</li>`
        )
        .join("")
    : "";

  const exampleList = Array.isArray(result.examples)
    ? result.examples.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "";

  resultBoard.innerHTML = `
    <div class="result-grid">
      <article class="result-card">
        <h3>${escapeHtml(ui.result.summary)}</h3>
        <p>${escapeHtml(result.summary || "")}</p>
      </article>
      <article class="result-card">
        <h3>${escapeHtml(ui.result.deep)}</h3>
        <p>${escapeHtml(result.deep_explanation || "")}</p>
      </article>
      <article class="result-card">
        <h3>${escapeHtml(ui.result.keywords)}</h3>
        ${keywordList ? `<ul>${keywordList}</ul>` : `<p>${escapeHtml(ui.result.noKeywords)}</p>`}
      </article>
      <article class="result-card">
        <h3>${escapeHtml(ui.result.examples)}</h3>
        ${exampleList ? `<ul>${exampleList}</ul>` : `<p>${escapeHtml(ui.result.noExamples)}</p>`}
      </article>
      <article class="result-card result-card-wide">
        <h3>${escapeHtml(ui.result.takeaway)}</h3>
        <p>${escapeHtml(result.takeaway || "")}</p>
        <div class="result-meta">
          <div class="meta-pill">${escapeHtml(ui.result.model)}: ${escapeHtml(
            result.meta?.model || "unknown"
          )}</div>
          <div class="meta-pill">${escapeHtml(ui.result.source)}: ${escapeHtml(
            result.meta?.provider || "desktop"
          )}</div>
          <div class="meta-pill">${escapeHtml(ui.result.latency)}: ${escapeHtml(
            String(result.meta?.latency_ms || 0)
          )} ms</div>
          <div class="meta-pill">${escapeHtml(ui.result.requestId)}: ${escapeHtml(
            result.meta?.request_id || "N/A"
          )}</div>
        </div>
      </article>
    </div>
  `;

  lastRenderedText = buildClipboardText(result);
  resultBoard.scrollTop = 0;
}

function renderHistoryBoard() {
  historyBoard.innerHTML = renderHistoryList(state.history);
}

function renderAll() {
  applyAppearance();
  updateCharCount();
  renderStaticText();
  renderClipboardHint();
  renderOverview();
  renderLayoutState();
  renderNavState();
  renderHistoryBoard();
  renderResultBoard();
}

function normalizeLastResultFromHistory(item) {
  if (!item.summary) {
    return null;
  }

  return {
    summary: item.summary,
    deep_explanation: item.summary,
    keywords: [],
    examples: [],
    takeaway: item.takeaway || "",
    meta: {
      model: item.model || "desktop-history",
      provider: item.provider || "desktop",
      latency_ms: item.latencyMs || 0,
      request_id: item.id
    }
  };
}

async function loadSettings() {
  state.settings = await window.naviaDesktop.getSettings();
  if (!state.settings.outputLanguage) {
    state.settings.outputLanguage = "zh-CN";
  }
  state.currentModeKey = resolveModeKey(state.settings.defaultMode);
  applyAppearance();
}

async function refreshDashboardData() {
  if (!state.settings) {
    return;
  }

  const payload = {
    apiBaseUrl: state.settings.apiBaseUrl,
    userEmail: state.settings.userEmail,
    limit: 40
  };

  const [historyResponse, usageResponse, healthResponse] = await Promise.all([
    window.naviaDesktop.getHistory(payload),
    window.naviaDesktop.getUsage(payload),
    window.naviaDesktop.getHealth(payload)
  ]);

  state.history = Array.isArray(historyResponse?.data) ? historyResponse.data : [];
  state.usage = usageResponse?.data || null;
  state.health = healthResponse?.data || null;
  state.historySource = historyResponse?.source || "local";
}

async function persistSettingsPatch(patch) {
  state.settings = await window.naviaDesktop.saveSettings(patch);
  if (!state.settings.outputLanguage) {
    state.settings.outputLanguage = "zh-CN";
  }
  state.currentModeKey = resolveModeKey(state.settings.defaultMode);
  applyAppearance();
}

async function saveSettingsFromForm() {
  const ui = getUi();
  const outputLanguageInput = document.querySelector("#outputLanguageInput");
  const apiBaseInput = document.querySelector("#apiBaseInput");
  const userEmailInput = document.querySelector("#userEmailInput");
  const defaultModeInput = document.querySelector("#defaultModeInput");
  const shortcutInput = document.querySelector("#shortcutInput");
  const themeAccentInput = document.querySelector("#themeAccentInput");
  const backgroundStyleInput = document.querySelector("#backgroundStyleInput");
  const fontScaleInput = document.querySelector("#fontScaleInput");
  const responseDensityInput = document.querySelector("#responseDensityInput");
  const monitorClipboardInput = document.querySelector("#monitorClipboardInput");
  const autoImportClipboardInput = document.querySelector("#autoImportClipboardInput");
  const autoCopyResultInput = document.querySelector("#autoCopyResultInput");

  await persistSettingsPatch({
    outputLanguage: outputLanguageInput.value,
    apiBaseUrl: apiBaseInput.value.trim() || "http://127.0.0.1:8001",
    userEmail: normalizeUserEmail(userEmailInput.value.trim() || DEFAULT_USER_EMAIL),
    defaultMode: defaultModeInput.value,
    globalShortcut: shortcutInput.value.trim() || "CommandOrControl+Shift+E",
    themeAccent: themeAccentInput.value,
    backgroundStyle: backgroundStyleInput.value,
    fontScale: fontScaleInput.value,
    responseDensity: responseDensityInput.value,
    monitorClipboard: monitorClipboardInput.checked,
    autoImportClipboard: autoImportClipboardInput.checked,
    autoCopyResult: autoCopyResultInput.checked
  });

  await refreshDashboardData();
  renderAll();
  setStatus(ui.status.settingsSaved, "success");
}

async function importClipboardText() {
  const ui = getUi();
  const value = await window.naviaDesktop.getClipboardText();

  if (!value) {
    setStatus(ui.status.noClipboard, "error");
    return;
  }

  setInputValue(value, "manualImported");
  focusInput();
  setStatus(ui.status.importedClipboard, "success");
}

async function explainText() {
  const ui = getUi();
  const text = inputText.value.trim();

  if (!text) {
    setStatus(ui.status.needInput, "error");
    return;
  }

  if (text.length > INPUT_LIMIT) {
    setStatus(ui.status.inputTooLong(INPUT_LIMIT), "error");
    return;
  }

  const mode = getModeByKey(state.currentModeKey);
  const userEmail = normalizeUserEmail(state.settings.userEmail);

  if (!isSupportedUserEmail(userEmail)) {
    setStatus(ui.status.invalidEmail, "error");
    return;
  }

  state.isExplaining = true;
  explainButton.disabled = true;
  renderAll();
  setStatus(ui.status.explaining, "info");

  try {
    const response = await window.naviaDesktop.runExplain({
      apiBaseUrl: state.settings.apiBaseUrl,
      text,
      mode: mode.backendMode,
      modeLabel: getModeLabel(mode),
      userEmail,
      outputLanguage: state.settings.outputLanguage,
      outputLanguageLabel: getLanguageLong(state.settings.outputLanguage)
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Explain request failed.");
    }

    state.lastResult = response.data;
    state.isExplaining = false;

    if (response.historyEntry) {
      state.history = [response.historyEntry, ...state.history].slice(0, 40);
    }

    await refreshDashboardData();
    renderAll();

    if (state.settings.autoCopyResult && lastRenderedText) {
      await navigator.clipboard.writeText(lastRenderedText);
    }

    setStatus(ui.status.explainDone, "success");
  } catch (error) {
    state.isExplaining = false;
    renderAll();
    setStatus(error instanceof Error ? error.message : "Explain request failed.", "error");
  } finally {
    explainButton.disabled = false;
  }
}

async function copyResult() {
  const ui = getUi();
  if (!lastRenderedText) {
    setStatus(ui.status.copiedEmpty, "error");
    return;
  }

  await navigator.clipboard.writeText(lastRenderedText);
  setStatus(ui.status.copiedDone, "success");
}

function loadHistoryEntry(index) {
  const ui = getUi();
  const item = state.history[index];
  if (!item) {
    return;
  }

  setInputValue(item.inputText || item.textPreview || "", "historyLoaded", formatDate(item.createdAt));
  const nextModeKey = resolveModeKey(item.backendMode || item.mode);
  state.currentModeKey = nextModeKey;
  const historyResult = normalizeLastResultFromHistory(item);

  if (historyResult) {
    state.lastResult = historyResult;
  }

  renderAll();

  if (historyResult) {
    setStatus(ui.status.historyLoaded, "success");
  } else {
    setStatus(ui.status.historyTextOnly, "info");
  }
}

async function handleModeChange(modeKey) {
  const nextModeKey = resolveModeKey(modeKey);
  state.currentModeKey = nextModeKey;
  await persistSettingsPatch({ defaultMode: nextModeKey });
  renderAll();
  closeMenus();
  setStatus(getUi().status.modeChanged(getModeLabel(nextModeKey)), "info");
}

async function handleLanguageChange(languageKey) {
  await persistSettingsPatch({ outputLanguage: languageKey });
  renderAll();
  closeMenus();
  setStatus(getUi().status.ready, "info");
}

bubbleExpandButton.addEventListener("click", async () => {
  await openPanelFromBubble("Navia-X");
});

bubbleExpandButton.addEventListener("keydown", async (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    await openPanelFromBubble("Navia-X");
  }
});

bubbleShell.addEventListener("dblclick", async (event) => {
  if (event.target.closest(".bubble-action")) {
    return;
  }

  await openPanelFromBubble("Navia-X");
});

minimizeButton.addEventListener("click", async () => {
  setWindowMode("bubble");
  await window.naviaDesktop.setWindowMode("bubble");
});

docsButton.addEventListener("click", async () => {
  await window.naviaDesktop.openLink(
    `${state.settings.apiBaseUrl.replace(/\/$/, "")}/docs`
  );
});

clipboardButton.addEventListener("click", () => {
  void importClipboardText();
});

copyResultButton.addEventListener("click", () => {
  void copyResult();
});

explainButton.addEventListener("click", () => {
  void explainText();
});

modeMenuButton.addEventListener("click", () => {
  toggleMenu("mode");
});

languageMenuButton.addEventListener("click", () => {
  toggleMenu("language");
});

modeMenu.addEventListener("click", (event) => {
  const target = event.target.closest("[data-mode-key]");
  if (!target) {
    return;
  }

  void handleModeChange(target.dataset.modeKey);
});

languageMenu.addEventListener("click", (event) => {
  const target = event.target.closest("[data-language-key]");
  if (!target) {
    return;
  }

  void handleLanguageChange(target.dataset.languageKey);
});

resultBoard.addEventListener("click", (event) => {
  const historyTarget = event.target.closest("[data-history-index]");
  if (!historyTarget) {
    return;
  }

  loadHistoryEntry(Number(historyTarget.dataset.historyIndex));
});

historyBoard.addEventListener("click", (event) => {
  const historyTarget = event.target.closest("[data-history-index]");
  if (!historyTarget) {
    return;
  }

  loadHistoryEntry(Number(historyTarget.dataset.historyIndex));
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".menu-wrap")) {
    return;
  }

  closeMenus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenus();
  }
});

inputText.addEventListener("input", () => {
  updateCharCount();
});

inputText.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    void explainText();
  }
});

window.naviaDesktop.onClipboardImported((payload) => {
  setWindowMode("panel");

  if (payload.text) {
    setInputValue(payload.text, "shortcutImported");
    focusInput();
    setStatus(getUi().status.shortcutImported, "success");
  }
});

window.naviaDesktop.onClipboardDetected((payload) => {
  if (!payload?.text) {
    return;
  }

  if (payload.autoImport) {
    setInputValue(payload.text, "autoImported");
    setStatus(getUi().status.clipboardDetectedImported, "info");
    return;
  }

  setClipboardHint("detected");
  setStatus(getUi().status.clipboardDetectedManual, "info");
});

window.naviaDesktop.onModeChanged((payload) => {
  setWindowMode(payload.mode);
  if (payload.mode === "panel") {
    focusInput();
  }
});

void loadSettings()
  .then(async () => {
    setWindowMode("bubble");
    setClipboardHint("waiting");
    await refreshDashboardData();
    renderAll();
    setStatus(getUi().status.ready, "info");
  })
  .catch((error) => {
    setStatus(error instanceof Error ? error.message : "Desktop init failed.", "error");
  });
