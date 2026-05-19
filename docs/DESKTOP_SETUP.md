# Desktop Setup

## Overview

This directory adds a Windows-first desktop floating explainer in [`desktop/`](/Users/kimlucius/Documents/LLM-explain/desktop/).

The MVP includes:

- Always-on-top floating bubble
- Glass-style `Navia-X` desktop panel
- Clipboard import from any browser
- Global shortcut to open the panel with clipboard text
- Backend explanation requests through FastAPI

## Why This MVP Uses Clipboard

For a Windows desktop app, the most stable first version is:

1. Select text in the browser
2. Copy it
3. Press `Ctrl+Shift+E`
4. The floating explainer opens with that text

This is much more reliable than pretending we already have full system-level text capture across every browser. Later versions can add OCR, accessibility hooks, or Windows native automation.

## Local Run

### 1. Start the backend

```bash
cd backend
./.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### 2. Install desktop dependencies

```bash
cd desktop
npm install
```

### 3. Start the desktop app

```bash
cd desktop
npm run dev
```

## Windows Packaging

After dependencies are installed:

```bash
cd desktop
npm run dist:win
```

This prepares a Windows installer through Electron Builder.

## Next Recommended Upgrades

- Add OCR-based screen capture for mouse-only selection flows
- Add Windows accessibility automation for richer browser text capture
- Add system tray toggles for auto-explain and auto-open
- Add persistent history sync to the backend admin console

