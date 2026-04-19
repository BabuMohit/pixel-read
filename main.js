(() => {
  const urlInput           = document.getElementById('urlInput');
  const captureBtn         = document.getElementById('captureBtn');
  const findCaptureBtn     = document.getElementById('findCaptureBtn');
  const viewHtmlBtn        = document.getElementById('viewHtmlBtn');
  const previewImage       = document.getElementById('previewImage');
  const previewContainer   = document.getElementById('previewContainer');
  const previewPlaceholder = document.getElementById('previewPlaceholder');
  const previewDims        = document.getElementById('previewDims');
  const statusIndicator    = document.getElementById('statusIndicator');
  const statusText         = document.getElementById('statusText');
  const htmlModal          = document.getElementById('htmlModal');
  const htmlCode           = document.getElementById('htmlCode');
  const closeModalBtn      = document.getElementById('closeModalBtn');
  const copyHtmlBtn        = document.getElementById('copyHtmlBtn');
  const searchInput        = document.getElementById('searchInput');
  const searchCounter      = document.getElementById('searchCounter');
  const prevMatchBtn       = document.getElementById('prevMatchBtn');
  const nextMatchBtn       = document.getElementById('nextMatchBtn');

  let capturedHtml       = null;
  let isBusy             = false;
  let currentSpatialMap  = [];
  let currentDimensions  = { width: 1, height: 1 };

  let textLayerEl        = null;   // z-index 2 — ghost text, selectable
  let highlightLayerEl   = null;   // z-index 3 — search highlight boxes
  let textNodeEls        = [];
  let highlightEls       = [];
  let matchIndices       = [];
  let currentMatchIdx    = -1;
  let resizeObserver     = null;

  /* ── Helpers ── */

  function setStatus(state, message) {
    statusIndicator.className = 'status-indicator ' + state;
    statusText.textContent = message;
  }

  function setBusy(busy) {
    isBusy = busy;
    captureBtn.disabled = busy;
    findCaptureBtn.disabled = busy;
    urlInput.disabled = busy;
  }

  function getUrl() {
    const raw = urlInput.value.trim();
    if (!raw) return null;
    return /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
  }

  /* ── Scale calculation ── */

  function getScale(screenshotW) {
    const displayW = previewImage.clientWidth || previewImage.naturalWidth || screenshotW;
    return displayW / screenshotW;
  }

  /* ── Positioning ── */

  function applyPosition(el, item, scale) {
    el.style.left   = (item.x * scale) + 'px';
    el.style.top    = (item.y * scale) + 'px';
    el.style.width  = (item.width  * scale) + 'px';
    el.style.height = (item.height * scale) + 'px';
  }

  function applyTextStyle(el, item, scale) {
    const fs = (item.fontSize || 16) * scale;
    el.style.fontSize   = fs + 'px';
    el.style.fontFamily = item.fontFamily || 'sans-serif';
  }

  /* ── Build Layers ── */

  function buildLayers(spatialMap, dimensions) {
    if (textLayerEl)      { textLayerEl.remove();      textLayerEl = null; }
    if (highlightLayerEl) { highlightLayerEl.remove(); highlightLayerEl = null; }
    textNodeEls  = [];
    highlightEls = [];

    if (!spatialMap || spatialMap.length === 0) return;

    const screenshotW = dimensions.width;
    const scale = getScale(screenshotW);

    textLayerEl      = document.createElement('div');
    textLayerEl.className = 'text-layer';

    highlightLayerEl = document.createElement('div');
    highlightLayerEl.className = 'highlight-layer';

    spatialMap.forEach((item) => {
      /* Ghost text node — selectable, transparent */
      const textEl = document.createElement('div');
      textEl.className = 'text-node';
      textEl.textContent = item.text;
      textEl.dataset.text = item.text.toLowerCase();
      textEl.title = item.text;
      applyPosition(textEl, item, scale);
      applyTextStyle(textEl, item, scale);
      textLayerEl.appendChild(textEl);
      textNodeEls.push(textEl);

      /* Highlight box — visual only, pointer-events: none via layer */
      const hlEl = document.createElement('div');
      hlEl.className = 'highlight-box';
      applyPosition(hlEl, item, scale);
      highlightLayerEl.appendChild(hlEl);
      highlightEls.push(hlEl);
    });

    previewContainer.appendChild(textLayerEl);
    previewContainer.appendChild(highlightLayerEl);
  }

  function repositionAllNodes() {
    if (!currentSpatialMap.length) return;
    const scale = getScale(currentDimensions.width);
    currentSpatialMap.forEach((item, i) => {
      if (textNodeEls[i])  {
        applyPosition(textNodeEls[i], item, scale);
        applyTextStyle(textNodeEls[i], item, scale);
      }
      if (highlightEls[i]) applyPosition(highlightEls[i], item, scale);
    });
  }

  /* ── Preview Display ── */

  function showPreview(base64Data, dimensions, spatialMap) {
    currentDimensions = dimensions;
    currentSpatialMap = spatialMap || [];

    previewImage.src = 'data:image/png;base64,' + base64Data;
    previewContainer.classList.remove('hidden');
    previewPlaceholder.classList.add('hidden');
    previewDims.textContent = `${dimensions.width} \u00d7 ${dimensions.height}px`;

    searchInput.value = '';
    resetSearch();

    previewImage.onload = () => {
      buildLayers(currentSpatialMap, currentDimensions);

      if (resizeObserver) resizeObserver.disconnect();
      resizeObserver = new ResizeObserver(() => repositionAllNodes());
      resizeObserver.observe(previewImage);

      searchInput.disabled = false;
      updateSearchCounter(0, 0);
    };
  }

  /* ── Search Engine ── */

  function resetSearch() {
    matchIndices    = [];
    currentMatchIdx = -1;
    clearAllHighlights();
    updateSearchCounter(0, 0);
    prevMatchBtn.disabled = true;
    nextMatchBtn.disabled = true;
  }

  function clearAllHighlights() {
    highlightEls.forEach((el) => {
      el.className = 'highlight-box';
    });
  }

  function runSearch(query) {
    clearAllHighlights();
    matchIndices    = [];
    currentMatchIdx = -1;

    if (!query) {
      updateSearchCounter(0, 0);
      prevMatchBtn.disabled = true;
      nextMatchBtn.disabled = true;
      return;
    }

    const q = query.toLowerCase();
    textNodeEls.forEach((textEl, idx) => {
      if (textEl.dataset.text.includes(q)) {
        highlightEls[idx].className = 'highlight-box match';
        matchIndices.push(idx);
      }
    });

    const total = matchIndices.length;
    if (total > 0) {
      currentMatchIdx = 0;
      activateMatch(currentMatchIdx);
    }

    updateSearchCounter(total > 0 ? 1 : 0, total);
    prevMatchBtn.disabled = total === 0;
    nextMatchBtn.disabled = total === 0;
  }

  function activateMatch(idx) {
    highlightEls.forEach((el) => el.classList.remove('match-current'));

    const targetIdx = matchIndices[idx];
    if (targetIdx === undefined) return;

    const hlEl = highlightEls[targetIdx];
    hlEl.classList.add('match-current');
    updateSearchCounter(idx + 1, matchIndices.length);

    hlEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function updateSearchCounter(current, total) {
    searchCounter.className = 'search-counter';
    if (total === 0 && searchInput.value.trim()) {
      searchCounter.textContent = 'No results';
      searchCounter.classList.add('no-results');
    } else if (total === 0) {
      searchCounter.textContent = '0 results';
    } else {
      searchCounter.textContent = `${current} of ${total}`;
      searchCounter.classList.add('has-results');
    }
  }

  searchInput.addEventListener('input', () => runSearch(searchInput.value.trim()));

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.shiftKey ? stepMatch(-1) : stepMatch(1);
  });

  nextMatchBtn.addEventListener('click', () => stepMatch(1));
  prevMatchBtn.addEventListener('click', () => stepMatch(-1));

  function stepMatch(dir) {
    if (matchIndices.length === 0) return;
    currentMatchIdx = (currentMatchIdx + dir + matchIndices.length) % matchIndices.length;
    activateMatch(currentMatchIdx);
  }

  /* ── Capture Handlers ── */

  async function sendCapture(action, url) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action, url }, (res) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(res);
      });
    });
  }

  function handleCaptureResponse(response, modeLabel) {
    if (response.success) {
      showPreview(response.screenshot, response.dimensions, response.spatialMap || []);
      capturedHtml = response.html;
      viewHtmlBtn.disabled = !capturedHtml;
      const nodeCount = (response.spatialMap || []).length;
      setStatus('success', `${modeLabel} — ${response.dimensions.width}\u00d7${response.dimensions.height}px · ${nodeCount} text nodes`);
    } else {
      setStatus('error', response.error || 'Capture failed.');
    }
  }

  captureBtn.addEventListener('click', async () => {
    if (isBusy) return;
    const url = getUrl();
    if (!url) { setStatus('error', 'Please enter a URL first.'); return; }
    urlInput.value = url;
    setBusy(true);
    setStatus('loading', 'Opening tab and loading page…');
    viewHtmlBtn.disabled = true;
    searchInput.disabled = true;
    capturedHtml = null;
    resetSearch();
    try {
      handleCaptureResponse(await sendCapture('capture', url), 'Captured');
    } catch (err) {
      setStatus('error', err.message || 'Unknown error.');
    } finally {
      setBusy(false);
    }
  });

  findCaptureBtn.addEventListener('click', async () => {
    if (isBusy) return;
    const url = getUrl();
    if (!url) { setStatus('error', 'Please enter a URL first.'); return; }
    urlInput.value = url;
    setBusy(true);
    setStatus('loading', 'Searching for open tab…');
    viewHtmlBtn.disabled = true;
    searchInput.disabled = true;
    capturedHtml = null;
    resetSearch();
    try {
      handleCaptureResponse(await sendCapture('find_and_capture', url), 'Found & captured');
    } catch (err) {
      setStatus('error', err.message || 'Unknown error.');
    } finally {
      setBusy(false);
    }
  });

  /* ── HTML Viewer Modal ── */

  viewHtmlBtn.addEventListener('click', () => {
    if (!capturedHtml) return;
    htmlCode.textContent = formatHtml(capturedHtml);
    htmlModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => htmlModal.classList.add('hidden'));

  htmlModal.addEventListener('click', (e) => {
    if (e.target === htmlModal) htmlModal.classList.add('hidden');
  });

  copyHtmlBtn.addEventListener('click', async () => {
    if (!capturedHtml) return;
    try {
      await navigator.clipboard.writeText(capturedHtml);
      copyHtmlBtn.textContent = 'Copied!';
    } catch (e) {
      copyHtmlBtn.textContent = 'Failed';
    }
    setTimeout(() => { copyHtmlBtn.textContent = 'Copy'; }, 2000);
  });

  /* ── Keyboard Shortcuts ── */

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') htmlModal.classList.add('hidden');
    if ((e.key === 'Enter') && (e.ctrlKey || e.metaKey)) captureBtn.click();
  });

  /* ── HTML Formatter ── */

  function formatHtml(html) {
    let indent = 0;
    const lines = html.replace(/>\s*</g, '>\n<').split('\n');
    return lines.map((line) => {
      line = line.trim();
      if (!line) return '';
      if (/^<\//.test(line)) indent = Math.max(0, indent - 1);
      const result = '  '.repeat(indent) + line;
      if (
        /^<[^/!][^>]*[^/]>$/.test(line) &&
        !/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i.test(line)
      ) indent++;
      return result;
    }).filter(Boolean).join('\n');
  }

  setStatus('ready', 'Ready');
})();
