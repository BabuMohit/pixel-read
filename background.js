let extensionTabId = null;

chrome.action.onClicked.addListener(() => {
  if (extensionTabId !== null) {
    chrome.tabs.get(extensionTabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        openExtensionTab();
      } else {
        chrome.tabs.update(extensionTabId, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });
      }
    });
  } else {
    openExtensionTab();
  }
});

function openExtensionTab() {
  chrome.tabs.create({ url: chrome.runtime.getURL('main.html'), active: true }, (tab) => {
    extensionTabId = tab.id;
  });
}

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === extensionTabId) {
    extensionTabId = null;
  }
});

async function attachDebugger(tabId) {
  return new Promise((resolve, reject) => {
    chrome.debugger.attach({ tabId }, '1.3', () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

async function detachDebugger(tabId) {
  return new Promise((resolve) => {
    chrome.debugger.detach({ tabId }, () => {
      resolve();
    });
  });
}

async function sendDebugCommand(tabId, method, params = {}) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

async function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function captureFullPage(tabId) {
  let attached = false;
  try {
    await attachDebugger(tabId);
    attached = true;

    const metrics = await sendDebugCommand(tabId, 'Page.getLayoutMetrics');
    const width = Math.ceil(metrics.cssContentSize.width);
    const height = Math.ceil(metrics.cssContentSize.height);

    await sendDebugCommand(tabId, 'Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false
    });

    const screenshotResult = await sendDebugCommand(tabId, 'Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width,
        height,
        scale: 1
      }
    });

    let htmlContent = null;
    try {
      const evalResult = await sendDebugCommand(tabId, 'Runtime.evaluate', {
        expression: 'document.documentElement.outerHTML',
        returnByValue: true
      });
      if (evalResult && evalResult.result && evalResult.result.value) {
        htmlContent = evalResult.result.value;
      }
    } catch (e) {
      htmlContent = null;
    }

    let spatialMap = [];
    let devicePixelRatio = 1;
    try {
      const spatialScript = `
        (function() {
          const map = [];
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: function(node) {
                const text = node.textContent.trim();
                if (!text) return NodeFilter.FILTER_REJECT;
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const tag = parent.tagName ? parent.tagName.toUpperCase() : '';
                if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
                const style = window.getComputedStyle(parent);
                if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
                  return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          );
          let node;
          while ((node = walker.nextNode())) {
            const text = node.textContent.trim();
            if (!text) continue;
            const parent = node.parentElement;
            const rect = parent.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            map.push({
              text: text,
              x: Math.round(rect.left + window.scrollX),
              y: Math.round(rect.top + window.scrollY),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            });
          }
          return JSON.stringify({ spatialMap: map, devicePixelRatio: window.devicePixelRatio });
        })();
      `;
      const spatialResult = await sendDebugCommand(tabId, 'Runtime.evaluate', {
        expression: spatialScript,
        returnByValue: true
      });
      if (spatialResult && spatialResult.result && spatialResult.result.value) {
        const parsed = JSON.parse(spatialResult.result.value);
        spatialMap = parsed.spatialMap || [];
        devicePixelRatio = parsed.devicePixelRatio || 1;
      }
    } catch (e) {
      spatialMap = [];
    }

    return {
      screenshot: screenshotResult.data,
      html: htmlContent,
      dimensions: { width, height },
      spatialMap,
      devicePixelRatio
    };
  } finally {
    if (attached) {
      await detachDebugger(tabId);
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'capture') {
    handleCapture(message.url, sendResponse);
    return true;
  }
  if (message.action === 'find_and_capture') {
    handleFindAndCapture(message.url, sendResponse);
    return true;
  }
});

async function handleCapture(url, sendResponse) {
  let newTab = null;
  try {
    newTab = await new Promise((resolve, reject) => {
      chrome.tabs.create({ url, active: false }, (tab) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(tab);
      });
    });

    await waitForTabLoad(newTab.id);
    await new Promise(r => setTimeout(r, 800));

    const result = await captureFullPage(newTab.id);

    await new Promise((resolve) => {
      chrome.tabs.remove(newTab.id, () => resolve());
    });
    newTab = null;

    if (extensionTabId !== null) {
      chrome.tabs.update(extensionTabId, { active: true });
    }

    sendResponse({ success: true, ...result });
  } catch (err) {
    if (newTab) {
      chrome.tabs.remove(newTab.id, () => {});
    }
    sendResponse({ success: false, error: err.message });
  }
}

async function handleFindAndCapture(url, sendResponse) {
  try {
    const [currentWindow] = await new Promise((resolve) => {
      chrome.windows.getCurrent({ populate: true }, (win) => resolve([win]));
    });

    const matchingTab = currentWindow.tabs.find(
      (t) => t.url === url || t.url.startsWith(url) || url.startsWith(t.url)
    );

    if (!matchingTab) {
      sendResponse({ success: false, error: `No tab found with URL matching: ${url}` });
      return;
    }

    const result = await captureFullPage(matchingTab.id);

    if (extensionTabId !== null) {
      chrome.tabs.update(extensionTabId, { active: true });
    }

    sendResponse({ success: true, ...result });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}
