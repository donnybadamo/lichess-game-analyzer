# Cloudflare Deployment Guide

Complete guide for deploying the Lichess Game Analyzer extension components to Cloudflare.

## Overview

This extension uses Cloudflare Workers to securely store and serve ElevenLabs API credentials. The Worker acts as a proxy between the extension and your secrets, keeping them secure.

---

## Prerequisites

- Cloudflare account (free tier works)
- ElevenLabs API key
- ElevenLabs Agent ID (optional, if using Conversational AI)
- ElevenLabs Voice ID (optional, for manual override)

---

## Step 1: Deploy Cloudflare Worker

### Option A: Via Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Log in to your account

2. **Create a New Worker**
   - Click **Workers & Pages** in the sidebar
   - Click **Create application**
   - Click **Create Worker**
   - Name it: `lichess-keyvault-proxy` (or any name you prefer)
   - Click **Deploy**

3. **Edit Worker Code**
   - Click **Edit code** (or the Worker name)
   - Delete the default code
   - Copy the code from `cloudflare-worker-simple.js`
   - Paste it into the editor
   - Click **Save and deploy**

4. **Add Secrets**
   - In the Worker editor, go to **Settings** → **Variables**
   - Scroll to **Environment Variables** → **Secrets**
   - Click **Add secret** for each:
     
     **Secret 1: ELEVENLABS_API_KEY**
     - Name: `ELEVENLABS_API_KEY`
     - Value: Your ElevenLabs API key (starts with `sk_`)
     - Click **Encrypt**
     
     **Secret 2: ELEVENLABS_AGENT_ID**
     - Name: `ELEVENLABS_AGENT_ID`
     - Value: `agent_1201kd44fpr5ehethh3qchq0hj0a` (your agent ID)
     - Click **Encrypt**
     
     **Secret 3: ELEVENLABS_VOICE_ID** (Optional)
     - Name: `ELEVENLABS_VOICE_ID`
     - Value: Your voice ID (if you want to override)
     - Click **Encrypt**

5. **Get Worker URL**
   - After deploying, note your Worker URL
   - Format: `https://your-worker-name.workers.dev`
   - Example: `https://lichess-keyvault-proxy.workers.dev`

### Option B: Via Wrangler CLI

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Deploy Worker**
   ```bash
   cd /path/to/lichess-analyzer-extension
   wrangler deploy cloudflare-worker-simple.js --name lichess-keyvault-proxy
   ```

4. **Add Secrets**
   ```bash
   wrangler secret put ELEVENLABS_API_KEY
   # Paste your API key when prompted
   
   wrangler secret put ELEVENLABS_AGENT_ID
   # Paste your agent ID when prompted
   
   wrangler secret put ELEVENLABS_VOICE_ID
   # Paste your voice ID when prompted (optional)
   ```

---

## Step 2: Configure Extension

1. **Open Chrome Extension**
   - Go to `chrome://extensions/`
   - Enable **Developer mode**
   - Find **Lichess Game Analyzer**
   - Click **Inspect views: service worker** (or right-click → Inspect)

2. **Set Worker URL**
   - Open the Console tab
   - Run this command (replace with your Worker URL):
   ```javascript
   chrome.storage.local.set({
     cloudflareWorkerUrl: 'https://your-worker-name.workers.dev'
   });
   ```

3. **Verify Configuration**
   ```javascript
   chrome.storage.local.get(['cloudflareWorkerUrl'], (result) => {
     console.log('Worker URL:', result.cloudflareWorkerUrl);
   });
   ```

4. **Test Secret Fetching**
   ```javascript
   // This should automatically load credentials from Cloudflare Worker
   // Check the console for success messages
   ```

---

## Step 3: Test the Extension

1. **Reload Extension**
   - Go to `chrome://extensions/`
   - Click the reload icon on your extension

2. **Visit a Lichess Game**
   - Go to: https://lichess.org
   - Navigate to a finished game
   - Click **🔍 Analyze Game** button

