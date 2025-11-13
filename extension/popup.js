const statusDiv = document.getElementById('status');
const wsUrlInput = document.getElementById('wsUrl');
const saveBtn = document.getElementById('saveBtn');

chrome.storage.local.get(['wsUrl'], (result) => {
  wsUrlInput.value = result.wsUrl || 'ws://localhost:8765';
});

chrome.runtime.sendMessage({ type: 'get_status' }, (response) => {
  if (response?.connected) {
    statusDiv.className = 'status connected';
    statusDiv.textContent = '✓ Connected to local server';
  } else {
    statusDiv.className = 'status disconnected';
    statusDiv.textContent = '✗ Not connected to local server';
  }
});

saveBtn.addEventListener('click', () => {
  const wsUrl = wsUrlInput.value;
  
  chrome.storage.local.set({ wsUrl }, () => {
    alert('Settings saved! Please reload the extension.');
  });
});
