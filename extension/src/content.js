(() => {
  if (window.__naviaXExplainerInjected) {
    return;
  }

  window.__naviaXExplainerInjected = true;

  const logoUrl = chrome.runtime.getURL("assets/navia-x.svg");
  const state = {
    mode: "simple",
    selectionText: "",
    bubbleX: Math.max(window.innerWidth - 140, 16),
    bubbleY: Math.max(window.innerHeight - 128, 24),
    panelX: Math.max(window.innerWidth - 470, 24),
    panelY: 96,
    panelOpen: false
  };

  let bubbleDrag = null;
  let bubbleMoved = false;
  let panelDrag = null;

  const root = document.createElement("div");
  root.id = "navia-x-root";
  root.innerHTML = `
    <div class="navia-layer">
      <button id="navia-bubble" class="navia-bubble navia-interactive" type="button" aria-label="Open Navia-X Explainer">
        <div class="navia-bubble-mark">
          <img src="${logoUrl}" alt="Navia-X" />
        </div>
        <div class="navia-bubble-copy">
          <strong>Navia-X</strong>
          <span>Explain</span>
        </div>
      </button>

      <div id="navia-confirm" class="navia-confirm navia-interactive navia-hidden">
        <div class="navia-confirm-title">Selected Term</div>
        <div id="navia-confirm-preview" class="navia-confirm-preview"></div>
        <div class="navia-confirm-actions">
          <span class="navia-confirm-note">按 Enter 或点击确认后直接解释</span>
          <button id="navia-confirm-btn" class="navia-pill-btn" type="button">确认解释</button>
        </div>
      </div>

      <section id="navia-panel" class="navia-panel navia-interactive navia-hidden" aria-label="Navia-X floating explainer">
        <div id="navia-panel-header" class="navia-panel-header">
          <div class="navia-header-left">
            <div class="navia-bubble-mark">
              <img src="${logoUrl}" alt="Navia-X" />
            </div>
            <div class="navia-header-copy">
              <strong>Navia-X Explainer</strong>
              <span>选中网页词语后，确认即可解释</span>
            </div>
          </div>
          <div class="navia-header-actions">
            <button id="navia-minimize-btn" class="navia-icon-btn" type="button" aria-label="Minimize">—</button>
          </div>
        </div>

        <div class="navia-panel-body">
          <div>
            <div class="navia-label">Captured Text</div>
            <textarea id="navia-selection-input" class="navia-input" placeholder="选中网页中的词语后，这里会自动填充。"></textarea>
          </div>

          <div class="navia-toolbar">
            <select id="navia-mode" class="navia-select" aria-label="Select explanation mode">
              <option value="simple">简单解释</option>
              <option value="professional">专业解释</option>
              <option value="exam">考试理解</option>
              <option value="research">论文理解</option>
              <option value="code">代码解释</option>
            </select>
            <button id="navia-run-btn" class="navia-primary-btn" type="button">开始解释</button>
          </div>

          <div id="navia-status" class="navia-status" data-tone="info"></div>

          <div id="navia-result" class="navia-result">
            <div class="navia-result-card">
              <h4>Preview</h4>
              <p>先在任意网页里选中一个你不理解的词语或句子，点击“确认解释”，解释结果会显示在这里。</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  document.documentElement.appendChild(root);

  const bubble = root.querySelector("#navia-bubble");
  const confirmChip = root.querySelector("#navia-confirm");
  const confirmPreview = root.querySelector("#navia-confirm-preview");
  const confirmButton = root.querySelector("#navia-confirm-btn");
  const panel = root.querySelector("#navia-panel");
  const panelHeader = root.querySelector("#navia-panel-header");
  const panelMinimizeButton = root.querySelector("#navia-minimize-btn");
  const selectionInput = root.querySelector("#navia-selection-input");
  const modeSelect = root.querySelector("#navia-mode");
  const runButton = root.querySelector("#navia-run-btn");
  const statusNode = root.querySelector("#navia-status");
  const resultNode = root.querySelector("#navia-result");

  function setBubblePosition(x, y) {
    const maxX = window.innerWidth - bubble.offsetWidth - 12;
    const maxY = window.innerHeight - bubble.offsetHeight - 12;
    state.bubbleX = Math.min(Math.max(x, 12), maxX);
    state.bubbleY = Math.min(Math.max(y, 12), maxY);
    bubble.style.left = `${state.bubbleX}px`;
    bubble.style.top = `${state.bubbleY}px`;
  }

  function setPanelPosition(x, y) {
    const panelWidth = panel.offsetWidth || 430;
    const panelHeight = panel.offsetHeight || 540;
    const maxX = window.innerWidth - panelWidth - 12;
    const maxY = window.innerHeight - panelHeight - 12;
    state.panelX = Math.min(Math.max(x, 12), maxX);
    state.panelY = Math.min(Math.max(y, 12), maxY);
    panel.style.left = `${state.panelX}px`;
    panel.style.top = `${state.panelY}px`;
  }

  function setStatus(text, tone = "info") {
    statusNode.textContent = text;
    statusNode.dataset.tone = tone;
  }

  function hideConfirmChip() {
    confirmChip.classList.add("navia-hidden");
  }

  function showConfirmChip(text, rect) {
    state.selectionText = text.slice(0, 3000);
    confirmPreview.textContent =
      text.length > 96 ? `${text.slice(0, 96)}...` : text;

    const chipRect = confirmChip.getBoundingClientRect();
    const top = rect.bottom + 14;
    const left = Math.min(
      Math.max(rect.left, 12),
      window.innerWidth - (chipRect.width || 320) - 12
    );

    confirmChip.style.left = `${left}px`;
    confirmChip.style.top = `${Math.min(top, window.innerHeight - 100)}px`;
    confirmChip.classList.remove("navia-hidden");
  }

  function openPanel() {
    panel.classList.remove("navia-hidden");
    bubble.classList.add("navia-hidden");
    state.panelOpen = true;
    selectionInput.value = state.selectionText;
    setPanelPosition(state.panelX, state.panelY);
  }

  function minimizePanel() {
    panel.classList.add("navia-hidden");
    bubble.classList.remove("navia-hidden");
    state.panelOpen = false;
    setBubblePosition(state.bubbleX, state.bubbleY);
  }

  function renderResult(payload) {
    const summary = payload.summary || "暂无摘要";
    const deep = payload.deep_explanation || payload.deepExplanation || "暂无深度解释";
    const keywords = Array.isArray(payload.keywords) ? payload.keywords : [];
    const examples = Array.isArray(payload.examples) ? payload.examples : [];
    const takeaway = payload.takeaway || "暂无总结";

    resultNode.innerHTML = `
      <div class="navia-result-card">
        <h4>简明解释</h4>
        <p>${summary}</p>
      </div>
      <div class="navia-result-card">
        <h4>深度解释</h4>
        <p>${deep}</p>
      </div>
      <div class="navia-result-card">
        <h4>关键词</h4>
        <ul>
          ${keywords
            .map(
              (item) =>
                `<li><strong>${item.term || "关键词"}：</strong>${item.definition || ""}</li>`
            )
            .join("")}
        </ul>
      </div>
      <div class="navia-result-card">
        <h4>例句</h4>
        <ul>
          ${examples.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
      <div class="navia-result-card takeaway">
        <h4>总结</h4>
        <p>${takeaway}</p>
      </div>
    `;
  }

  function requestExplanation() {
    const currentText = selectionInput.value.trim();

    if (!currentText) {
      setStatus("请先选中网页中的词语，或手动输入内容。", "error");
      return;
    }

    state.selectionText = currentText;
    setStatus("正在调用解释服务...", "info");
    runButton.disabled = true;

    chrome.runtime.sendMessage(
      {
        type: "NAVIA_EXPLAIN",
        text: currentText,
        mode: state.mode
      },
      (response) => {
        runButton.disabled = false;

        if (chrome.runtime.lastError) {
          setStatus(chrome.runtime.lastError.message, "error");
          return;
        }

        if (!response || !response.ok) {
          setStatus(response?.error || "解释服务暂时不可用。", "error");
          return;
        }

        setStatus("解释完成，结果已记录到后台。", "success");
        renderResult(response.data);
      }
    );
  }

  function focusSelectionIntoPanel() {
    selectionInput.value = state.selectionText;
    openPanel();
    hideConfirmChip();
  }

  function explainCurrentSelection() {
    if (!state.selectionText) {
      return;
    }

    focusSelectionIntoPanel();
    requestExplanation();
  }

  function shouldIgnoreEnterTrigger(target) {
    if (!target) {
      return false;
    }

    const tagName = target.tagName;
    if (tagName === "INPUT" || tagName === "TEXTAREA" || target.isContentEditable) {
      return true;
    }

    return root.contains(target) && !confirmChip.contains(target);
  }

  function selectionBelongsToOverlay(selection) {
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const node = selection.getRangeAt(0).commonAncestorContainer;
    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

    return element ? root.contains(element) : false;
  }

  function inspectSelection() {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || selectionBelongsToOverlay(selection)) {
      hideConfirmChip();
      return;
    }

    const text = selection.toString().trim();

    if (!text) {
      hideConfirmChip();
      return;
    }

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    showConfirmChip(text, rect);
  }

  bubble.addEventListener("click", () => {
    if (bubbleMoved) {
      bubbleMoved = false;
      return;
    }

    openPanel();
  });

  bubble.addEventListener("pointerdown", (event) => {
    bubbleMoved = false;
    bubbleDrag = {
      offsetX: event.clientX - state.bubbleX,
      offsetY: event.clientY - state.bubbleY,
      startX: event.clientX,
      startY: event.clientY
    };
  });

  panelHeader.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) {
      return;
    }

    panelDrag = {
      offsetX: event.clientX - state.panelX,
      offsetY: event.clientY - state.panelY
    };
  });

  panelMinimizeButton.addEventListener("click", minimizePanel);
  confirmButton.addEventListener("click", () => {
    explainCurrentSelection();
  });

  modeSelect.addEventListener("change", () => {
    state.mode = modeSelect.value;
  });

  runButton.addEventListener("click", requestExplanation);

  document.addEventListener("mouseup", () => {
    window.setTimeout(inspectSelection, 0);
  });

  document.addEventListener("keyup", (event) => {
    if (event.key.startsWith("Arrow") || event.key === "Shift") {
      window.setTimeout(inspectSelection, 0);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (shouldIgnoreEnterTrigger(event.target)) {
      return;
    }

    if (confirmChip.classList.contains("navia-hidden") || !state.selectionText) {
      return;
    }

    event.preventDefault();
    explainCurrentSelection();
  });

  document.addEventListener("mousedown", (event) => {
    if (!root.contains(event.target)) {
      hideConfirmChip();
    }
  });

  window.addEventListener("pointermove", (event) => {
    if (bubbleDrag) {
      if (
        Math.abs(event.clientX - bubbleDrag.startX) > 4 ||
        Math.abs(event.clientY - bubbleDrag.startY) > 4
      ) {
        bubbleMoved = true;
      }

      setBubblePosition(
        event.clientX - bubbleDrag.offsetX,
        event.clientY - bubbleDrag.offsetY
      );
    }

    if (panelDrag) {
      setPanelPosition(
        event.clientX - panelDrag.offsetX,
        event.clientY - panelDrag.offsetY
      );
    }
  });

  window.addEventListener("pointerup", () => {
    bubbleDrag = null;
    panelDrag = null;
  });

  window.addEventListener("resize", () => {
    setBubblePosition(state.bubbleX, state.bubbleY);
    setPanelPosition(state.panelX, state.panelY);
  });

  setBubblePosition(state.bubbleX, state.bubbleY);
  setPanelPosition(state.panelX, state.panelY);
  setStatus("选中网页中的词语后，按 Enter 或点击确认即可解释。", "info");

  chrome.runtime.sendMessage({ type: "NAVIA_GET_CONFIG" }, (response) => {
    if (!response?.ok) {
      return;
    }

    state.mode = response.config.defaultMode || "simple";
    modeSelect.value = state.mode;
  });
})();
