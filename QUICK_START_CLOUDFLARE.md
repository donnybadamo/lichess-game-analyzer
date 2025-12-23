# Quick Start - Cloudflare Setup

## 🚀 5-Minute Setup

### Step 1: Deploy Worker (2 minutes)

1. Go to: https://dash.cloudflare.com → **Workers & Pages** → **Create Worker**
2. **Name:** `lichess-secrets-proxy`
3. **Paste code** from `cloudflare-worker-keyvault.js`
4. Click **"Save and deploy"**

### Step 2: Add Secrets (2 minutes)

1. In Worker → **Settings** → **Variables** → **Secrets**
2. Click **"Add secret"** for each:

   ```
   Name: ELEVENLABS_API_KEY
   Value: sk_dbbac21a4dd5ed7f06da1bf260221b0bcfb5d17bba0637d7
   ```

   ```
   Name: ELEVENLABS_AGENT_ID
   Value: agent_1201kd44fpr5ehethh3qchq0hj0a
   ```

   ```
   Name: ELEVENLABS_VOICE_ID (optional)
   Value: (your voice ID if you want to override)
   ```

### Step 3: Configure Extension (1 minute)

1. Copy your Worker URL: `https://lichess-secrets-proxy.YOUR_SUB.workers.dev`
2. Open Chrome DevTools Console (F12)
3. Run:
   ```javascript
   chrome.storage.local.set({
     cloudflareWorkerUrl: 'https://lichess-secrets-proxy.YOUR_SUB.workers.dev'
   });
   ```
4. Reload extension

### Step 4: Test ✅

1. Open a Lichess game analysis
2. Check console for: `✅ Loaded ElevenLabs credentials from Cloudflare Worker`
3. Voice should work!

---

## 🔧 Troubleshooting

**Worker not found?**
- Check Worker URL is correct (no trailing slash)
- Verify Worker is deployed and active

**Secrets not loading?**
- Check secret names match exactly: `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`
- Verify secrets are encrypted in Worker

**Voice not working?**
- Check console for errors
- Verify API key format (starts with `sk_`)
- Try setting voice ID manually:
  ```javascript
  chrome.storage.local.set({
    elevenlabsVoiceId: 'YOUR_VOICE_ID'
  });
  ```

---

## 📚 Full Guide

See `CLOUDFLARE_DEPLOYMENT_GUIDE.md` for detailed instructions.