3. **Check Console**
   - Open DevTools (F12)
   - Look for:
     - `✅ Loaded ElevenLabs credentials from Cloudflare Worker`
     - `✅ Fetched "elevenlabs-api-key" from Cloudflare Worker`
     - `🎙️ Using ElevenLabs Agent: agent_...`

4. **Verify Voice**
   - The analysis should start automatically
   - You should hear the ElevenLabs voice (not robotic)
   - Check console for voice ID being used

---

## Troubleshooting

### Worker Returns 404

**Problem:** `❌ Worker error for elevenlabs-api-key: 404`

**Solution:**
- Make sure Worker is deployed
- Check Worker URL is correct
- Verify Worker code includes `/get-secret` endpoint

### Worker Returns 500

**Problem:** `❌ Worker error: 500`

**Solution:**
- Check Worker logs in Cloudflare Dashboard
- Verify secrets are set correctly
- Check secret names match exactly (case-sensitive)

### Credentials Not Loading

**Problem:** `⚠️ No API key found in Cloudflare Worker`

**Solution:**
1. Verify Worker URL is set:
   ```javascript
   chrome.storage.local.get(['cloudflareWorkerUrl'], console.log);
   ```
2. Test Worker directly:
   ```javascript
   fetch('https://your-worker.workers.dev/get-secret', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ secretName: 'elevenlabs-api-key' })
   }).then(r => r.json()).then(console.log);
   ```
3. Check Worker logs in Cloudflare Dashboard

### Wrong Voice Being Used

**Problem:** Extension uses wrong voice, not your agent's voice

**Solution:**
1. Check if agent voice ID is being fetched:
   ```javascript
   chrome.storage.local.get(['elevenlabsAgentId', 'elevenlabsVoiceId'], console.log);
   ```
2. If agent API fails (401), set voice ID manually:
   ```javascript
   chrome.storage.local.set({
     elevenlabsVoiceId: 'YOUR_VOICE_ID_HERE'
   });
   ```
3. Get voice ID from: https://elevenlabs.io/app/voices

---

## Custom Domain (Optional)

If you want to use a custom domain like `api.donnybadamo.com`:

1. **Add Custom Domain in Cloudflare**
   - Go to Worker → **Triggers** → **Custom Domains**
   - Click **Add Custom Domain**
   - Enter: `api.donnybadamo.com` (or your domain)
   - Cloudflare will configure DNS automatically

2. **Update Extension**
   ```javascript
   chrome.storage.local.set({
     cloudflareWorkerUrl: 'https://api.donnybadamo.com'
   });
   ```

---

## Security Best Practices

✅ **Do:**
- Keep secrets encrypted in Cloudflare (they're automatically encrypted)
- Use HTTPS only (Cloudflare enforces this)
- Regularly rotate API keys
- Monitor Worker usage in Cloudflare Dashboard

❌ **Don't:**
- Commit secrets to Git
- Share Worker URLs publicly
- Use Worker URL in public code
- Hardcode API keys in extension code

---

## Worker Code Reference

The Worker code (`cloudflare-worker-simple.js`) handles:
- CORS preflight requests
- Secret name mapping (supports multiple naming conventions)
- Error handling
- Secure secret retrieval

**Supported Secret Names:**
- `elevenlabs-api-key`, `elevenlabsApiKey`, `ELEVENLABS_API_KEY`
- `elevenlabs-agent-id`, `elevenlabsAgentId`, `ELEVENLABS_AGENT_ID`
- `elevenlabs-voice-id`, `elevenlabsVoiceId`, `ELEVENLABS_VOICE_ID`

---

## Next Steps

After deployment:
1. ✅ Test the extension on a Lichess game
2. ✅ Verify voice is working correctly
3. ✅ Monitor Cloudflare Worker usage
4. ✅ Set up custom domain (optional)

---

## Support

If you encounter issues:
1. Check browser console (F12)
2. Check Cloudflare Worker logs
3. Verify all secrets are set correctly
4. Test Worker endpoint directly

For more details, see:
- `SIMPLE_CLOUDFLARE_SETUP.md` - Quick setup guide
- `CODE_REVIEW.md` - Code architecture overview
