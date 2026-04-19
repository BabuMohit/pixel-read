# Carousel Agent — Chrome Extension

A Manifest V3 Chrome Extension for full-page screenshot capture and HTML source viewing on any website.

## Project Structure

```
manifest.json     — Extension manifest (MV3)
background.js     — Service worker: icon click handler, debugger capture engine
main.html         — Extension's dedicated tab UI
main.js           — Frontend logic (capture dispatch, preview, HTML modal)
main.css          — Dark-themed split-screen styles
icons/            — 16×48×128px PNG icons
```

## Features

- **Full-Page Capture**: Uses the Chrome Debugger API (`Page.captureScreenshot` with `captureBeyondViewport: true`) to capture the entire page regardless of viewport.
- **Capture mode**: Opens a new background tab, loads the URL, captures, then closes the tab automatically.
- **Find & Capture mode**: Finds an already-open tab in the current window by URL and captures it without opening a new tab.
- **HTML Viewer**: Retrieves and displays the captured page's full HTML source in a dark-themed modal, with copy-to-clipboard support.
- **Split-screen UI**: Left panel shows the scrollable preview (image fills full width); right panel has controls.
- **Focus return**: After capture, focus returns to the extension tab automatically.

## Permissions

- `debugger` — required for `chrome.debugger` API (full-page screenshot)
- `tabs` — required to create/manage tabs
- `activeTab` — required to interact with active tabs
- `scripting` — used for JS evaluation in tab context
- `host_permissions: <all_urls>` — allows debugger attachment to any URL

## Loading the Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select this project folder
5. Click the **Carousel Agent** icon in the toolbar to open the workspace tab
