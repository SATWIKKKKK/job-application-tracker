const statusEl = document.getElementById('status');
const toggleEl = document.getElementById('autoLogging');
const jwtEl = document.getElementById('jwt');
const saveEl = document.getElementById('save');
const connectEl = document.getElementById('connect');
const lastLoggedEl = document.getElementById('lastLogged');

chrome.storage.local.get(['jwt', 'autoLogging', 'lastLoggedApplication', 'lastLoggedAt'], (data) => {
  statusEl.textContent = data.jwt ? 'Logged in' : 'No JWT';
  jwtEl.value = data.jwt || '';
  toggleEl.checked = data.autoLogging !== false;

  if (data.lastLoggedApplication) {
    lastLoggedEl.textContent = `${data.lastLoggedApplication.job_title} at ${data.lastLoggedApplication.company}`;
  }
});

toggleEl.addEventListener('change', () => {
  chrome.storage.local.set({ autoLogging: toggleEl.checked });
});

saveEl.addEventListener('click', () => {
  chrome.storage.local.set({ jwt: jwtEl.value.trim() }, () => {
    statusEl.textContent = jwtEl.value.trim() ? 'Logged in' : 'No JWT';
  });
});

connectEl.addEventListener('click', async () => {
  try {
    const response = await fetch('http://localhost:4000/api/auth/extension-token', {
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok || !data.token) {
      chrome.tabs.create({ url: 'http://localhost:3000/auth/signin' });
      return;
    }
    jwtEl.value = data.token;
    chrome.storage.local.set({ jwt: data.token, autoLogging: true }, () => {
      statusEl.textContent = 'Extension Active';
      toggleEl.checked = true;
    });
  } catch {
    chrome.tabs.create({ url: 'http://localhost:3000/auth/signin' });
  }
});
