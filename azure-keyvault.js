// Azure Key Vault integration for secure credential retrieval
// This file fetches secrets from Azure Key Vault via a proxy API

async function getSecretFromKeyVault(secretName) {
  try {
    // Get Azure proxy URL from storage
    const storage = await chrome.storage.local.get(['azureProxyUrl']);
    const azureProxyUrl = storage.azureProxyUrl;
    
    if (!azureProxyUrl) {
      console.log('Azure Key Vault proxy URL not configured');
      return null;
    }
    
    // Fetch secret from Azure Function proxy
    const response = await fetch(`${azureProxyUrl}/get-secret`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secretName: secretName
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Key Vault error for ${secretName}:`, response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    return data.secretValue || data.value;
    
  } catch (error) {
    console.error(`Error fetching secret ${secretName} from Key Vault:`, error);
    return null;
  }
}

// Load ElevenLabs credentials from Azure Key Vault
async function loadElevenLabsFromKeyVault() {
  try {
    console.log('Loading ElevenLabs credentials from Azure Key Vault...');
    
    const apiKey = await getSecretFromKeyVault('elevenlabs-api-key');
    const agentId = await getSecretFromKeyVault('elevenlabs-agent-id');
    const voiceId = await getSecretFromKeyVault('elevenlabs-voice-id');
    
    if (apiKey) {
      const credentials = {
        elevenlabsApiKey: apiKey
      };
      
      if (agentId) {
        credentials.elevenlabsAgentId = agentId;
      }
      
      if (voiceId) {
        credentials.elevenlabsVoiceId = voiceId;
      }
      
      await chrome.storage.local.set(credentials);
      
      console.log('✓ Loaded ElevenLabs credentials from Azure Key Vault');
      console.log('  API Key:', apiKey.substring(0, 10) + '...');
      console.log('  Agent ID:', agentId || 'Not set');
      console.log('  Voice ID:', voiceId || 'Not set');
      
      return true;
    } else {
      console.log('⚠ No API key found in Key Vault');
      return false;
    }
  } catch (error) {
    console.error('Error loading credentials from Key Vault:', error);
    return false;
  }
}

// Make functions globally available
window.getSecretFromKeyVault = getSecretFromKeyVault;
window.loadElevenLabsFromKeyVault = loadElevenLabsFromKeyVault;

