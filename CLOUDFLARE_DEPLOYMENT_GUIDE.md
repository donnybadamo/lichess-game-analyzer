# Cloudflare Deployment Guide

Complete guide for deploying the Lichess Game Analyzer extension components to Cloudflare.

## Overview

This extension uses Cloudflare Workers to securely store and serve ElevenLabs API credentials. The Worker acts as a proxy that the extension calls to retrieve secrets.

**Architecture:**
```
Chrome Extension → Cloudflare Worker → Returns Secrets → Extension uses ElevenLabs API
```

---

## Prerequisites

1. **Cloudflare Account** (free tier works)
2. **Cloudflare Workers** enabled on your account
3. **ElevenLabs API Key** (starts with `sk_`)
4. **ElevenLabs Agent ID** (optional, format: `agent_...`)
5. **ElevenLabs Voice ID** (optional, if you want to override agent voice)

---

## Step 1: Deploy Cloudflare Worker

### Option A: Using Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Log in to your account

2. **Navigate to Workers**
   - Click **"Workers & Pages"** in the sidebar
   - Click **"Create application"**
   - Click **"Create Worker"**

3. **Configure Worker**
   - **Name:** `lichess-secrets-proxy` (or your choice)
   - **HTTP handler:** Leave default
   - Click **"Deploy"**

4. **Add Worker Code**
   - In the Worker editor, delete the default code
   - Copy the entire contents of `cloudflare-worker-keyvault.js`
   - Paste into the editor
   - Click **"Save and deploy"**

5. **Add Secrets**
   - In the Worker page, go to **"Settings"** → **"Variables"**
   - Scroll to **"Environment Variables"** → **"Secrets"**
   - Click **"Add secret"** for each:
     
     **Secret 1:**
     - **Name:** `ELEVENLABS_API_KEY`
     - **Value:** Your ElevenLabs API key (e.g., `sk_dbbac21a4dd5ed7f06da1bf260221b0bcfb5d17bba0637d7`)
     - Click **"Encrypt"**
     
     **Secret 2:**
     - **Name:** `ELEVENLABS_AGENT_ID`
     - **Value:** Your agent ID (e.g., `agent_1201kd44fpr5ehethh3qchq0hj0a`)
     - Click **"Encrypt"**
     
     **Secret 3 (Optional):**
     - **Name:** `ELEVENLABS_VOICE_ID`
     - **Value:** Your voice ID (if you want to override agent voice)
     - Click **"Encrypt"**

6. **Get Worker URL**
   - After deploying, you'll see your Worker URL
   - Format: `https://lichess-secrets-proxy.YOUR_SUBDOMAIN.workers.dev`
   - **Copy this URL** - you'll need it for the extension

### Option B: Using Wrangler CLI

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
   wrangler deploy cloudflare-worker-keyvault.js --name lichess-secrets-proxy
   ```

4. **Set Secrets**
   ```bash
   # Set API Key
   wrangler secret put ELEVENLABS_API_KEY
   # Paste your API key when prompted
   
   # Set Agent ID
   wrangler secret put ELEVENLABS_AGENT_ID
   # Paste your agent ID when prompted
   
   # Set Voice ID (optional)
   wrangler secret put ELEVENLABS_VOICE_ID
   # Paste your voice ID when prompted
   ```

5. **Get Worker URL**
   - After deployment, Wrangler will show your Worker URL
   - Format: `https://lichess-secrets-proxy.YOUR_SUBDOMAIN.workers.dev`

---

## Step 2: Configure Chrome Extension

1. **Open Chrome Extension**
   - Go to `chrome://extensions/`
   - Find "Lichess Game Analyzer"
   - Click **"Inspect views: service worker"** (or open DevTools)

2. **Set Worker URL**
   - In the Console tab, run:
   ```javascript
   chrome.storage.local.set({
     cloudflareWorkerUrl: 'https://lichess-secrets-proxy.YOUR_SUBDOMAIN.workers.dev'
   });
   ```
   - Replace `YOUR_SUBDOMAIN` with your actual subdomain

3. **Reload Extension**
   - Go back to `chrome://extensions/`
   - Click the reload icon on the extension

4. **Test Configuration**
   - Open the extension's analysis page
   - Open DevTools Console (F12)
   - You should see: `✅ Loaded ElevenLabs credentials from Cloudflare Worker`

---

## Step 3: Test the Setup

### Test Worker Directly

Open your browser and test the Worker endpoint:

