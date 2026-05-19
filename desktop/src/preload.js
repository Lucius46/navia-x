const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("naviaDesktop", {
  getSettings: () => ipcRenderer.invoke("desktop:get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("desktop:save-settings", settings),
  getClipboardText: () => ipcRenderer.invoke("desktop:get-clipboard-text"),
  runExplain: (payload) => ipcRenderer.invoke("desktop:run-explain", payload),
  getHistory: (payload) => ipcRenderer.invoke("desktop:get-history", payload),
  getUsage: (payload) => ipcRenderer.invoke("desktop:get-usage", payload),
  getHealth: (payload) => ipcRenderer.invoke("desktop:get-health", payload),
  setWindowMode: (mode) => ipcRenderer.invoke("desktop:set-window-mode", { mode }),
  openLink: (url) => ipcRenderer.invoke("desktop:open-link", url),
  onClipboardImported: (handler) =>
    ipcRenderer.on("desktop:clipboard-imported", (_event, payload) => {
      handler(payload);
    }),
  onClipboardDetected: (handler) =>
    ipcRenderer.on("desktop:clipboard-detected", (_event, payload) => {
      handler(payload);
    }),
  onModeChanged: (handler) =>
    ipcRenderer.on("desktop:mode-changed", (_event, payload) => {
      handler(payload);
    })
});
