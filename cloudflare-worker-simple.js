// Cloudflare Worker - Simple version (no Azure Key Vault)
// Stores secrets directly in Cloudflare Worker secrets

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle favicon.ico requests - return empty 204
    if (url.pathname === '/favicon.ico' || url.pathname === '/get-secret/favicon.ico') {
      return new Response(null, { 
        status: 204,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
    
    // Only allow POST requests for /get-secret
    if (url.pathname === '/get-secret' && request.method !== 'POST') {
      return new Response(JSON.stringify({ 
        error: 'Method not allowed',
        message: 'This endpoint only accepts POST requests. Please use POST method.'
      }), { 
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Allow': 'POST, OPTIONS'
        }
      });
    }
    
    // Only handle /get-secret endpoint
    if (url.pathname !== '/get-secret') {
      return new Response(JSON.stringify({ 
        error: 'Not found',
        message: 'Endpoint not found. Use /get-secret with POST method.'
      }), { 
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        }
      });
    }
    
    try {
      const { secretName } = await request.json();
      
      if (!secretName) {
        return new Response(JSON.stringify({ error: 'secretName is required' }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Map secret names to Cloudflare Worker secrets
      // Supports multiple naming conventions
      const secretMap = {
        // ElevenLabs API Key variations
        'elevenlabs-api-key': env.ELEVENLABS_API_KEY,
        'elevenlabsApiKey': env.ELEVENLABS_API_KEY,
        'ELEVENLABS_API_KEY': env.ELEVENLABS_API_KEY,
        
        // ElevenLabs Agent ID variations
        'elevenlabs-agent-id': env.ELEVENLABS_AGENT_ID,
        'elevenlabsAgentId': env.ELEVENLABS_AGENT_ID,
        'ELEVENLABS_AGENT_ID': env.ELEVENLABS_AGENT_ID,
        
        // ElevenLabs Voice ID variations
        'elevenlabs-voice-id': env.ELEVENLABS_VOICE_ID,
        'elevenlabsVoiceId': env.ELEVENLABS_VOICE_ID,
        'ELEVENLABS_VOICE_ID': env.ELEVENLABS_VOICE_ID,
        
        // Google TTS API Key variations
        'google-tts-api-key': env.GOOGLE_TTS_API_KEY,
        'googleTTSApiKey': env.GOOGLE_TTS_API_KEY,
        'GOOGLE_TTS_API_KEY': env.GOOGLE_TTS_API_KEY,
      };
      
      const secretValue = secretMap[secretName];
      
      if (!secretValue) {
        return new Response(JSON.stringify({ 
          error: 'Secret not found',
          requestedSecret: secretName,
          availableSecrets: Object.keys(secretMap).filter(k => secretMap[k])
        }), {
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      return new Response(JSON.stringify({
        secretValue: secretValue,
        secretName: secretName
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
}

