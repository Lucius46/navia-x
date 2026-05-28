const {
  app,
  BrowserWindow,
  clipboard,
  globalShortcut,
  ipcMain,
  nativeImage,
  screen,
  shell,
  Tray
} = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const DESKTOP_BRAND = "Navia-X (SBP)";
const BUBBLE_BOUNDS = { width: 204, height: 66 };
const PANEL_BOUNDS = { width: 430, height: 820 };
const PANEL_MIN_BOUNDS = { width: 360, height: 560 };
const LOCAL_HISTORY_LIMIT = 200;
const DEFAULT_USER_EMAIL = "desktop@navia-x.ai";
const FALLBACK_TRAY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAvUlEQVR4Ae3XQQrCQBQE0N0/6dq7JXqIQkNCSvJfM8TxN2gKT6cCaWbGTJLb8QMAAAAAAAAAAAB4T9NNifB7v8t6m7M3b6p8dW4k6at1Y8lX2h4Ww8nqSlw7KrH7qV6m0HG4n4f+1mV1vLJt4ifYVgU5c4c4j5o6oYQFqf3lH6YgM4p+SqfJpHk0mA8RkUtj8c2I7vScO1g2l6VqUj7lqvS2g9r3F8R3Uttp0NZ9b6p9Eax8uZ7J9a6E5n8GdBrxwM+1m3r2p3gl9S2g2zSgQAAAAAAAAAA4M8FQw0IgT8H5GoAAAAASUVORK5CYII=";
const DEFAULT_SETTINGS = {
  apiBaseUrl: "http://127.0.0.1:8001",
  defaultMode: "quick",
  userEmail: DEFAULT_USER_EMAIL,
  monitorClipboard: true,
  autoImportClipboard: true,
  autoCopyResult: false,
  globalShortcut: "CommandOrControl+Shift+E",
  outputLanguage: "zh-CN",
  themeAccent: "silver",
  backgroundStyle: "graphite",
  fontScale: "comfortable",
  responseDensity: "balanced"
};

let mainWindow = null;
let tray = null;
let currentMode = "bubble";
let lastPanelBounds = { ...PANEL_BOUNDS };
let lastClipboardText = "";
let logFilePath = "";
const SMOKE_MODE_MARKER = path.join(__dirname, "..", ".smoke-mode");
const IS_SMOKE_MODE =
  fs.existsSync(SMOKE_MODE_MARKER) ||
  process.argv.includes("--smoke-test") ||
  process.env.NAVIA_X_SMOKE === "1";
const SMOKE_ARTIFACTS_DIR = path.join(__dirname, "..", ".artifacts");

if (IS_SMOKE_MODE) {
  process.stdout.write("[navia-smoke] bootstrap\n");
}

function initLogging() {
  try {
    logFilePath = getUserDataFile("navia-x-desktop.log");
    fs.appendFileSync(logFilePath, `\n[${new Date().toISOString()}] boot\n`, "utf-8");
  } catch {
    logFilePath = "";
  }
}

function writeLog(message, detail = "") {
  const line = `[${new Date().toISOString()}] ${message}${detail ? ` ${detail}` : ""}\n`;

  try {
    if (!logFilePath) {
      initLogging();
    }

    if (logFilePath) {
      fs.appendFileSync(logFilePath, line, "utf-8");
    }
  } catch {
    // Ignore logging failures so they do not cascade into app startup failures.
  }
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getUserDataFile(fileName) {
  return path.join(app.getPath("userData"), fileName);
}

function readJsonFile(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
}

function isSupportedUserEmail(value) {
  return typeof value === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) &&
    !/\.local$/i.test(value.trim());
}

function normalizeUserEmail(value) {
  return isSupportedUserEmail(value) ? value.trim() : DEFAULT_USER_EMAIL;
}

function formatErrorDetail(detail, fallback = "Explain request failed") {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          if (typeof item.msg === "string") {
            return item.msg;
          }

          if (typeof item.message === "string") {
            return item.message;
          }
        }

        return "";
      })
      .filter(Boolean);

    if (messages.length) {
      return messages.join("; ");
    }
  }

  if (detail && typeof detail === "object") {
    if (detail.detail !== undefined) {
      return formatErrorDetail(detail.detail, fallback);
    }

    if (typeof detail.message === "string") {
      return detail.message;
    }
  }

  return fallback;
}

