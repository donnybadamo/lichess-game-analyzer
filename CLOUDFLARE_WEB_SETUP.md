# Cloudflare Setup via Web Dashboard

## Step-by-Step Guide

## Part 1: Create Cloudflare Worker (Key Vault Proxy)

### Step 1: Go to Cloudflare Dashboard
1. Visit: https://dash.cloudflare.com/
2. Login to your account
3. Select your account/domain

### Step 2: Create Worker
1. In left sidebar, click **"Workers & Pages"**
2. Click **"Create application"**
3. Click **"Create Worker"** tab
4. Click **"Deploy"** (or use the editor)

### Step 3: Configure Worker
1. **Worker name:** `lichess-keyvault-proxy`
2. Click **"Deploy"**
3. After deployment, click **"Edit code"**

### Step 4: Add Worker Code
1. Replace the default code with content from `cloudflare-worker-keyvault.js`
2. Click **"Save and deploy"**

### Step 5: Add Secrets
1. Go to Worker settings (gear icon)
2. Click **"Variables"** tab
3. Click **"Add variable"** → **"Secret"**
4. Add these secrets one by one:
   - `KEY_VAULT_URL` = `https://chessvault.vault.azure.net/`
   - `AZURE_TENANT_ID` = `b4482ccf-ca31-4d59-a65f-aecdbee42aaa`
   - `AZURE_CLIENT_ID` = (your client ID)
   - `AZURE_CLIENT_SECRET` = (your client secret)
5. Click **"Save"** after each

### Step 6: Get Worker URL
1. In Worker overview, find **"Preview"** section
2. Copy the URL: `https://lichess-keyvault-proxy.YOUR_SUBDOMAIN.workers.dev`
3. This is your `azureProxyUrl`

---

## Part 2: Create Cloudflare Pages (Analysis Page)

### Step 1: Prepare Files
1. Create a folder on your computer with these files:
   ```
   cloudflare-pages/
   ├── analysis.html
   ├── analysis.js
   ├── analysis.css
   ├── init.js
   ├── load-libs.js
   ├── elevenlabs-tts.js
   ├── azure-keyvault.js
   └── libs/
       ├── jquery.min.js
       ├── chess-esm.js
       ├── chessboard.min.js
       ├── chessboard.css
       ├── stockfish.js
       └── pieces/
           └── (all PNG files)
   ```

### Step 2: Create Pages Project
1. In Cloudflare Dashboard → **"Workers & Pages"**
2. Click **"Create application"**
3. Click **"Pages"** tab
4. Click **"Upload assets"** (or connect to Git)
5. **Project name:** `lichess-analyzer`
6. Drag and drop your `cloudflare-pages` folder
7. Click **"Deploy site"**

### Step 3: Get Pages URL
1. After deployment, you'll see: `https://lichess-analyzer.pages.dev`
2. Your analysis page will be at: `https://lichess-analyzer.pages.dev/analysis.html`

---

## Part 3: Update Extension

### Update manifest.json
Add Cloudflare domains to permissions:

```json
"host_permissions": [
  "https://lichess.org/*",
  "https://*.workers.dev/*",
  "https://*.pages.dev/*",
  "https://api.elevenlabs.io/*"
]
```

### Update CSP in manifest.json
```json
"content_security_policy": {
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; style-src 'self' 'unsafe-inline'; default-src 'self'; connect-src 'self' https://api.elevenlabs.io https://*.workers.dev https://*.pages.dev"
}
```

### Update background.js or content.js
Change from:
```javascript
const url = chrome.runtime.getURL('analysis.html');
```

To:
```javascript
const url = 'https://lichess-analyzer.pages.dev/analysis.html';
```

---

## Part 4: Configure ElevenLabs

1. Go to: https://elevenlabs.io/app/settings/api-keys
2. Find your API key settings
3. Add allowed host: `lichess-analyzer.pages.dev`
4. Or add: `*.pages.dev` (allows all Pages domains)

---

## Part 5: Set Worker URL in Extension

Run in browser console:
```javascript
chrome.storage.local.set({
  azureProxyUrl: 'https://lichess-keyvault-proxy.YOUR_SUBDOMAIN.workers.dev/get-secret'
}, () => console.log('✅ Worker URL saved!'));
```

---

## Quick Links

- **Cloudflare Dashboard:** https://dash.cloudflare.com/
- **Workers:** https://dash.cloudflare.com/YOUR_ACCOUNT/workers
- **Pages:** https://dash.cloudflare.com/YOUR_ACCOUNT/pages
- **ElevenLabs Settings:** https://elevenlabs.io/app/settings/api-keys

---

## Troubleshooting

**Worker not working?**
- Check Worker logs: Dashboard → Worker → Logs
- Verify secrets are set correctly
- Test endpoint: `curl -X POST https://your-worker.workers.dev/get-secret -d '{"secretName":"test"}'`

**Pages not loading?**
- Check deployment status
- Verify files are in root folder
- Check browser console for errors

**CORS errors?**
- Worker code includes CORS headers
- Make sure `Access-Control-Allow-Origin: *` is in response headers

