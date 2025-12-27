# Copy-Paste Guide: Deploy Cloudflare Worker

## Step 1: Copy the Worker Code

Copy **ALL** of this code:

```javascript
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
```

## Step 2: Deploy to Cloudflare Dashboard

1. **Go to:** https://dash.cloudflare.com/
2. **Click:** "Workers & Pages" in sidebar
3. **Click:** "Create application" → "Create Worker"
4. **Name it:** `lichess-secrets-proxy` (or any name you want)
5. **Click:** "Deploy" (creates empty Worker)
6. **Click:** "Edit code" button
7. **Delete ALL** the default code in the editor
8. **Paste** the code from Step 1 above
9. **Click:** "Save and deploy" ⚠️ **IMPORTANT!**

## Step 3: Add Secrets

1. **In the Worker page**, click **"Settings"** tab
2. **Scroll down** to **"Variables"** section
3. **Click:** "Add variable" → **"Secret"**
4. **Add these secrets one by one:**

   **Secret 1:**
   - Name: `ELEVENLABS_API_KEY`
   - Value: Your ElevenLabs API key (starts with `sk_`)
   - Click "Encrypt"

   **Secret 2:**
   - Name: `ELEVENLABS_AGENT_ID`
   - Value: Your agent ID (e.g., `agent_1201kd44fpr5ehethh3qchq0hj0a`)
   - Click "Encrypt"

   **Secret 3 (Optional):**
   - Name: `ELEVENLABS_VOICE_ID`
   - Value: Your voice ID (if you want to override agent voice)
   - Click "Encrypt"

## Step 4: Get Your Worker URL

After deploying, you'll see your Worker URL at the top:
- Format: `https://lichess-secrets-proxy.YOUR_SUBDOMAIN.workers.dev`
- **Copy this URL** - you'll need it for the extension

## Step 5: Configure Extension

Open browser console (on extension page) and run:

```javascript
chrome.storage.local.set({
  cloudflareWorkerUrl: 'https://YOUR_WORKER_URL_HERE.workers.dev'
});
```

**Replace** `YOUR_WORKER_URL_HERE` with your actual Worker URL (no trailing slash!)

## Step 6: Test It

Test the Worker directly:

```bash
curl -X POST https://YOUR_WORKER.workers.dev/get-secret \
  -H "Content-Type: application/json" \
  -d '{"secretName": "ELEVENLABS_API_KEY"}'
```

**Expected response:**
```json
{
  "secretValue": "sk_...",
  "secretName": "ELEVENLABS_API_KEY"
}
```

## Quick Checklist

- [ ] Worker code pasted and deployed
- [ ] Secrets added (`ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`)
- [ ] Worker URL copied
- [ ] Extension configured with Worker URL
- [ ] Test curl command works
- [ ] Extension reloaded

## Troubleshooting

**405 Error?**
- Make sure you clicked "Save and deploy" (not just "Save")
- Check Worker code matches exactly
- Verify Worker is active in dashboard

**404 Error?**
- Check Worker URL has no trailing slash
- Verify endpoint is `/get-secret` (not `/get-secrets`)

**Secret not found?**
- Check secret names match exactly (case-sensitive)
- Verify secrets are set in Worker Settings → Variables → Secrets

