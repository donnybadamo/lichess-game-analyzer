// Popup script

document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = 'Analyzing...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'analyzeCurrentGame' }, (response) => {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
        return;
      }
      
      if (response && response.success) {
        statusDiv.textContent = 'Analysis opened in new tab!';
      } else {
        statusDiv.textContent = response?.error || 'Could not analyze game';
      }
    });
  } catch (error) {
    statusDiv.textContent = 'Error: ' + error.message;
  }
});