function readSettings() {
  const filePath = getUserDataFile("navia-x-settings.json");
  const saved = readJsonFile(filePath, {});
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    userEmail: normalizeUserEmail(saved.userEmail || DEFAULT_SETTINGS.userEmail)
  };
}

function saveSettings(nextSettings) {
  const filePath = getUserDataFile("navia-x-settings.json");
  const merged = { ...DEFAULT_SETTINGS, ...readSettings(), ...nextSettings };
  merged.userEmail = normalizeUserEmail(merged.userEmail);
  writeJsonFile(filePath, merged);
  return merged;
}

function readLocalHistory() {
  const filePath = getUserDataFile("navia-x-history.json");
  const items = readJsonFile(filePath, []);
  return Array.isArray(items) ? items : [];
}

function writeLocalHistory(items) {
  const filePath = getUserDataFile("navia-x-history.json");
  writeJsonFile(filePath, items.slice(0, LOCAL_HISTORY_LIMIT));
}

function saveLocalHistoryEntry(payload, response, warning = "") {
  const entry = {
    id: `local_${Date.now()}`,
    createdAt: new Date().toISOString(),
    userEmail: payload.userEmail,
    mode: payload.modeLabel || payload.mode,
    backendMode: payload.mode,
    source: warning ? "桌面离线回退" : "桌面解释",
    textPreview: payload.text.slice(0, 120),
    inputText: payload.text,
    model: response?.meta?.model || "navia-x-desktop-mock",
    provider: response?.meta?.provider || "local-fallback",
    latencyMs: response?.meta?.latency_ms || 0,
    status: warning ? "fallback" : "success",
    summary: response?.summary || "",
    takeaway: response?.takeaway || "",
    warning
  };
  const history = readLocalHistory().filter((item) => item.id !== entry.id);
  writeLocalHistory([entry, ...history]);
  return entry;
}

function normalizeRemoteHistoryItem(item) {
  return {
    id: item.id,
    createdAt: item.created_at,
    userEmail: item.user_email,
    mode: item.mode,
    backendMode: item.mode,
    source: item.source,
    textPreview: item.text_preview,
    inputText: item.text_preview,
    model: item.model,
    provider: "backend",
    latencyMs: 0,
    status: item.status,
    summary: "",
    takeaway: "",
    warning: "",
    origin: "remote"
  };
}

function normalizeLocalHistoryItem(item) {
  return {
    id: item.id,
    createdAt: item.createdAt,
    userEmail: item.userEmail,
    mode: item.mode,
    backendMode: item.backendMode || item.mode,
    source: item.source || "桌面解释",
    textPreview: item.textPreview || "",
    inputText: item.inputText || item.textPreview || "",
    model: item.model || "navia-x-desktop-mock",
    provider: item.provider || "local-fallback",
    latencyMs: item.latencyMs || 0,
    status: item.status || "success",
    summary: item.summary || "",
    takeaway: item.takeaway || "",
    warning: item.warning || "",
    origin: "local"
  };
}

function buildHistoryFingerprint(item) {
  const minuteBucket = String(item.createdAt || "").slice(0, 16);
  const statusBucket = item.status === "fallback" ? "fallback" : "synced";
  return `${item.textPreview}::${item.backendMode}::${minuteBucket}::${statusBucket}`;
}

function mergeHistory(remoteItems, localItems, userEmail, limit) {
  const normalizedRemote = remoteItems.map(normalizeRemoteHistoryItem);
  const normalizedLocal = localItems
    .map(normalizeLocalHistoryItem)
    .filter((item) => !userEmail || item.userEmail === userEmail);

  const merged = [...normalizedLocal, ...normalizedRemote].sort((left, right) =>
    String(right.createdAt).localeCompare(String(left.createdAt))
  );

  const seen = new Set();
  const deduped = [];

  for (const item of merged) {
    const fingerprint = buildHistoryFingerprint(item);
    if (seen.has(fingerprint)) {
      continue;
    }
    seen.add(fingerprint);
    deduped.push(item);
    if (deduped.length >= limit) {
      break;
    }
  }

  return deduped;
}

