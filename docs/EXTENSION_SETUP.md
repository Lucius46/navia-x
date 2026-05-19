# Browser Extension Setup

## What This Adds

This project now includes a browser extension in [`extension/`](/Users/kimlucius/Documents/LLM-explain/extension/).

The extension provides:

- A floating `Navia-X` glass bubble on any webpage
- Selection detection on any page
- A confirmation chip when the user highlights a word or phrase
- A floating explainer panel that calls the backend `/api/explain`
- Minimize back to the glass logo bubble

## How To Load In Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the [`extension/`](/Users/kimlucius/Documents/LLM-explain/extension/) folder
5. Keep the backend running on `http://localhost:8001`

## How To Use

1. Open any webpage
2. You will see the `Navia-X` floating bubble
3. Highlight a word, phrase, or sentence
4. Click `确认解释`
5. The floating explainer panel opens and shows the explanation
6. Click the top-right minimize control to turn it back into the glass logo bubble

## Notes

- The extension now depends on the backend for explanation requests. If the backend is not reachable, the explain action will fail and show the backend error.
- The popup lets you change the backend API base URL and default explanation mode.
- The extension currently targets Chromium browsers via Manifest V3.
