# Extension Setup - Quick Start

## Step 1: Set Worker URL

Open your extension's analysis page, then open browser console (F12) and run:

```javascript
chrome.storage.local.set({
  cloudflareWorkerUrl: 'https://YOUR_WORKER_URL.workers.dev'
});
```

**Replace `YOUR_WORKER_URL` with your actual Worker URL** (no trailing slash!)

## Step 2: Reload Extension

1. Go to `chrome://extensions/`
2. Find your extension
3. Click the **reload icon** 🔄

## Step 3: Test It

1. Open the extension's analysis page
2. Open DevTools Console (F12)
3. Look for these messages:

**✅ Success messages:**
```
🔐 Loading ElevenLabs credentials from Cloudflare Worker...
✅ Loaded ElevenLabs credentials from Cloudflare Worker
   API Key: sk_...
   Agent ID: agent_...
```

**❌ Error messages to watch for:**
```
⚠️ Cloudflare Worker URL not configured
⚠️ No API key found in Cloudflare Worker
❌ Worker error for ELEVENLABS_API_KEY: 401
```

## Step 4: Verify Credentials Loaded

Run this in console to check:

```javascript
chrome.storage.local.get(['elevenlabsApiKey', 'elevenlabsAgentId', 'cloudflareWorkerUrl'], (result) => {
  console.log('Worker URL:', result.cloudflareWorkerUrl);
  console.log('API Key:', result.elevenlabsApiKey ? result.elevenlabsApiKey.substring(0, 15) + '...' : 'NOT SET');
  console.log('Agent ID:', result.elevenlabsAgentId || 'NOT SET');
});
```

## Troubleshooting

### Worker URL Not Set
```javascript
// Check current value
chrome.storage.local.get(['cloudflareWorkerUrl'], console.log);

// Set it
chrome.storage.local.set({
  cloudflareWorkerUrl: 'https://your-worker.workers.dev'
});
```

### Credentials Not Loading
1. Check Worker URL is correct
2. Verify secrets are set in Cloudflare Worker
3. Test Worker directly:
   ```bash
   curl -X POST https://your-worker.workers.dev/get-secret \
     -H "Content-Type: application/json" \
     -d '{"secretName": "ELEVENLABS_API_KEY"}'
   ```

### Manual Credential Override (if Worker fails)
```javascript
chrome.storage.local.set({
  elevenlabsApiKey: 'sk_YOUR_API_KEY',
  elevenlabsAgentId: 'agent_YOUR_AGENT_ID'
});
```

## Quick Test Script

Run this in console to test everything:

```javascript
async function testExtension() {
  console.log('🧪 Testing Extension Setup...\n');
  
  // Check Worker URL
  const storage = await chrome.storage.local.get(['cloudflareWorkerUrl', 'elevenlabsApiKey', 'elevenlabsAgentId']);
  
  console.log('1. Worker URL:', storage.cloudflareWorkerUrl || '❌ NOT SET');
  console.log('2. API Key:', storage.elevenlabsApiKey ? '✅ SET (' + storage.elevenlabsApiKey.substring(0, 15) + '...)' : '❌ NOT SET');
  console.log('3. Agent ID:', storage.elevenlabsAgentId || '❌ NOT SET');
  
  // Test Worker if URL is set
  if (storage.cloudflareWorkerUrl) {
    console.log('\n4. Testing Worker...');
    try {
      const response = await fetch(`${storage.cloudflareWorkerUrl}/get-secret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretName: 'ELEVENLABS_API_KEY' })
      });
      console.log('   Status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Worker is working!');
      } else {
        console.log('   ❌ Worker error:', await response.text());
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
  }
  
  console.log('\n✅ Test complete!');
}

testExtension();
```

## Next Steps

Once credentials are loaded:
1. Open a chess game on Lichess
2. Click the extension icon
3. The extension should automatically load and analyze
4. Voice narration should work if ElevenLabs is configured correctly

