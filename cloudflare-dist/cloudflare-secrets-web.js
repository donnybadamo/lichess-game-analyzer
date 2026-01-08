/**
 * Cloudflare Worker Secrets Integration for Web App
 */

// IMPORTANT: Update this with your actual Worker URL after deployment
// Replace YOUR_SUBDOMAIN with your actual Worker subdomain
const CLOUDFLARE_WORKER_URL = 'https://chess-analyzer-secrets.7jkvwxtmvm.workers.dev';

async function getSecretFromCloudflare(secretName) {
  try {
    if (!CLOUDFLARE_WORKER_URL || CLOUDFLARE_WORKER_URL.includes('YOUR_SUBDOMAIN')) {
      console.warn('⚠️ Cloudflare Worker URL not configured');
      console.log('💡 Update CLOUDFLARE_WORKER_URL in cloudflare-secrets-web.js with your Worker URL');
      return null;
    }
    
    const endpoint = `${CLOUDFLARE_WORKER_URL.replace(/\/$/, '')}/get-secret`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretName })
    });
    
    if (!response.ok) {
      console.error(`❌ Worker error for ${secretName}:`, response.status);
      return null;
    }
    
    const data = await response.json();
    return data.secretValue || null;
    
  } catch (error) {
    console.error(`❌ Error fetching secret ${secretName}:`, error);
    return null;
  }
}

async function loadElevenLabsCredentials() {
  try {
    console.log('🔐 Loading ElevenLabs credentials from Cloudflare Worker...');
    
    const [apiKey, agentId, voiceId] = await Promise.all([
      getSecretFromCloudflare('ELEVENLABS_API_KEY'),
      getSecretFromCloudflare('ELEVENLABS_AGENT_ID'),
      getSecretFromCloudflare('ELEVENLABS_VOICE_ID')
    ]);
    
    if (!apiKey) {
      console.warn('⚠️ No API key found in Cloudflare Worker');
      console.log('💡 Configure secrets in Cloudflare Worker using: wrangler secret put ELEVENLABS_API_KEY');
      console.log('💡 Voice will use browser TTS until credentials are configured.');
      return null;
    }

    // Store in localStorage for the web app to use
    const loadedSecrets = [];
    localStorage.setItem('elevenlabsApiKey', apiKey);
    loadedSecrets.push('API_KEY');

    if (agentId) {
      localStorage.setItem('elevenlabsAgentId', agentId);
      loadedSecrets.push('AGENT_ID');
    }
    if (voiceId) {
      localStorage.setItem('elevenlabsVoiceId', voiceId);
      loadedSecrets.push('VOICE_ID');
    }

    console.log('✅ Loaded ElevenLabs credentials:', loadedSecrets.join(', '));
    if (!agentId || !voiceId) {
      console.warn('⚠️ Missing some credentials:',
        [!agentId && 'AGENT_ID', !voiceId && 'VOICE_ID'].filter(Boolean).join(', '));
      console.log('💡 Configure missing secrets using: wrangler secret put <SECRET_NAME>');
    }
    
    return { apiKey, agentId, voiceId };
    
  } catch (error) {
    console.error('❌ Error loading credentials:', error);
    return null;
  }
}

async function loadGoogleTTSCredentials() {
  try {
    const apiKey = await getSecretFromCloudflare('GOOGLE_TTS_API_KEY');
    
    if (apiKey) {
      localStorage.setItem('googleTTSApiKey', apiKey);
      console.log('✅ Loaded Google TTS API key from Cloudflare Worker');
      return apiKey;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error loading Google TTS credentials:', error);
    return null;
  }
}

// Export functions globally
window.getSecretFromCloudflare = getSecretFromCloudflare;
window.loadElevenLabsCredentials = loadElevenLabsCredentials;
window.loadGoogleTTSCredentials = loadGoogleTTSCredentials;