function buildLocalUsage(localHistory, userEmail) {
  const today = new Date();
  const isToday = (value) => {
    const date = new Date(value);
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };
  const rows = localHistory.filter((item) => (!userEmail || item.userEmail === userEmail) && isToday(item.createdAt));
  const successful = rows.filter((item) => item.status !== "error").length;
  const latencies = rows.map((item) => Number(item.latencyMs) || 0).filter(Boolean);

  return {
    total_requests_today: rows.length,
    successful_requests_today: successful,
    failed_requests_today: rows.length - successful,
    average_latency_ms: latencies.length
      ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
      : 0,
    active_users: new Set(localHistory.map((item) => item.userEmail).filter(Boolean)).size,
    series: []
  };
}

function getIconPath() {
  return path.join(__dirname, "..", "assets", "navia-x.svg");
}

function getTrayImage() {
  const iconPath = getIconPath();
  const svgImage = nativeImage.createFromPath(iconPath);

  if (svgImage && !svgImage.isEmpty()) {
    return svgImage.resize({ width: 20, height: 20 });
  }

  writeLog("tray_icon_fallback", iconPath);
  return nativeImage.createFromBuffer(Buffer.from(FALLBACK_TRAY_PNG_BASE64, "base64"));
}

function createWindow() {
  writeLog("create_window_start");
  mainWindow = new BrowserWindow({
    ...BUBBLE_BOUNDS,
    minWidth: BUBBLE_BOUNDS.width,
    minHeight: BUBBLE_BOUNDS.height,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    hasShadow: true,
    backgroundColor: "#00000000",
    icon: getIconPath(),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.loadFile(path.join(__dirname, "renderer.html"));

  mainWindow.once("ready-to-show", () => {
    writeLog("window_ready_to_show");
    mainWindow.show();

    if (IS_SMOKE_MODE) {
      process.stdout.write("[navia-smoke] ready-to-show\n");
      void runSmokeTest();
    }
  });

  mainWindow.on("closed", () => {
    writeLog("window_closed");
    mainWindow = null;
  });

  mainWindow.on("resize", () => {
    if (!mainWindow || currentMode !== "panel") {
      return;
    }

    const bounds = mainWindow.getBounds();
    lastPanelBounds = normalizePanelBounds(bounds);
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    writeLog("render_process_gone", JSON.stringify(details));
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    writeLog("renderer_load_failed", `${errorCode} ${errorDescription}`);
  });
}

function createTray() {
  try {
    const image = getTrayImage();

    if (!image || image.isEmpty()) {
      writeLog("tray_skipped", "empty_icon");
      return;
    }

    tray = new Tray(image);
    tray.setToolTip(`${DESKTOP_BRAND} Explainer`);
    tray.on("click", () => {
      showPanel();
    });
    writeLog("tray_created");
  } catch (error) {
    writeLog(
      "tray_create_failed",
      error instanceof Error ? error.stack || error.message : String(error)
    );
  }
}

function ensureSmokeArtifactsDir() {
  fs.mkdirSync(SMOKE_ARTIFACTS_DIR, { recursive: true });
}

async function captureWindowToFile(fileName) {
  if (!mainWindow) {
    return;
  }

  ensureSmokeArtifactsDir();
  const image = await mainWindow.webContents.capturePage();
  fs.writeFileSync(path.join(SMOKE_ARTIFACTS_DIR, fileName), image.toPNG());
}

async function collectSmokeState(step) {
  if (!mainWindow) {
    return { step, error: "window_unavailable" };
  }

  return mainWindow.webContents.executeJavaScript(
    `(() => {
      const bubbleView = document.querySelector("#bubbleView");
      const panelView = document.querySelector("#panelView");
      const resultBoard = document.querySelector("#resultBoard");
      const activeTab = document.querySelector("#navRail .active");
      const statusBar = document.querySelector("#statusBar");
      const inputText = document.querySelector("#inputText");
      const charCount = document.querySelector("#charCount");
      const healthPill = document.querySelector("#healthPill");
      const detailTitle = document.querySelector("#detailTitle");
      const resultLabel = document.querySelector("#resultLabel");
      const panelDialog = document.querySelector(".panel-dialog");
      const panelContent = document.querySelector(".panel-content");
      const activeModeValue = document.querySelector("#activeModeValue");
      const languageValue = document.querySelector("#languageValue");
      const homeButton = document.querySelector('[data-page="home"]');
      const settingsButton = document.querySelector('[data-page="settings"]');
      const modeMenuButton = document.querySelector("#modeMenuButton");

      const rect = (node) => {
        if (!node) {
          return null;
        }

        const box = node.getBoundingClientRect();
        return {
          top: Math.round(box.top),
          left: Math.round(box.left),
          width: Math.round(box.width),
          height: Math.round(box.height),
          bottom: Math.round(box.bottom)
        };
      };

      const dialogRect = rect(panelDialog);

      return {
        step: ${JSON.stringify(step)},
        bubbleHidden: bubbleView?.classList.contains("panel-hidden") || false,
        panelHidden: panelView?.classList.contains("panel-hidden") || false,
        activePage: activeTab?.dataset.page || "unknown",
        statusText: statusBar?.textContent?.trim() || "",
        inputLength: inputText?.value?.length || 0,
        charCount: charCount?.textContent?.trim() || "",
        healthText: healthPill?.textContent?.trim() || "",
        detailTitle: detailTitle?.textContent?.trim() || "",
        resultLabel: resultLabel?.textContent?.trim() || "",
        historyCount: document.querySelectorAll("[data-history-index]").length,
        resultCardCount: document.querySelectorAll("#resultBoard .result-card").length,
        resultPreview: resultBoard?.innerText?.trim()?.slice(0, 320) || "",
        activeModeText: activeModeValue?.textContent?.trim() || "",
        languageText: languageValue?.textContent?.trim() || "",
        homeButtonText: homeButton?.textContent?.trim() || "",
        settingsButtonText: settingsButton?.textContent?.trim() || "",
        modeButtonText: modeMenuButton?.textContent?.trim() || "",
        viewportHeight: window.innerHeight,
        bodyScrollHeight: document.body.scrollHeight,
        appScrollHeight: document.querySelector("#app")?.scrollHeight || 0,
        panelRect: rect(panelView),
        dialogRect,
        contentRect: rect(panelContent),
        topGap: dialogRect ? dialogRect.top : null,
        bottomGap: dialogRect ? Math.round(window.innerHeight - dialogRect.bottom) : null
      };
    })()`,
    true
  );
}

async function runSmokeTest() {
  if (!mainWindow) {
    return;
  }

  const report = {
    startedAt: new Date().toISOString(),
    steps: []
  };

  try {
    writeLog("smoke_test_start");
    process.stdout.write("[navia-smoke] test-start\n");
    await wait(1400);

    report.steps.push(await collectSmokeState("initial_bubble"));
    process.stdout.write("[navia-smoke] bubble-captured\n");
    await captureWindowToFile("smoke-bubble.png");

    await mainWindow.webContents.executeJavaScript(
      `document.querySelector("#bubbleExpandButton")?.click();`,
      true
    );
    await wait(900);
    report.steps.push(await collectSmokeState("panel_opened"));
    process.stdout.write("[navia-smoke] panel-opened\n");
    await captureWindowToFile("smoke-panel-open.png");

    await mainWindow.webContents.executeJavaScript(
      `(() => {
        document.querySelector("#languageMenuButton")?.click();
        document.querySelector('[data-language-key="en"]')?.click();
        return true;
      })()`,
      true
    );
    await wait(360);
    report.steps.push(await collectSmokeState("language_switched_en"));

    await mainWindow.webContents.executeJavaScript(
      `(() => {
        document.querySelector("#modeMenuButton")?.click();
        document.querySelector('[data-mode-key="student"]')?.click();
        return true;
      })()`,
      true
    );
    await wait(360);
    report.steps.push(await collectSmokeState("mode_switched_student"));

    await mainWindow.webContents.executeJavaScript(
      `(() => {
        document.querySelector("#languageMenuButton")?.click();
        document.querySelector('[data-language-key="zh-CN"]')?.click();
        document.querySelector("#modeMenuButton")?.click();
        document.querySelector('[data-mode-key="quick"]')?.click();
        return true;
      })()`,
      true
    );
    await wait(420);
    report.steps.push(await collectSmokeState("language_mode_restored"));

    resizeWindow({ width: 1220, height: 820 });
    await wait(420);
    report.steps.push(await collectSmokeState("panel_resized_large"));
    await captureWindowToFile("smoke-panel-large.png");

    resizeWindow({ width: 920, height: 620 });
    await wait(420);
    report.steps.push(await collectSmokeState("panel_resized_small"));
    await captureWindowToFile("smoke-panel-small.png");

    resizeWindow(PANEL_BOUNDS);
    await wait(360);

    await mainWindow.webContents.executeJavaScript(
      `(() => {
        const input = document.querySelector("#inputText");
        if (!input) {
          return false;
        }

        input.value =
          "Entropy in thermodynamics refers to how many microscopic arrangements can produce the same visible state.";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        document.querySelector("#explainButton")?.click();
        return true;
      })()`,
      true
    );
    await wait(1200);
    report.steps.push(await collectSmokeState("after_explain"));
    process.stdout.write("[navia-smoke] explain-finished\n");
    await captureWindowToFile("smoke-after-explain.png");

    await mainWindow.webContents.executeJavaScript(
      `document.querySelector('[data-page="history"]')?.click();`,
      true
    );
    await wait(360);
    report.steps.push(await collectSmokeState("history_page"));

    await mainWindow.webContents.executeJavaScript(
      `document.querySelector('[data-page="settings"]')?.click();`,
      true
    );
    await wait(360);
    report.steps.push(await collectSmokeState("settings_page"));

    await mainWindow.webContents.executeJavaScript(
      `(() => {
        const accent = document.querySelector("#themeAccentInput");
        if (accent) {
          accent.value = "ocean";
          accent.dispatchEvent(new Event("change", { bubbles: true }));
        }

        document.querySelector("#saveSettingsButton")?.click();
        return true;
      })()`,
      true
    );
    await wait(700);
    report.steps.push(await collectSmokeState("settings_saved"));

    await mainWindow.webContents.executeJavaScript(
      `document.querySelector("#minimizeButton")?.click();`,
      true
    );
    await wait(420);
    report.steps.push(await collectSmokeState("after_minimize"));
    process.stdout.write("[navia-smoke] minimize-finished\n");

    ensureSmokeArtifactsDir();
    fs.writeFileSync(
      path.join(SMOKE_ARTIFACTS_DIR, "smoke-report.json"),
      JSON.stringify(report, null, 2),
      "utf-8"
    );
    writeLog("smoke_test_complete", path.join(SMOKE_ARTIFACTS_DIR, "smoke-report.json"));
  } catch (error) {
    writeLog(
      "smoke_test_failed",
      error instanceof Error ? error.stack || error.message : String(error)
    );
  } finally {
    await wait(240);
    app.quit();
  }
}

function resizeWindow(targetBounds) {
  if (!mainWindow) {
    return;
  }

  const nextBounds =
    currentMode === "panel" ? normalizePanelBounds(targetBounds) : targetBounds;
  const currentBounds = mainWindow.getBounds();
  const workArea = getActiveWorkArea();
  const currentCenterX = currentBounds.x + currentBounds.width / 2;
  const currentCenterY = currentBounds.y + currentBounds.height / 2;
  const maxX = workArea.x + Math.max(0, workArea.width - nextBounds.width);
  const maxY = workArea.y + Math.max(0, workArea.height - nextBounds.height);
  const nextX = clampNumber(
    Math.round(currentCenterX - nextBounds.width / 2),
    workArea.x,
    maxX
  );
  const nextY = clampNumber(
    Math.round(currentCenterY - nextBounds.height / 2),
    workArea.y,
    maxY
  );

  mainWindow.setBounds({
    x: nextX,
    y: nextY,
    width: nextBounds.width,
    height: nextBounds.height
  });
}

function setWindowMode(mode) {
  if (!mainWindow) {
    return;
  }

  if (mode === "panel") {
    currentMode = mode;
    mainWindow.setMinimumSize(PANEL_MIN_BOUNDS.width, PANEL_MIN_BOUNDS.height);
    mainWindow.setResizable(true);
    resizeWindow(lastPanelBounds);
  } else {
    if (currentMode === "panel") {
      lastPanelBounds = normalizePanelBounds(mainWindow.getBounds());
    }
    currentMode = mode;
    mainWindow.setMinimumSize(BUBBLE_BOUNDS.width, BUBBLE_BOUNDS.height);
    mainWindow.setResizable(false);
    resizeWindow(BUBBLE_BOUNDS);
  }

  writeLog("window_mode_changed", mode);
  mainWindow.webContents.send("desktop:mode-changed", { mode });
}

function showPanel(clipboardText = "") {
  if (!mainWindow) {
    return;
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  setWindowMode("panel");
  mainWindow.focus();

  if (clipboardText) {
    mainWindow.webContents.send("desktop:clipboard-imported", {
      text: clipboardText
    });
  }
}

function minimizeToBubble() {
  if (!mainWindow) {
    return;
  }

  setWindowMode("bubble");
  mainWindow.focus();
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getActiveWorkArea() {
  if (!mainWindow) {
    return screen.getPrimaryDisplay().workArea;
  }

  const bounds = mainWindow.getBounds();
  const centerPoint = {
    x: Math.round(bounds.x + bounds.width / 2),
    y: Math.round(bounds.y + bounds.height / 2)
  };

  return screen.getDisplayNearestPoint(centerPoint).workArea;
}

function normalizePanelBounds(targetBounds = PANEL_BOUNDS) {
  const workArea = getActiveWorkArea();
  const minWidth = Math.min(PANEL_MIN_BOUNDS.width, workArea.width);
  const minHeight = Math.min(PANEL_MIN_BOUNDS.height, workArea.height);

  return {
    width: clampNumber(Math.round(targetBounds.width || PANEL_BOUNDS.width), minWidth, workArea.width),
    height: clampNumber(Math.round(targetBounds.height || PANEL_BOUNDS.height), minHeight, workArea.height)
  };
}

function startClipboardMonitor() {
  setInterval(() => {
    const settings = readSettings();

    if (!settings.monitorClipboard) {
      return;
    }

    const value = clipboard.readText().trim();

    if (!value || value === lastClipboardText || value.length > 3000) {
      return;
    }

    lastClipboardText = value;

    if (mainWindow) {
      mainWindow.webContents.send("desktop:clipboard-detected", {
        text: value,
        autoImport: Boolean(settings.autoImportClipboard)
      });
    }
  }, 900);
}

function registerShortcuts() {
  const settings = readSettings();
  globalShortcut.unregisterAll();
  const registered = globalShortcut.register(settings.globalShortcut, () => {
    const text = clipboard.readText().trim();
    showPanel(text);
  });
  writeLog("shortcut_registered", `${settings.globalShortcut} ${registered}`);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      formatErrorDetail(payload.detail || payload, `Request failed: ${response.status}`)
    );
  }

  return payload;
}

ipcMain.handle("desktop:get-settings", async () => {
  return readSettings();
});

ipcMain.handle("desktop:save-settings", async (_event, nextSettings) => {
  const merged = saveSettings(nextSettings);
  registerShortcuts();
  return merged;
});

ipcMain.handle("desktop:get-clipboard-text", async () => {
  return clipboard.readText().trim();
});

ipcMain.handle("desktop:run-explain", async (_event, payload) => {
  const endpoint = `${payload.apiBaseUrl.replace(/\/$/, "")}/api/explain`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input_text: payload.text,
        mode: payload.mode,
        user_email: payload.userEmail,
        output_language: payload.outputLanguage,
        output_language_label: payload.outputLanguageLabel
      })
    });

    const responsePayload = await response
      .json()
      .catch(() => ({ detail: "Explain request failed" }));

    if (!response.ok) {
      return {
        ok: false,
        error: formatErrorDetail(responsePayload.detail || responsePayload)
      };
    }

    const historyEntry = saveLocalHistoryEntry(payload, responsePayload);

    return {
      ok: true,
      data: responsePayload,
      historyEntry
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Backend unavailable. Explain request failed."
    };
  }
});

