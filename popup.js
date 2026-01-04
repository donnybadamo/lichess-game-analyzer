// Popup script

// Load existing credentials on popup open
chrome.storage.local.get(['elevenlabsApiKey', 'elevenlabsAgentId', 'elevenlabsVoiceId'], (result) => {
  if (result.elevenlabsApiKey) {
    document.getElementById('apiKey').value = result.elevenlabsApiKey;
  }
  if (result.elevenlabsAgentId) {
    document.getElementById('agentId').value = result.elevenlabsAgentId;
  }
  if (result.elevenlabsVoiceId) {
    document.getElementById('voiceId').value = result.elevenlabsVoiceId;
  }
});

// Analyze button
document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  statusDiv.className = 'status';
  statusDiv.textContent = 'Analyzing...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { action: 'analyzeCurrentGame' }, (response) => {
      if (chrome.runtime.lastError) {
        statusDiv.className = 'status error';
        statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
        return;
      }
      
      if (response && response.success) {
        statusDiv.className = 'status success';
        statusDiv.textContent = 'Analysis opened in new tab!';
      } else {
        statusDiv.className = 'status error';
        statusDiv.textContent = response?.error || 'Could not analyze game';
      }
    });
  } catch (error) {
    statusDiv.className = 'status error';
    statusDiv.textContent = 'Error: ' + error.message;
  }
});

// Save secrets button
document.getElementById('saveSecretsBtn').addEventListener('click', async () => {
  const secretsStatus = document.getElementById('secretsStatus');
  const apiKey = document.getElementById('apiKey').value.trim();
  const agentId = document.getElementById('agentId').value.trim();
  const voiceId = document.getElementById('voiceId').value.trim();
  
  secretsStatus.className = 'status';
  secretsStatus.textContent = 'Saving...';
  
  if (!apiKey) {
    secretsStatus.className = 'status error';
    secretsStatus.textContent = 'Error: API Key is required';
    return;
  }
  
  if (apiKey && !apiKey.startsWith('sk_')) {
    secretsStatus.className = 'status error';
    secretsStatus.textContent = 'Warning: API key should start with "sk_"';
    // Still save it, just warn
  }
  
  try {
    const credentials = { elevenlabsApiKey: apiKey };
    if (agentId) credentials.elevenlabsAgentId = agentId;
    if (voiceId) credentials.elevenlabsVoiceId = voiceId;
    
    await chrome.storage.local.set(credentials);
    
    secretsStatus.className = 'status success';
    secretsStatus.textContent = '✅ Credentials saved!';
    
    // Clear status after 3 seconds
    setTimeout(() => {
      secretsStatus.textContent = '';
      secretsStatus.className = 'status';
    }, 3000);
  } catch (error) {
    secretsStatus.className = 'status error';
    secretsStatus.textContent = 'Error: ' + error.message;
  }
});

