# Fix 405 Error - Cloudflare Worker

## Understanding the 405 Error

A **405 Method Not Allowed** error means:
- The Worker received a request with the wrong HTTP method
- OR the Worker isn't handling the route correctly
- OR the Worker isn't deployed properly

## Quick Fix Steps

### Step 1: Verify Your Worker Code

Make sure your Worker code matches this exactly:

```javascript
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
        'ELEVENLABS_API_KEY': env.ELEVENLABS_API_KEY,
        'elevenlabs-api-key': env.ELEVENLABS_API_KEY,
        'elevenlabsApiKey': env.ELEVENLABS_API_KEY,
        'ELEVENLABS_AGENT_ID': env.ELEVENLABS_AGENT_ID,
        'elevenlabs-agent-id': env.ELEVENLABS_AGENT_ID,
        'elevenlabsAgentId': env.ELEVENLABS_AGENT_ID,
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

### Step 2: Redeploy the Worker

**Option A: Via Cloudflare Dashboard (Recommended)**

1. Go to https://dash.cloudflare.com/
2. Click **"Workers & Pages"** → Your Worker
3. Click **"Edit code"**
4. **Delete all existing code**
5. **Copy and paste** the code from Step 1 above
6. Click **"Save and deploy"** (important!)
7. Wait for deployment to complete

**Option B: Via Wrangler CLI**

```bash
# Make sure you're in the extension directory
cd /Users/donnybadamo/Documents/lichess/lichess-analyzer-extension

# Deploy the Worker
wrangler deploy cloudflare-worker-keyvault.js --name YOUR_WORKER_NAME

# If you get an error about the name, check your existing Worker name in dashboard
```

### Step 3: Verify Secrets Are Set

1. In Cloudflare Dashboard → Your Worker → **Settings** → **Variables**
2. Scroll to **"Environment Variables"** → **"Secrets"**
3. Verify these secrets exist:
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_AGENT_ID` (optional)
   - `ELEVENLABS_VOICE_ID` (optional)

If missing, click **"Add secret"** and add them.

### Step 4: Test the Worker Directly

Open your terminal and test:

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

**If you still get 405:**
- Check the Worker URL is correct (no trailing slash)
- Make sure you're using POST (not GET)
- Check Cloudflare Dashboard → Worker → Logs for errors

### Step 5: Check Extension Configuration

In your browser console (on the extension page), verify:

```javascript
// Check current Worker URL
chrome.storage.local.get(['cloudflareWorkerUrl'], (result) => {
  console.log('Current Worker URL:', result.cloudflareWorkerUrl);
});

// If wrong, set it:
chrome.storage.local.set({
  cloudflareWorkerUrl: 'https://YOUR_WORKER.workers.dev'
});
```

**Important:** No trailing slash on the URL!

## Common Causes of 405 Error

### 1. Worker Not Deployed
- **Fix:** Make sure you clicked "Save and deploy" in dashboard
- **Check:** Go to Worker → Deployments tab, verify latest deployment is active

### 2. Wrong Export Format
- **Fix:** Use `export default { async fetch(request, env) {...} }`
- **Not:** `addEventListener('fetch', ...)` (old format)

### 3. Route Path Mismatch
- **Fix:** Extension calls `/get-secret`, Worker must handle `/get-secret`
- **Check:** Worker code has `if (url.pathname !== '/get-secret')`

### 4. CORS Preflight Issue
- **Fix:** Worker handles OPTIONS requests (already in code above)
- **Check:** Extension makes POST request with Content-Type header

### 5. Worker Using Old Code
- **Fix:** Delete all code in Worker editor, paste fresh code, deploy
- **Check:** Cloudflare Dashboard → Worker → Edit code → Verify code matches

## Debugging Steps

### Check Worker Logs
1. Go to Cloudflare Dashboard → Your Worker
2. Click **"Logs"** tab
3. Make a test request from extension
4. Check logs for errors

### Test with curl
```bash
# Test POST request
curl -X POST https://YOUR_WORKER.workers.dev/get-secret \
  -H "Content-Type: application/json" \
  -d '{"secretName": "ELEVENLABS_API_KEY"}' \
  -v
```

The `-v` flag shows detailed request/response info.

### Check Browser Network Tab
1. Open extension page
2. Open DevTools → Network tab
3. Trigger a request (reload page)
4. Find the request to `/get-secret`
5. Check:
   - Method: Should be POST
   - Status: Should be 200 (not 405)
   - Request URL: Should match your Worker URL

## Still Not Working?

### Alternative: Use Simple Worker

Try deploying `cloudflare-worker-simple.js` instead:

```bash
wrangler deploy cloudflare-worker-simple.js --name YOUR_WORKER_NAME
```

### Check Worker Status
- Go to Cloudflare Dashboard → Workers & Pages
- Verify Worker shows as "Active" (green)
- Check if there are any error messages

### Verify Worker URL
Make sure your Worker URL format is:
- ✅ `https://worker-name.account.workers.dev`
- ✅ `https://custom-domain.com`
- ❌ `https://worker-name.account.workers.dev/` (trailing slash)
- ❌ `http://worker-name.account.workers.dev` (should be https)

## Quick Test Script

Run this in browser console to test:

```javascript
async function testWorker() {
  const workerUrl = 'https://YOUR_WORKER.workers.dev'; // Replace!
  
  try {
    const response = await fetch(`${workerUrl}/get-secret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretName: 'ELEVENLABS_API_KEY' })
    });
    
    console.log('Status:', response.status);
    console.log('Response:', await response.text());
  } catch (error) {
    console.error('Error:', error);
  }
}

testWorker();
```

If this works but extension doesn't, the issue is in extension configuration, not Worker.