ipcMain.handle("desktop:get-history", async (_event, payload) => {
  const limit = payload.limit || 40;
  const localHistory = readLocalHistory();

  try {
    const query = new URLSearchParams({
      limit: String(limit),
      user_email: payload.userEmail
    });
    const remote = await fetchJson(
      `${payload.apiBaseUrl.replace(/\/$/, "")}/api/history?${query.toString()}`
    );

    return {
      ok: true,
      data: mergeHistory(remote, localHistory, payload.userEmail, limit),
      source: "remote"
    };
  } catch (error) {
    return {
      ok: true,
      data: mergeHistory([], localHistory, payload.userEmail, limit),
      source: "local",
      warning: error instanceof Error ? error.message : "History unavailable"
    };
  }
});

ipcMain.handle("desktop:get-usage", async (_event, payload) => {
  const localHistory = readLocalHistory();

  try {
    const data = await fetchJson(`${payload.apiBaseUrl.replace(/\/$/, "")}/api/usage`);
    return { ok: true, data, source: "remote" };
  } catch (error) {
    return {
      ok: true,
      data: buildLocalUsage(localHistory, payload.userEmail),
      source: "local",
      warning: error instanceof Error ? error.message : "Usage unavailable"
    };
  }
});

ipcMain.handle("desktop:get-health", async (_event, payload) => {
  try {
    const data = await fetchJson(`${payload.apiBaseUrl.replace(/\/$/, "")}/api/health`);
    return { ok: true, data, source: "remote" };
  } catch (error) {
    return {
      ok: true,
      data: {
        status: "offline",
        environment: "desktop",
        mock_mode: false,
        database_configured: false,
        timestamp: new Date().toISOString()
      },
      source: "local",
      warning: error instanceof Error ? error.message : "Health unavailable"
    };
  }
});

