# Pixel Read - Chrome Extension

A powerful Chrome extension for capturing full-page screenshots and extracting HTML source code from any website. Built with Manifest V3 for modern Chrome browsers.

## 🚀 Features

- **Full-Page Screenshot Capture**: Captures the entire webpage, not just the visible viewport
- **Dual Capture Modes**:
  - **Capture Mode**: Opens URL in a background tab, captures, and auto-closes
  - **Find & Capture Mode**: Captures from an already-open tab without creating duplicates
- **HTML Source Viewer**: View and copy the complete HTML source code of captured pages
- **Split-Screen Interface**: 
  - Left panel: Scrollable screenshot preview
  - Right panel: Intuitive controls and status indicators
- **Dark Theme**: Modern, eye-friendly dark interface
- **Smart Focus Management**: Automatically returns focus to the extension tab after capture

## 🛠️ Technical Details

### Architecture

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Capture Engine**: Chrome Debugger API with `Page.captureScreenshot`
- **Service Worker**: Background script for tab management and capture orchestration
- **UI**: Dedicated extension tab with real-time status updates

### Permissions Required

- `debugger` - Required for full-page screenshot capture via Chrome Debugger API
- `tabs` - Tab creation and management
- `activeTab` - Interaction with active tabs
- `scripting` - JavaScript evaluation in tab context
- `<all_urls>` - Allows debugger attachment to any website

## 📦 Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/BabuMohit/pixel-read.git
   cd pixel-read
   ```

2. Open Chrome and navigate to `chrome://extensions`

3. Enable **Developer mode** (toggle in top-right corner)

4. Click **Load unpacked**

5. Select the project folder

6. Click the **Carousel Agent** icon in your Chrome toolbar to launch

## 🎯 Usage

1. **Click the extension icon** in your Chrome toolbar to open the Pixel Read interface

2. **Enter a URL** in the input field (e.g., `example.com` or `https://example.com`)

3. **Choose a capture method**:
   - **Capture**: Opens the URL in a new background tab, captures it, and closes the tab
   - **Find & Capture**: Searches for an already-open tab with that URL and captures it

4. **View the screenshot** in the left preview panel

5. **View HTML** (optional): Click "View HTML" to see the page's source code in a modal
   - Copy to clipboard with one click
   - Formatted and syntax-highlighted for readability

## 📁 Project Structure

```
├── manifest.json       # Extension manifest (Manifest V3)
├── background.js       # Service worker: capture engine & tab management
├── main.html          # Extension UI layout
├── main.js            # Frontend logic: capture dispatch, preview, modal
├── main.css           # Dark-themed split-screen styles
├── icons/             # Extension icons (16×48×128px)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

## 🔧 How It Works

1. **Debugger Attachment**: The extension attaches the Chrome Debugger to the target tab
2. **Layout Metrics**: Retrieves full page dimensions using `Page.getLayoutMetrics`
3. **Device Override**: Sets viewport to match full page dimensions
4. **Screenshot Capture**: Uses `Page.captureScreenshot` with `captureBeyondViewport: true`
5. **HTML Extraction**: Evaluates `document.documentElement.outerHTML` to get source code
6. **Cleanup**: Detaches debugger and returns focus to extension tab

## ⚠️ Known Limitations

- Requires Chrome Debugger API, which may trigger a warning banner on captured tabs
- Cannot capture Chrome internal pages (e.g., `chrome://`, `chrome-extension://`)
- Some websites with strict CSP policies may block debugger attachment
- Screenshots are captured at device scale factor 1 (no high-DPI scaling)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is open source and available for personal and educational use.

## 🔮 Future Enhancements

- Multiple screenshot format support (JPEG, WebP)
- Batch URL capture
- Screenshot annotation tools
- Export to PDF
- Custom viewport dimensions
- Screenshot history

---

**Note**: This extension uses the Chrome Debugger API, which is a powerful tool. Use responsibly and only on websites you have permission to capture.
