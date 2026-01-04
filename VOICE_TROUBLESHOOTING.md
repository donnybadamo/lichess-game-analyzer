# Voice Troubleshooting Guide

## Quick Diagnosis

1. **Open the analysis page** (after analyzing a game)
2. **Open Browser Console** (F12 → Console tab)
3. **Look for these messages:**
   - `✅ Loaded ElevenLabs credentials from Cloudflare Worker` - Good!
   - `❌ ElevenLabs API key not set!` - Problem!
   - `⚠️ Cloudflare Worker URL not configured` - Problem!

## Step-by-Step Troubleshooting

### Step 1: Check Cloudflare Worker URL

Run in console:
```javascript
chrome.storage.local.get(['cloudflareWorkerUrl'], (result) => {
  console.log('Worker URL:', result.cloudflareWorkerUrl || '❌ NOT SET');
});
```

**If not set:**
```javascript
chrome.storage.local.set({
  cloudflareWorkerUrl: 'https://your-worker.workers.dev'
});
```

### Step 2: Check Credentials in Storage

Run in console:
```javascript
chrome.storage.local.get(['elevenlabsApiKey', 'elevenlabsAgentId'], (result) => {
  console.log('API Key:', result.elevenlabsApiKey ? '✅ Set' : '❌ Missing');
  console.log('Agent ID:', result.elevenlabsAgentId || '❌ Missing');
});
```

**If missing, manually load from Cloudflare:**
```javascript
// This should happen automatically, but you can force it:
if (typeof window.loadElevenLabsCredentials === 'function') {
  window.loadElevenLabsCredentials().then(success => {
    console.log('Load result:', success ? '✅ Success' : '❌ Failed');
  });
}
```

### Step 3: Test Voice Function

Run in console:
```javascript
if (typeof window.speakWithElevenLabs === 'function') {
  window.speakWithElevenLabs('Testing voice system').then(result => {
    console.log('Voice test:', result ? '✅ Worked' : '❌ Failed');
  });
} else {
  console.error('❌ speakWithElevenLabs function not loaded');
}
```

### Step 4: Check Cloudflare Worker Secrets

1. Go to Cloudflare Dashboard → Workers & Pages
2. Click your worker
3. Go to **Settings** → **Variables and Secrets** → **Secrets**
4. Verify these exist:
   - `ELEVENLABS_API_KEY` ✅
   - `ELEVENLABS_AGENT_ID` ✅
   - `ELEVENLABS_VOICE_ID` (optional)

### Step 5: Test Worker Directly

Run in console:
```javascript
const workerUrl = 'https://your-worker.workers.dev'; // Replace with your URL
fetch(`${workerUrl}/get-secret`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secretName: 'ELEVENLABS_AGENT_ID' })
})
.then(r => r.json())
.then(data => {
  console.log('Worker response:', data);
  if (data.secretValue) {
    console.log('✅ Worker is working! Agent ID:', data.secretValue);
  } else {
    console.error('❌ Worker returned no secret');
  }
});
```

## Common Issues

### Issue 1: "Cloudflare Worker URL not configured"
**Solution:** Set the Worker URL in Chrome storage (see Step 1 above)

### Issue 2: "No API key found in Cloudflare Worker"
**Solution:** 
1. Check Worker secrets are set (Step 4)
2. Verify Worker is deployed
3. Check Worker URL is correct

### Issue 3: "speakWithElevenLabs function not available"
**Solution:**
1. Reload the extension
2. Check that `elevenlabs-tts.js` is loading (check console for errors)
3. Verify `load-libs.js` is loading it correctly

### Issue 4: "API key missing convai_read permission"
**Solution:**
1. Go to https://elevenlabs.io/app/settings/api-keys
2. Find your API key
3. Enable "Conversational AI Read" permission
4. Update the key in Cloudflare Worker secret

### Issue 5: Voice plays but sounds wrong
**Solution:**
- Check that Agent ID is correct
- Verify the agent exists in your ElevenLabs account
- Check console for voice ID being used

## Automated Troubleshooting

Run this in the console to get a full diagnostic:

```javascript
// Note: The debug-voice-troubleshoot.js file has been removed. Use the steps below instead:
// Or load it:
const script = document.createElement('script');
// Run the checks below directly in the browser console instead
document.head.appendChild(script);
```

## Manual Credential Setup (Fallback)

If Cloudflare Worker isn't working, you can set credentials manually:

```javascript
chrome.storage.local.set({
  elevenlabsApiKey: 'sk_your_api_key_here',
  elevenlabsAgentId: 'agent_1201kd44fpr5ehethh3qchq0hj0a',
  // Optional:
  // elevenlabsVoiceId: 'your_voice_id_here'
}, () => {
  console.log('✅ Credentials set manually');
  // Reload the page or extension
});
```

## Browser TTS Fallback

If ElevenLabs fails, the extension falls back to browser TTS. Check:
- Voice toggle is ON (🔊 button)
- Browser supports SpeechSynthesis
- No errors in console

## Still Not Working?

1. **Check console for errors** - Look for red error messages
2. **Verify extension is reloaded** - Go to `chrome://extensions` and click reload
3. **Check network tab** - See if requests to ElevenLabs API are being made
4. **Test in incognito** - Rule out extension conflicts

