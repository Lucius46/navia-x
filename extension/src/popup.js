const apiBaseInput = document.querySelector("#apiBase");
const defaultModeSelect = document.querySelector("#defaultMode");
const saveButton = document.querySelector("#saveButton");
const statusText = document.querySelector("#statusText");

function setStatus(text) {
  statusText.textContent = text;
}

chrome.runtime.sendMessage({ type: "NAVIA_GET_CONFIG" }, (response) => {
  if (!response?.ok) {
    setStatus("读取配置失败。");
    return;
  }

  apiBaseInput.value = response.config.apiBase || "http://localhost:8001";
  defaultModeSelect.value = response.config.defaultMode || "simple";
});

saveButton.addEventListener("click", () => {
  chrome.runtime.sendMessage(
    {
      type: "NAVIA_SAVE_CONFIG",
      apiBase: apiBaseInput.value.trim() || "http://localhost:8001",
      defaultMode: defaultModeSelect.value
    },
    (response) => {
      setStatus(response?.ok ? "设置已保存。" : "保存失败，请重试。");
    }
  );
});
