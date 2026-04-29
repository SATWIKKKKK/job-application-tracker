const API_URL = 'http://localhost:4000';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'JOBTRACKR_APPLICATION_DETECTED') return false;

  chrome.storage.local.get(['jwt', 'autoLogging'], async ({ jwt, autoLogging }) => {
    if (autoLogging === false) {
      sendResponse({ ok: false, message: 'auto_logging_disabled' });
      return;
    }

    if (!jwt) {
      sendResponse({ ok: false, message: 'missing_jwt' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/applications/log`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(message.payload),
      });
      const data = await response.json();
      if (response.ok) {
        chrome.storage.local.set({
          lastLoggedApplication: message.payload,
          lastLoggedAt: new Date().toISOString(),
        });
      }
      sendResponse({ ok: response.ok, data });
    } catch (error) {
      sendResponse({ ok: false, message: String(error) });
    }
  });

  return true;
});
