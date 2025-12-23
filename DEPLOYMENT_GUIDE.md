# Complete Deployment Guide - Cloudflare Worker & Pages

## Overview

This extension uses:
1. **Cloudflare Worker** - Stores ElevenLabs secrets securely
2. **Cloudflare Pages** - Hosts the analysis page (optional, for ElevenLabs host whitelisting)

---

## Part 1: Deploy Cloudflare Worker (Required)

### Step 1: Create Worker

1. Go to: https://dash.cloudflare.com/
2. Click **"Workers & Pages"** in sidebar
3. Click **"Create application"**
4. Click **"Create Worker"** tab
5. **Name:** `lichess-keyvault-proxy` (or your choice)
6. Click **"Deploy"** (or use Quick Edit)

### Step 2: Add Worker Code

1. Click **"Edit code"** (or use Quick Edit)
2. **Delete** the default code
3. **Copy** all code from `cloudflare-worker-simple.js`
4. **Paste** into the editor
5. Click **"Save and deploy"**

### Step 3: Add Secrets

1. Go to **Settings** → **Variables** tab
2. Click **"Add variable"** → **"Secret"**
3. Add these 3 secrets one by one:

   **Secret 1: ELEVENLABS_API_KEY**
   - Name: `ELEVENLABS_API_KEY`
   - Value: Your ElevenLabs API key (starts with `sk_`)
   - Click **"Save"**

   **Secret 2: ELEVENLABS_AGENT_ID**
   - Name: `ELEVENLABS_AGENT_ID`
   - Value: `agent_1201kd44fpr5ehethh3qchq0hj0a` (your agent ID)
   - Click **"Save"**

   **Secret 3: ELEVENLABS_VOICE_ID** (Optional)
   - Name: `ELEVENLABS_VOICE_ID`
   - Value: Your voice ID (if you want to override agent voice)
   - Click **"Save"**

### Step 4: Get Worker URL

1. In Worker overview page
2. Find **"Preview"** or **"Triggers"** section
3. Copy the URL: `https://lichess-keyvault-proxy.YOUR_SUB.workers.dev`
4. This is your Worker URL!

### Step 5: Test Worker

Open browser console and run:

```javascript
fetch('https://your-worker.workers.dev/get-secret', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secretName: 'elevenlabs-agent-id' })
})
.then(r => r.json())
.then(data => console.log('✅ Worker test:', data.secretValue));
```

Should return: `agent_1201kd44fpr5ehethh3qchq0hj0a`

---

## Part 2: Deploy Cloudflare Pages (Optional)

**Why?** ElevenLabs requires host whitelisting. If you host the analysis page on Cloudflare Pages, you can whitelist that domain.

### Option A: Manual Upload (Fastest)

1. **Build locally:**
   ```bash
   cd /path/to/lichess-analyzer-extension
   npm install
   npm run build:cloudflare
   ```

2. **Upload to Cloudflare:**
   - Go to: https://dash.cloudflare.com/
   - Workers & Pages → Create application → Pages
   - Click **"Upload assets"**
   - Upload entire `cloudflare-dist/` folder
   - Click **"Deploy site"**

3. **Get Pages URL:**
   - Copy URL: `https://your-project.pages.dev`

### Option B: GitHub Integration

1. **Connect GitHub:**
   - Cloudflare Pages → Create application → Pages
   - Click **"Connect to Git"**
   - Select your GitHub repo
   - Click **"Begin setup"**

2. **Build Settings:**
   - **Project name:** `lichess-analysis` (or your choice)
   - **Production branch:** `main`
   - **Framework preset:** `None`
   - **Build command:** `npm install && npm run build:cloudflare`
   - **Build output directory:** `cloudflare-dist`
   - **Root directory:** (leave empty)

3. **Deploy:**
   - Click **"Save and Deploy"**
   - Wait for build to complete
   - Copy Pages URL

### Option C: Custom Domain (Optional)

1. In Pages project → **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter: `chess.donnybadamo.com`
4. Follow DNS instructions
5. Add CNAME record:
   - **Name:** `chess`
   - **Target:** `your-project.pages.dev`
   - **Proxy:** ✅ (orange cloud)

