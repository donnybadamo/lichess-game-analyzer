# 🚨 Fix Voice Issue Now

## The Problem

Your extension is trying to use the agent ID (`agent_1201kd44fpr5ehethh3qchq0hj0a`) as a voice ID, but they're different things. You need the actual **Voice ID** from ElevenLabs.

## Quick Fix (2 minutes)

### Step 1: Get Your Voice ID

**Option A: From ElevenLabs Dashboard** (Easiest)
1. Go to: https://elevenlabs.io/app/voices
2. Find your voice (the one you created for your agent)
3. Click on it to see details
4. Copy the **Voice ID** (it's in the URL or voice details)

**Option B: Use the Helper Script**
1. Open Chrome DevTools Console (F12)
2. Open `fetch-voices.js` and copy the entire script
3. Paste it in the console
4. It will show all your voices with their IDs

### Step 2: Set the Voice ID

**In Chrome Storage:**
```javascript
chrome.storage.local.set({
  elevenlabsVoiceId: 'YOUR_VOICE_ID_HERE'
});
```

**Or in Cloudflare Worker:**
1. Go to Worker → Settings → Variables → Secrets
2. Add secret:
   - Name: `ELEVENLABS_VOICE_ID`
   - Value: Your voice ID

### Step 3: Reload Extension

1. Go to `chrome://extensions/`
2. Click reload on the extension
3. Try analyzing a game again

---

## Why This Happens

- **Agent ID** (`agent_...`) = For Conversational AI Agents (different API)
- **Voice ID** = The actual voice model identifier (what TTS needs)
- Your API key doesn't have permission to fetch agent details
- So the extension can't automatically get the voice ID from the agent

---

## Verify It Works

After setting the voice ID, check the console:
- Should see: `🎤 Using manual voice ID: YOUR_VOICE_ID`
- Should see: `🎯 FINAL VOICE ID BEING USED: YOUR_VOICE_ID`
- Should NOT see: `404 voice_not_found` error

---

## Still Having Issues?

1. **Check API Key Format**
   - Should start with `sk_`
   - If not, check Cloudflare Worker secret

2. **Verify Voice ID**
   - Must be a valid ElevenLabs voice ID
   - Can test with: `fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': 'YOUR_KEY' } })`

3. **Check Console Errors**
   - Look for specific error messages
   - Most common: 404 (voice not found) or 401 (invalid API key)
