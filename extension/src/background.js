const DEFAULT_SETTINGS = {
  apiBase: "http://localhost:8001",
  defaultMode: "simple"
};

async function getSettings() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  return {
    apiBase: settings.apiBase || DEFAULT_SETTINGS.apiBase,
    defaultMode: settings.defaultMode || DEFAULT_SETTINGS.defaultMode
  };
}

async function requestExplanation(text, mode) {
  const { apiBase } = await getSettings();
  const endpoint = `${apiBase.replace(/\/$/, "")}/api/explain`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input_text: text,
      mode,
      user_email: "extension@navia-x.local"
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `Request failed with status ${response.status}`
    }));
    throw new Error(error.detail || `Request failed with status ${response.status}`);
  }

  return await response.json();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "NAVIA_EXPLAIN") {
    requestExplanation(message.text, message.mode)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      );

    return true;
  }

  if (message.type === "NAVIA_GET_CONFIG") {
    getSettings().then((config) => sendResponse({ ok: true, config }));
    return true;
  }

  if (message.type === "NAVIA_SAVE_CONFIG") {
    chrome.storage.sync
      .set({
        apiBase: message.apiBase,
        defaultMode: message.defaultMode || DEFAULT_SETTINGS.defaultMode
      })
      .then(() => sendResponse({ ok: true }));

    return true;
  }

  return false;
});
