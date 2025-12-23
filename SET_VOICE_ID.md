# How to Set Your Custom Voice ID

If the agent voice isn't working or you want to use a different voice:

## Option 1: Set Voice ID Manually (OVERRIDES Agent)

Open Chrome console (`F12` → Console tab) and run:

```javascript
chrome.storage.local.set({
  elevenlabsVoiceId: "YOUR_VOICE_ID_HERE"
});
```

**To find your voice ID:**
1. Go to ElevenLabs dashboard: https://elevenlabs.io/app/voices
2. Click on your voice
3. Copy the Voice ID from the URL or voice settings

**Example:**
```javascript
chrome.storage.local.set({
  elevenlabsVoiceId: "21m00Tcm4TlvDq8ikWAM"  // Rachel voice
});
```

## Option 2: Check What Voice ID Your Agent Uses

Run this in the console to see what voice ID your agent is configured with:

```javascript
(async () => {
  const storage = await chrome.storage.local.get(['elevenlabsApiKey', 'elevenlabsAgentId']);
  const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${storage.elevenlabsAgentId}`, {
    headers: { 'xi-api-key': storage.elevenlabsApiKey }
  });
  const data = await response.json();
  console.log('Agent data:', data);
  console.log('Voice ID:', data.voice_id || data.voice?.voice_id || data.agent?.voice_id);
})();
```

## Option 3: Use Debug Script

Copy and paste `debug-voice-issue.js` into the console to see what's happening.

## Priority Order:

1. **Manual `elevenlabsVoiceId`** (if set) ← **OVERRIDES EVERYTHING**
2. Agent's voice ID (from API)
3. Agent ID as voice ID (fallback)
4. Default voice

## To Remove Manual Override:

```javascript
chrome.storage.local.remove('elevenlabsVoiceId');
```

This will make it use the agent's voice ID again.