---

## Part 3: Configure Extension

### Step 1: Set Worker URL

Open Chrome Console (`F12` → Console) and run:

```javascript
chrome.storage.local.set({
  cloudflareWorkerUrl: 'https://your-worker.workers.dev'
});
```

Replace with your actual Worker URL.

### Step 2: Reload Extension

1. Go to: `chrome://extensions/`
2. Find your extension
3. Click reload button 🔄

### Step 3: Test

1. Go to Lichess
2. Finish a game
3. Click "Analyze Game"
4. Check console for:
   ```
   ✅ Loaded ElevenLabs credentials from Cloudflare Worker
   ```

---

## Part 4: ElevenLabs Host Whitelisting (If Using Pages)

If you deployed Pages, add it to ElevenLabs:

1. Go to: https://elevenlabs.io/app/settings/api-keys
2. Find **"Allowed hosts"** section
3. Click **"Add host"**
4. Add your Pages URL:
   - `https://your-project.pages.dev`
   - Or: `https://chess.donnybadamo.com` (if using custom domain)
5. Click **"Save"**

---

## Troubleshooting

### Worker Issues

**Error: "Secret not found"**
- Check secret names match exactly: `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`
- Verify secrets are set in Worker Settings → Variables → Secrets

**Error: "CORS error"**
- Worker should handle CORS automatically
- Check Worker code has CORS headers

**Error: "404 Not found"**
- Make sure endpoint is `/get-secret`
- Check Worker URL is correct

### Pages Issues

**Error: "Build failed"**
- Check `package.json` has `build:cloudflare` script
- Verify `cloudflare-pages-build.js` exists
- Try manual upload instead

**Error: "Files not found"**
- Check `cloudflare-dist/` was created
- Verify files are in GitHub repo
- Try manual upload

### Extension Issues

**Error: "No API key found"**
- Check Worker URL is set: `chrome.storage.local.get(['cloudflareWorkerUrl'], console.log)`
- Verify Worker is deployed and accessible
- Check console for credential loading messages

**Error: "Voice not working"**
- Check credentials loaded: `chrome.storage.local.get(null, console.log)`
- Verify ElevenLabs API key is valid
- Check voice ID is set (if using manual override)

---

## Quick Checklist

### Worker Deployment
- [ ] Worker created and deployed
- [ ] Code from `cloudflare-worker-simple.js` pasted
- [ ] 3 secrets added (API_KEY, AGENT_ID, VOICE_ID)
- [ ] Worker URL copied
- [ ] Worker tested (returns secrets)

### Pages Deployment (Optional)
- [ ] Pages project created
- [ ] Build completed successfully
- [ ] Pages URL copied
- [ ] Custom domain set up (optional)
- [ ] Domain added to ElevenLabs allowed hosts

### Extension Configuration
- [ ] Worker URL set in Chrome storage
- [ ] Extension reloaded
- [ ] Credentials loading successfully
- [ ] Voice working
- [ ] Analysis page working

---

## Testing Commands

### Test Worker
```javascript
// In Chrome Console
fetch('https://your-worker.workers.dev/get-secret', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secretName: 'elevenlabs-api-key' })
})
.then(r => r.json())
.then(console.log);
```

### Test Extension Storage
```javascript
// Check Worker URL
chrome.storage.local.get(['cloudflareWorkerUrl'], console.log);

// Check loaded credentials
chrome.storage.local.get(['elevenlabsApiKey', 'elevenlabsAgentId', 'elevenlabsVoiceId'], console.log);
```

### Test Credential Loading
```javascript
// Manually trigger credential loading
window.loadElevenLabsCredentials().then(success => {
  console.log('Loading:', success ? '✅ Success' : '❌ Failed');
  chrome.storage.local.get(null, console.log);
});
```

---

## Support

If you encounter issues:
1. Check console logs for error messages
2. Verify Worker is accessible
3. Test Worker endpoint directly
4. Check secret names match exactly
5. Verify extension has correct permissions

See `CODE_REVIEW.md` for code details and `CLOUDFLARE_TROUBLESHOOTING.md` for more help.

