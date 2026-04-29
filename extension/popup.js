const statusEl = document.getElementById('status');
const toggleEl = document.getElementById('autoLogging');
const jwtEl = document.getElementById('jwt');
const saveEl = document.getElementById('save');
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