ipcMain.handle("desktop:set-window-mode", async (_event, payload) => {
  if (payload.mode === "panel") {
    showPanel();
  } else {
    minimizeToBubble();
  }

  return { ok: true };
});

ipcMain.handle("desktop:open-link", async (_event, url) => {
  await shell.openExternal(url);
  return { ok: true };
});

app.whenReady().then(() => {
  initLogging();
  writeLog("app_ready");
  app.setAppUserModelId("ai.naviax.explainer");

  try {
    createWindow();
  } catch (error) {
    writeLog(
      "create_window_failed",
      error instanceof Error ? error.stack || error.message : String(error)
    );
    throw error;
  }

  createTray();

  try {
    registerShortcuts();
  } catch (error) {
    writeLog(
      "register_shortcut_failed",
      error instanceof Error ? error.stack || error.message : String(error)
    );
  }

  startClipboardMonitor();
}).catch((error) => {
  writeLog(
    "app_ready_failed",
    error instanceof Error ? error.stack || error.message : String(error)
  );
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});

app.on("activate", () => {
  writeLog("app_activate");
  if (!mainWindow) {
    createWindow();
  } else {
    showPanel();
  }
});

app.on("will-quit", () => {
  writeLog("will_quit");
  globalShortcut.unregisterAll();
});

app.on("browser-window-created", () => {
  writeLog("browser_window_created");
});

process.on("uncaughtException", (error) => {
  writeLog("uncaught_exception", error.stack || error.message);
});

process.on("unhandledRejection", (reason) => {
  writeLog(
    "unhandled_rejection",
    reason instanceof Error ? reason.stack || reason.message : JSON.stringify(reason)
  );
});
