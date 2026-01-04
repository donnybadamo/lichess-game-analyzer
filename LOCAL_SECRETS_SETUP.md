# Local Secrets Setup Guide

The extension now uses **local Chrome storage** for ElevenLabs credentials by default. Cloudflare Worker is optional and only used if you configure it later.

## Quick Setup

### Option 1: Use secrets.js File (Recommended for Development)

1. Copy `secrets.js.example` to `secrets.js`:
   ```bash
   cp secrets.js.example secrets.js
   ```

2. Edit `secrets.js` and add your actual credentials:
   ```javascript
   const ELEVENLABS_SECRETS = {
     apiKey: 'sk_your_actual_api_key',
     agentId: 'your_actual_agent_id',  // Optional
     voiceId: 'your_actual_voice_id'   // Optional
   };
   ```

3. Reload the extension - secrets will be automatically loaded from the file!

**Note:** `secrets.js` is gitignored, so your secrets won't be committed.

### Option 2: Use the Extension Popup

1. Click the extension icon in your browser toolbar
2. Scroll down to "ElevenLabs Voice Settings"
3. Enter your **API Key** (required)
4. Optionally enter **Agent ID** and **Voice ID**
5. Click **"Save Credentials"**

### Option 3: Use Browser Console

Open the browser console (F12) and run:

```javascript
chrome.storage.local.set({
  elevenlabsApiKey: "sk_your_api_key_here",
  elevenlabsAgentId: "your_agent_id_here",  // Optional
  elevenlabsVoiceId: "your_voice_id_here"    // Optional
});
```

## Getting Your Credentials

### ElevenLabs API Key
1. Go to [elevenlabs.com](https://elevenlabs.com)
2. Sign in to your account
3. Go to your profile/settings
4. Find your API key (starts with `sk_`)
5. Copy it

### Agent ID (Optional)
- If you're using an ElevenLabs Agent, find the Agent ID in your ElevenLabs dashboard
- The extension will automatically fetch the voice ID from the agent

### Voice ID (Optional)
- If you want to use a specific voice instead of the agent's default
- Find voice IDs in the ElevenLabs voice library

## Verify Your Setup

1. Open the extension popup
2. Your saved credentials should be visible in the input fields
3. Try analyzing a game - if voice works, you're all set!

## Troubleshooting

### "API key not set" error
- Make sure you've saved the API key in the popup
- Check that the key starts with `sk_`
- Reload the extension after saving

### Voice not working
- Verify your API key is correct
- Check browser console (F12) for error messages
- Make sure you have API credits/quota available

### Want to use Cloudflare Worker later?
- Set `cloudflareWorkerUrl` in Chrome storage
- The extension will automatically try to load from Cloudflare first
- Falls back to local storage if Cloudflare is unavailable

## Security Note

Your credentials are stored locally in Chrome's storage. They are:
- ✅ Encrypted by Chrome
- ✅ Only accessible by this extension
- ✅ Not sent to any server (except ElevenLabs API)

For production deployments, consider using Cloudflare Worker secrets for better security.