```bash
curl -X POST https://lichess-secrets-proxy.YOUR_SUBDOMAIN.workers.dev/get-secret \
  -H "Content-Type: application/json" \
  -d '{"secretName": "ELEVENLABS_API_KEY"}'
```

Expected response:
```json
{
  "secretValue": "sk_...",
  "secretName": "ELEVENLABS_API_KEY"
}
```

### Test in Extension

1. **Open Lichess game analysis page**
2. **Open DevTools Console** (F12)
3. **Check logs:**
   - Should see: `🔐 Loading ElevenLabs credentials from Cloudflare Worker...`
   - Should see: `✅ Loaded ElevenLabs credentials from Cloudflare Worker`
   - Should see: `🎙️ Using ElevenLabs Agent: agent_...`
   - Should see: `🎯 FINAL VOICE ID BEING USED: ...`

---

## Troubleshooting

### Worker Returns 404

**Problem:** Worker endpoint not found

**Solution:**
- Make sure Worker code includes `/get-secret` endpoint handler
- Check Worker URL is correct (no trailing slash)
- Verify Worker is deployed and active

### Worker Returns "Secret not found"

**Problem:** Secret name doesn't match

**Solution:**
- Check secret names in Worker match exactly:
  - `ELEVENLABS_API_KEY`
  - `ELEVENLABS_AGENT_ID`
  - `ELEVENLABS_VOICE_ID`
- Secret names are case-sensitive

### Extension Can't Connect to Worker

**Problem:** CORS or network error

**Solution:**
- Check Worker CORS headers are set correctly
- Verify `manifest.json` includes `https://*.workers.dev/*` in `host_permissions`
- Check browser console for specific error messages

### Voice Still Not Working

**Problem:** Extension loads credentials but voice doesn't work

**Solution:**
1. Check ElevenLabs API key is valid
2. Verify agent ID is correct
3. If agent API fails, set `elevenlabsVoiceId` manually:
   ```javascript
   chrome.storage.local.set({
     elevenlabsVoiceId: 'YOUR_VOICE_ID'
   });
   ```
4. Get voice ID from: https://elevenlabs.io/app/voices

---

## Security Best Practices

1. **Never commit secrets to Git**
   - Secrets are stored in Cloudflare Worker, not in code
   - `.env` files are gitignored

2. **Use Cloudflare Workers Secrets**
   - Secrets are encrypted at rest
   - Only accessible via Worker code
   - Never exposed in logs or responses

3. **Limit Worker Access**
   - Worker only returns secrets, doesn't expose them publicly
   - Consider adding authentication if needed

4. **Rotate Secrets Regularly**
   - Update secrets in Cloudflare Worker
   - Extension will automatically fetch new values

---

## Custom Domain (Optional)

If you want to use a custom domain (e.g., `api.donnybadamo.com`):

1. **Add Custom Domain in Cloudflare**
   - Go to Worker → **"Settings"** → **"Triggers"**
   - Click **"Add Custom Domain"**
   - Enter your domain (e.g., `api.donnybadamo.com`)

2. **Update DNS**
   - Cloudflare will provide DNS instructions
   - Usually: Add CNAME record pointing to Worker

3. **Update Extension**
   - Update `cloudflareWorkerUrl` in Chrome storage:
   ```javascript
   chrome.storage.local.set({
     cloudflareWorkerUrl: 'https://api.donnybadamo.com'
   });
   ```

---

## Quick Reference

### Worker Secrets Required:
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `ELEVENLABS_AGENT_ID` - Your agent ID (optional)
- `ELEVENLABS_VOICE_ID` - Your voice ID (optional)

### Extension Configuration:
```javascript
chrome.storage.local.set({
  cloudflareWorkerUrl: 'https://your-worker.workers.dev'
});
```

### Worker File:
- `cloudflare-worker-keyvault.js` (despite the name, it uses Cloudflare secrets, not Azure)

### Test Endpoint:
```bash
curl -X POST https://your-worker.workers.dev/get-secret \
  -H "Content-Type: application/json" \
  -d '{"secretName": "ELEVENLABS_API_KEY"}'
```

---

## Next Steps

1. ✅ Deploy Worker to Cloudflare
2. ✅ Add secrets to Worker
3. ✅ Configure extension with Worker URL
4. ✅ Test voice narration
5. ✅ (Optional) Set up custom domain

---

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify Worker is deployed and accessible
3. Test Worker endpoint directly with curl
4. Check secret names match exactly
5. Verify API key format (should start with `sk_`)

