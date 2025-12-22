# Google Cloud TTS Setup (Masculine Voice)

## Quick Setup

1. **Get Google Cloud API Key:**
   - Go to https://console.cloud.google.com/
   - Create a project (or use existing)
   - Enable "Cloud Text-to-Speech API"
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy the API key

2. **Add API Key to Extension:**
   - Open extension popup (click extension icon)
   - Paste API key in the field (or add manually via console)
   - Or run in console: `chrome.storage.local.set({googleTTSApiKey: 'YOUR_KEY_HERE'})`

3. **Reload Extension:**
   - Go to `chrome://extensions/`
   - Click reload on the extension
   - The voice will now use Google TTS with masculine voice!

## Voice Details

- **Voice**: `en-US-Wavenet-D` (masculine, natural-sounding)
- **Cost**: ~$0.004 per game analysis (very cheap)
- **Quality**: ⭐⭐⭐⭐⭐ Excellent, human-like

## Fallback

If no API key is set, it automatically falls back to Web Speech API (built-in browser voice).

## Safety

✅ **Safe** - Only sends chess commentary text to Google, no personal data.

