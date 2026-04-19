(() => {
  const urlInput = document.getElementById('urlInput');
  const captureBtn = document.getElementById('captureBtn');
  const findCaptureBtn = document.getElementById('findCaptureBtn');
  const viewHtmlBtn = document.getElementById('viewHtmlBtn');
  const previewImage = document.getElementById('previewImage');
  const previewPlaceholder = document.getElementById('previewPlaceholder');
  const previewDims = document.getElementById('previewDims');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const htmlModal = document.getElementById('htmlModal');
  const htmlCode = document.getElementById('htmlCode');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const copyHtmlBtn = document.getElementById('copyHtmlBtn');

  let capturedHtml = null;
  let isBusy = false;

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

  function showPreview(base64Data, dimensions) {
    previewImage.src = 'data:image/png;base64,' + base64Data;
    previewImage.classList.remove('hidden');
    previewPlaceholder.classList.add('hidden');
    previewDims.textContent = `${dimensions.width} × ${dimensions.height}px`;
  }

  function getUrl() {
    const raw = urlInput.value.trim();
    if (!raw) return null;
    if (!/^https?:\/\//i.test(raw)) {
      return 'https://' + raw;
    }
    return raw;
  }

  captureBtn.addEventListener('click', async () => {
    if (isBusy) return;
    const url = getUrl();
    if (!url) {
      setStatus('error', 'Please enter a URL first.');
      return;
    }
    urlInput.value = url;
    setBusy(true);
    setStatus('loading', 'Opening tab and loading page…');
    viewHtmlBtn.disabled = true;
    capturedHtml = null;

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'capture', url }, (res) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(res);
        });
      });

      if (response.success) {
        showPreview(response.screenshot, response.dimensions);
        capturedHtml = response.html;
        viewHtmlBtn.disabled = !capturedHtml;
        setStatus('success', `Captured ${response.dimensions.width}×${response.dimensions.height}px`);
      } else {
        setStatus('error', response.error || 'Capture failed.');
      }
    } catch (err) {
      setStatus('error', err.message || 'Unknown error.');
    } finally {
      setBusy(false);
    }
  });

  findCaptureBtn.addEventListener('click', async () => {
    if (isBusy) return;
    const url = getUrl();
    if (!url) {
      setStatus('error', 'Please enter a URL first.');
      return;
    }
    urlInput.value = url;
    setBusy(true);
    setStatus('loading', 'Searching for open tab…');
    viewHtmlBtn.disabled = true;
    capturedHtml = null;

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'find_and_capture', url }, (res) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(res);
        });
      });

      if (response.success) {
        showPreview(response.screenshot, response.dimensions);
        capturedHtml = response.html;
        viewHtmlBtn.disabled = !capturedHtml;
        setStatus('success', `Captured from existing tab — ${response.dimensions.width}×${response.dimensions.height}px`);
      } else {
        setStatus('error', response.error || 'Capture failed.');
      }
    } catch (err) {
      setStatus('error', err.message || 'Unknown error.');
    } finally {
      setBusy(false);
    }
  });

  viewHtmlBtn.addEventListener('click', () => {
    if (!capturedHtml) return;
    htmlCode.textContent = formatHtml(capturedHtml);
    htmlModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    htmlModal.classList.add('hidden');
  });

  htmlModal.addEventListener('click', (e) => {
    if (e.target === htmlModal) {
      htmlModal.classList.add('hidden');
    }
  });

  copyHtmlBtn.addEventListener('click', async () => {
    if (!capturedHtml) return;
    try {
      await navigator.clipboard.writeText(capturedHtml);
      copyHtmlBtn.textContent = 'Copied!';
      setTimeout(() => { copyHtmlBtn.textContent = 'Copy'; }, 2000);
    } catch (e) {
      copyHtmlBtn.textContent = 'Failed';
      setTimeout(() => { copyHtmlBtn.textContent = 'Copy'; }, 2000);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      htmlModal.classList.add('hidden');
    }
    if ((e.key === 'Enter') && (e.ctrlKey || e.metaKey)) {
      captureBtn.click();
    }
  });

  function formatHtml(html) {
    let indent = 0;
    const lines = html
      .replace(/>\s*</g, '>\n<')
      .split('\n');

    return lines.map((line) => {
      line = line.trim();
      if (!line) return '';

      if (/^<\//.test(line)) indent = Math.max(0, indent - 1);
      const result = '  '.repeat(indent) + line;
      if (/^<[^/!][^>]*[^/]>$/.test(line) && !/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i.test(line)) {
        indent++;
      }
      return result;
    }).filter(Boolean).join('\n');
  }

  setStatus('ready', 'Ready');
})();
