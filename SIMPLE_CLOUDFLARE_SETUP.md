# Simple Setup - Everything in Cloudflare Worker

If you're storing secrets directly in Cloudflare (not using Azure Key Vault), here's the simple setup:

## Cloudflare Worker Secrets

Go to: Cloudflare Dashboard → Your Worker → Settings → Variables → Secrets

Add these secrets:

### 1. ElevenLabs API Key
- **Name:** `ELEVENLABS_API_KEY` (or `elevenlabsApiKey`)
- **Value:** Your ElevenLabs API key (starts with `sk_`)
- **Example:** `sk_dbbac21a4dd5ed7f06da1bf260221b0bcfb5d17bba0637d7`

### 2. ElevenLabs Agent ID
- **Name:** `ELEVENLABS_AGENT_ID` (or `elevenlabsAgentId`)
- **Value:** `agent_1201kd44fpr5ehethh3qchq0hj0a` ← **YOUR VALUE**
- **Example:** `agent_1201kd44fpr5ehethh3qchq0hj0a`

### 3. ElevenLabs Voice ID (Optional)
- **Name:** `ELEVENLABS_VOICE_ID` (or `elevenlabsVoiceId`)
- **Value:** Your voice ID (if you want to override)
- **Example:** `21m00Tcm4TlvDq8ikWAM`

---

## Update Worker Code

Since you're not using Azure Key Vault, you need to update the Worker code to read from Cloudflare secrets instead:

```javascript
// Cloudflare Worker - Simple version (no Key Vault)
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
      const secretMap = {
        'elevenlabs-api-key': env.ELEVENLABS_API_KEY,
        'elevenlabsApiKey': env.ELEVENLABS_API_KEY,
        'ELEVENLABS_API_KEY': env.ELEVENLABS_API_KEY,
        'elevenlabs-agent-id': env.ELEVENLABS_AGENT_ID,
        'elevenlabsAgentId': env.ELEVENLABS_AGENT_ID,
        'ELEVENLABS_AGENT_ID': env.ELEVENLABS_AGENT_ID,
        'elevenlabs-voice-id': env.ELEVENLABS_VOICE_ID,
        'elevenlabsVoiceId': env.ELEVENLABS_VOICE_ID,
        'ELEVENLABS_VOICE_ID': env.ELEVENLABS_VOICE_ID,
      };
      
      const secretValue = secretMap[secretName];
      
      if (!secretValue) {
        return new Response(JSON.stringify({ 
          error: 'Secret not found',
          availableSecrets: Object.keys(secretMap)
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
```

---

## Update Extension Code

Update `azure-keyvault.js` to work with this simpler setup:

The extension code should work as-is, but make sure it's calling your Worker URL correctly.

---

## Setup Steps

1. **Deploy Worker:**
   - Copy the simple Worker code above
   - Paste into Cloudflare Worker editor
   - Deploy

2. **Add Secrets:**
   - Go to Settings → Variables → Secrets
   - Add:
     - `ELEVENLABS_API_KEY` → Your API key
     - `ELEVENLABS_AGENT_ID` → `agent_1201kd44fpr5ehethh3qchq0hj0a`
     - `ELEVENLABS_VOICE_ID` → (optional)

3. **Set Worker URL in Extension:**
   ```javascript
   chrome.storage.local.set({
     cloudflareWorkerUrl: 'https://your-worker.workers.dev'
   });
   ```

4. **Done!** The extension will fetch secrets from Cloudflare Worker.

---

## Benefits of This Approach

✅ **Simpler** - No Azure Key Vault needed
✅ **Faster** - Direct access to secrets
✅ **Easier** - Everything in one place (Cloudflare)

---

## Test It

```javascript
// Test Worker
fetch('https://your-worker.workers.dev/get-secret', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secretName: 'elevenlabs-agent-id' })
})
.then(r => r.json())
.then(data => console.log('Agent ID:', data.secretValue));
```

