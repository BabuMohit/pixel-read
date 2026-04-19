# Pixel Read - Chrome Extension

A powerful Chrome extension for capturing full-page screenshots and extracting HTML source code from any website. Built with Manifest V3 for modern Chrome browsers.

## 🚀 Features

- **Full-Page Screenshot Capture**: Captures the entire webpage, not just the visible viewport
- **Dual Capture Modes**:
  - **Capture Mode**: Opens URL in a background tab, captures, and auto-closes
  - **Find & Capture Mode**: Captures from an already-open tab without creating duplicates
- **Text Search & Highlighting**: 🆕 Search for text within captured screenshots with visual highlighting
  - Real-time search with instant highlighting
  - Navigate between matches with keyboard shortcuts (Enter/Shift+Enter) or navigation buttons
  - Visual indicators showing current match and total results
  - Smooth scrolling to highlighted matches
- **Spatial Text Mapping**: 🆕 Extracts text positions from captured pages for accurate search
- **HTML Source Viewer**: View and copy the complete HTML source code of captured pages
- **Split-Screen Interface**: 
  - Left panel: Scrollable screenshot preview with interactive text layer
  - Right panel: Intuitive controls, search, and status indicators
- **Dark Theme**: Modern, eye-friendly dark interface
- **Smart Focus Management**: Automatically returns focus to the extension tab after capture

## 🆕 What's New in v3

### UI/UX Improvements
- **Interactive Text Hover**: 🆕 Text nodes now show a subtle blue highlight on hover for better interactivity
- **Improved Z-Index Layering**: Enhanced visual hierarchy for text overlays (normal → highlighted → current match)
- **Smoother Transitions**: Refined hover animations with faster transition timing (0.12s)

### Previous Updates (v2)

#### Text Search & Highlighting
- **Spatial Text Extraction**: Automatically extracts text positions from captured pages using DOM traversal
- **Interactive Search**: Search for any text within the screenshot and see it highlighted in real-time
- **Match Navigation**: Navigate between search results with up/down arrows or Enter/Shift+Enter
- **Visual Feedback**: Current match highlighted in orange, other matches in yellow
- **Result Counter**: Shows "X of Y" results or "No results" for empty searches
- **Responsive Overlay**: Text layer automatically repositions on window resize

#### Technical Improvements
- **Enhanced Capture Engine**: Now extracts spatial coordinates for all visible text nodes
- **TreeWalker Implementation**: Efficient DOM traversal filtering out hidden and non-visible elements
- **ResizeObserver Integration**: Maintains accurate text positioning during window resizing
- **Improved Status Messages**: Now shows text node count in capture status

## 🛠️ Technical Details

### Architecture

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Capture Engine**: Chrome Debugger API with `Page.captureScreenshot`
- **Text Extraction**: DOM TreeWalker with getBoundingClientRect for spatial mapping
- **Service Worker**: Background script for tab management and capture orchestration
- **UI**: Dedicated extension tab with real-time status updates and interactive text layer

### Permissions Required

- `debugger` - Required for full-page screenshot capture via Chrome Debugger API
- `tabs` - Tab creation and management
- `activeTab` - Interaction with active tabs
- `scripting` - JavaScript evaluation in tab context for text extraction
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

6. Click the **Pixel Read** icon in your Chrome toolbar to launch

## 🎯 Usage

### Basic Capture

1. **Click the extension icon** in your Chrome toolbar to open the Pixel Read interface

2. **Enter a URL** in the input field (e.g., `example.com` or `https://example.com`)

3. **Choose a capture method**:
   - **Capture**: Opens the URL in a new background tab, captures it, and closes the tab
   - **Find & Capture**: Searches for an already-open tab with that URL and captures it

4. **View the screenshot** in the left preview panel

### Text Search

1. **After capturing a page**, use the search box in the right panel

2. **Type your search query** - matches will be highlighted automatically in yellow

3. **Navigate between matches**:
   - Press **Enter** to go to next match
   - Press **Shift+Enter** to go to previous match
   - Use the **up/down arrow buttons** next to the search box

4. **Current match** is highlighted in orange and automatically scrolled into view

5. **Result counter** shows your position (e.g., "2 of 5" or "No results")

### HTML Viewer

1. **Click "View HTML"** to see the page's source code in a modal

2. **Copy to clipboard** with one click

3. **Formatted and readable** - automatically indented for easy reading

## 📁 Project Structure

```
├── manifest.json       # Extension manifest (Manifest V3)
├── background.js       # Service worker: capture engine, text extraction & tab management
├── main.html          # Extension UI layout with search controls
├── main.js            # Frontend logic: capture, search, text layer, preview
├── main.css           # Dark-themed styles with text highlighting
├── icons/             # Extension icons (16×48×128px)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

## 🔧 How It Works

### Screenshot Capture

1. **Debugger Attachment**: The extension attaches the Chrome Debugger to the target tab
2. **Layout Metrics**: Retrieves full page dimensions using `Page.getLayoutMetrics`
3. **Device Override**: Sets viewport to match full page dimensions
4. **Screenshot Capture**: Uses `Page.captureScreenshot` with `captureBeyondViewport: true`
5. **HTML Extraction**: Evaluates `document.documentElement.outerHTML` to get source code

### Text Extraction & Search

1. **DOM Traversal**: Uses TreeWalker to iterate through all text nodes in the page
2. **Visibility Filtering**: Excludes hidden elements, scripts, styles, and zero-size elements
3. **Spatial Mapping**: Captures bounding rectangles (x, y, width, height) for each text node
4. **Text Layer Rendering**: Creates an invisible overlay with positioned divs matching text locations
5. **Search Matching**: Performs case-insensitive substring matching on text content
6. **Visual Highlighting**: Applies CSS classes to matching text nodes for visual feedback
7. **Responsive Positioning**: Uses ResizeObserver to maintain accuracy during window resizing

## ⚠️ Known Limitations

- Requires Chrome Debugger API, which may trigger a warning banner on captured tabs
- Cannot capture Chrome internal pages (e.g., `chrome://`, `chrome-extension://`)
- Some websites with strict CSP policies may block debugger attachment
- Screenshots are captured at device scale factor 1 (no high-DPI scaling)
- Text search matches are based on parent element boundaries, not individual words
- Very long pages with thousands of text nodes may experience slight performance impact

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is open source and available for personal and educational use.

## 🔮 Future Enhancements

- OCR support for text in images
- Multiple screenshot format support (JPEG, WebP)
- Batch URL capture
- Screenshot annotation tools
- Export to PDF
- Custom viewport dimensions
- Screenshot history
- Advanced search (regex, case-sensitive)
- Text selection and copying from screenshots

---

**Note**: This extension uses the Chrome Debugger API, which is a powerful tool. Use responsibly and only on websites you have permission to capture.
