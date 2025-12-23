# How to Get Your ElevenLabs Voice ID

## The Problem

Your agent ID (`agent_1201kd44fpr5ehethh3qchq0hj0a`) cannot be used directly as a voice ID. You need to get the actual voice ID from ElevenLabs.

## Solution: Get Voice ID from ElevenLabs Dashboard

### Option 1: From ElevenLabs Dashboard (Easiest)

1. **Go to ElevenLabs Dashboard**
   - Visit: https://elevenlabs.io/app/voices
   - Log in to your account

2. **Find Your Voice**
   - Look for the voice you created for your agent
   - Click on the voice to open its details

3. **Copy Voice ID**
   - The Voice ID is shown in the URL or in the voice details
   - Format: Usually a long string like `21m00Tcm4TlvDq8ikWAM` or similar
   - Copy this ID

4. **Set in Chrome Storage**
   ```javascript
   chrome.storage.local.set({
     elevenlabsVoiceId: 'YOUR_VOICE_ID_HERE'
   });
   ```

### Option 2: Using ElevenLabs API

If you have API access, you can fetch all voices:

```javascript
// Run this in browser console (on any page)
fetch('https://api.elevenlabs.io/v1/voices', {
  headers: {
    'xi-api-key': 'YOUR_API_KEY_HERE'
  }
})
.then(r => r.json())
.then(data => {
  console.log('All voices:', data.voices);
  // Find your voice in the list
  // Look for voice_id field
});
```

### Option 3: Check Agent Details (If API Permissions Work)

If your API key had `convai_read` permission, you could fetch the agent's voice ID. But since it doesn't, use Option 1 or 2.

---

## Quick Fix: Set Voice ID Now

1. **Get your voice ID** from https://elevenlabs.io/app/voices

2. **Set it in Chrome storage:**
   ```javascript
   chrome.storage.local.set({
     elevenlabsVoiceId: 'YOUR_VOICE_ID'
   });
   ```

3. **Reload the extension** and try again

---

## Why This Happens

- **Agent ID** (`agent_...`) is for Conversational AI Agents
- **Voice ID** is a different identifier for the actual voice model
- The extension needs the Voice ID to make TTS calls
- Agent API requires special permissions that your API key doesn't have

---

## Alternative: Use a Default Voice

If you can't find your voice ID, you can use one of ElevenLabs' default voices:

```javascript
chrome.storage.local.set({
  elevenlabsVoiceId: 'pNInz6obpgDQGcFmaJgB' // Default voice
});
```

But ideally, get your custom voice ID from the dashboard!

