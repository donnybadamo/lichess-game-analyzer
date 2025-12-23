/**
 * Cloudflare Worker Secrets Integration
 * Fetches ElevenLabs credentials from Cloudflare Worker secrets
 */

/**
 * Fetches a secret from Cloudflare Worker
 * @param {string} secretName - Name of the secret to fetch
 * @returns {Promise<string|null>} Secret value or null if not found
 */
async function getSecretFromCloudflare(secretName) {
  try {
    const storage = await chrome.storage.local.get(['cloudflareWorkerUrl']);
    const workerUrl = storage.cloudflareWorkerUrl;
    
    if (!workerUrl) {
      console.warn('⚠️ Cloudflare Worker URL not configured');
      console.log('💡 Set it: chrome.storage.local.set({ cloudflareWorkerUrl: "https://your-worker.workers.dev" })');
      return null;
    }
    
    const endpoint = `${workerUrl.replace(/\/$/, '')}/get-secret`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretName })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Worker error for ${secretName}:`, response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    return data.secretValue || null;
    
  } catch (error) {
    console.error(`❌ Error fetching secret ${secretName}:`, error);
    return null;
  }
}

/**
 * Loads ElevenLabs credentials from Cloudflare Worker secrets
 * @returns {Promise<boolean>} True if credentials were loaded successfully
 */
async function loadElevenLabsCredentials() {
  try {
    console.log('🔐 Loading ElevenLabs credentials from Cloudflare Worker...');
    
    // Secret name variations for compatibility
    const secretNames = {
      apiKey: ['ELEVENLABS_API_KEY', 'elevenlabs-api-key', 'elevenlabsApiKey'],
      agentId: ['ELEVENLABS_AGENT_ID', 'elevenlabs-agent-id', 'elevenlabsAgentId'],
      voiceId: ['ELEVENLABS_VOICE_ID', 'elevenlabs-voice-id', 'elevenlabsVoiceId']
    };
    
    // Fetch secrets in parallel (try each variation)
    const fetchSecret = async (variations) => {
      for (const name of variations) {
        const value = await getSecretFromCloudflare(name);
        if (value) return value;
      }
      return null;
    };
    
    const [apiKey, agentId, voiceId] = await Promise.all([
      fetchSecret(secretNames.apiKey),
      fetchSecret(secretNames.agentId),
      fetchSecret(secretNames.voiceId)
    ]);
    
    if (!apiKey) {
      console.warn('⚠️ No API key found in Cloudflare Worker');
      console.log('💡 Ensure:');
      console.log('   1. Worker URL is set in Chrome storage');
      console.log('   2. Secret "ELEVENLABS_API_KEY" exists in Worker');
      console.log('   3. Worker is deployed and accessible');
      return false;
    }
    
    // Store credentials in Chrome storage
    const credentials = { elevenlabsApiKey: apiKey };
    if (agentId) credentials.elevenlabsAgentId = agentId;
    if (voiceId) credentials.elevenlabsVoiceId = voiceId;
    
    await chrome.storage.local.set(credentials);
    
    console.log('✅ Loaded ElevenLabs credentials from Cloudflare Worker');
    console.log(`   API Key: ${apiKey.substring(0, 15)}...`);
    console.log(`   Agent ID: ${agentId || 'Not set'}`);
    console.log(`   Voice ID: ${voiceId || 'Not set'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error loading credentials:', error);
    return false;
  }
}

// Export functions globally
window.getSecretFromCloudflare = getSecretFromCloudflare;
window.loadElevenLabsCredentials = loadElevenLabsCredentials;
