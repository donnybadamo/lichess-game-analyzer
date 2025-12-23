// Cloudflare Worker - Secrets Proxy
// Stores secrets directly in Cloudflare Worker secrets (no Azure Key Vault needed)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
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
    
    // Health check endpoint (GET)
    if (url.pathname === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ 
        status: 'ok',
        method: request.method,
        path: url.pathname 
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Only allow POST requests for /get-secret
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ 
        error: 'Method not allowed',
        receivedMethod: request.method,
        allowedMethods: ['POST'],
        path: url.pathname
      }), { 
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (url.pathname !== '/get-secret') {
      return new Response(JSON.stringify({ 
        error: 'Not found',
        path: url.pathname,
        availableEndpoints: ['/get-secret', '/health']
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
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Map secret names to Cloudflare Worker secrets
      // Supports multiple naming conventions
      const secretMap = {
        // API Key variations
        'ELEVENLABS_API_KEY': env.ELEVENLABS_API_KEY,
        'elevenlabs-api-key': env.ELEVENLABS_API_KEY,
        'elevenlabsApiKey': env.ELEVENLABS_API_KEY,
        
        // Agent ID variations
        'ELEVENLABS_AGENT_ID': env.ELEVENLABS_AGENT_ID,
        'elevenlabs-agent-id': env.ELEVENLABS_AGENT_ID,
        'elevenlabsAgentId': env.ELEVENLABS_AGENT_ID,
        
        // Voice ID variations
        'ELEVENLABS_VOICE_ID': env.ELEVENLABS_VOICE_ID,
        'elevenlabs-voice-id': env.ELEVENLABS_VOICE_ID,
        'elevenlabsVoiceId': env.ELEVENLABS_VOICE_ID,
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

