// Cloudflare Worker - Simple version (no Azure Key Vault)
// Stores secrets directly in Cloudflare Worker secrets

export default {
  async fetch(request, env) {
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
    
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    const url = new URL(request.url);
    if (url.pathname !== '/get-secret') {
      return new Response('Not found', { status: 404 });
    }
    
    try {
      const { secretName } = await request.json();
      
      if (!secretName) {
        return new Response(JSON.stringify({ error: 'secretName is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Map secret names to Cloudflare Worker secrets
      // Supports multiple naming conventions
      const secretMap = {
        // API Key variations
        'elevenlabs-api-key': env.ELEVENLABS_API_KEY,
        'elevenlabsApiKey': env.ELEVENLABS_API_KEY,
        'ELEVENLABS_API_KEY': env.ELEVENLABS_API_KEY,
        
        // Agent ID variations
        'elevenlabs-agent-id': env.ELEVENLABS_AGENT_ID,
        'elevenlabsAgentId': env.ELEVENLABS_AGENT_ID,
        'ELEVENLABS_AGENT_ID': env.ELEVENLABS_AGENT_ID,
        
        // Voice ID variations
        'elevenlabs-voice-id': env.ELEVENLABS_VOICE_ID,
        'elevenlabsVoiceId': env.ELEVENLABS_VOICE_ID,
        'ELEVENLABS_VOICE_ID': env.ELEVENLABS_VOICE_ID,
      };
      
      const secretValue = secretMap[secretName];
      
      if (!secretValue) {
        return new Response(JSON.stringify({ 
          error: 'Secret not found',
          requestedSecret: secretName,
          availableSecrets: Object.keys(secretMap).filter(k => secretMap[k])
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
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
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

