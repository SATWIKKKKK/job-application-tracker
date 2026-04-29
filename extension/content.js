const APPLY_RE = /\b(apply|easy apply|submit application)\b/i;
let lastSentKey = '';

function portalName() {
  const host = location.hostname.replace(/^www\./, '');
  return host.split('.')[0].replace(/^\w/, (char) => char.toUpperCase());
}

function textFrom(selectors) {
  for (const selector of selectors) {
    const node = document.querySelector(selector);
    const text = node?.textContent?.trim();
    if (text) return text;
  }
  return '';
}

function extractApplication() {
  const title =
    textFrom(['h1', '[data-testid*="job-title"]', '.job-title', '.jobs-unified-top-card__job-title']) ||
    document.title.split('|')[0].trim();
  const company =
    textFrom(['[data-testid*="company"]', '.company', '.company-name', '.jobs-unified-top-card__company-name']) ||
    'Unknown company';
  const locationText = textFrom(['[data-testid*="location"]', '.location', '.job-location']);

  return {
    job_title: title,
    company,
    portal: portalName(),
    job_url: location.href,
    location: locationText,
    applied_at: new Date().toISOString(),
  };
}

function maybeWireButton(button) {
  if (button.dataset.jobtrackrBound === 'true') return;
  const label = button.textContent?.trim() || button.getAttribute('aria-label') || '';
  if (!APPLY_RE.test(label)) return;

  button.dataset.jobtrackrBound = 'true';
  button.addEventListener('click', () => {
    setTimeout(() => {
      const payload = extractApplication();
      const key = `${payload.job_title}:${payload.company}:${payload.job_url}`;
      if (key === lastSentKey) return;
      lastSentKey = key;
      chrome.runtime.sendMessage({
        type: 'JOBTRACKR_APPLICATION_DETECTED',
        payload,
      });
    }, 800);
  });
}

function scan() {
  document.querySelectorAll('button,a,[role="button"],input[type="submit"]').forEach(maybeWireButton);
}

scan();
new MutationObserver(scan).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
