const API_URL = 'http://localhost:4000';

async function postApplication(payload, jwt) {
  const response = await fetch(`${API_URL}/api/applications/log`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return { ok: response.ok, data };
}

async function queueApplication(payload) {
  const { queuedApplications = [] } = await chrome.storage.local.get(['queuedApplications']);
  queuedApplications.push({ payload, queuedAt: new Date().toISOString() });
  await chrome.storage.local.set({ queuedApplications });
}

async function flushQueue() {
  const { jwt, queuedApplications = [] } = await chrome.storage.local.get(['jwt', 'queuedApplications']);
  if (!jwt || queuedApplications.length === 0) return;

  const remaining = [];
  for (const item of queuedApplications) {
    try {
      const result = await postApplication(item.payload, jwt);
      if (!result.ok) remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }
  await chrome.storage.local.set({ queuedApplications: remaining });
}

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
      const result = await postApplication(message.payload, jwt);
      if (result.ok) {
        chrome.storage.local.set({
          lastLoggedApplication: message.payload,
          lastLoggedAt: new Date().toISOString(),
        });
      } else if (result.data?.message !== 'upgrade_required') {
        await queueApplication(message.payload);
      }
      sendResponse(result);
    } catch (error) {
      await queueApplication(message.payload);
      sendResponse({ ok: false, message: String(error) });
    }
  });

  return true;
});

chrome.runtime.onStartup.addListener(flushQueue);
chrome.alarms.create('jobtrackr-flush', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'jobtrackr-flush') flushQueue();
});
