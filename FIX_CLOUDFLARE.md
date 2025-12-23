# Quick Fix Guide - Cloudflare Worker & Pages

## Step 1: Fix Worker (Key Vault Proxy)

### Via Dashboard (Easiest):

1. **Go to Cloudflare Dashboard**
   - https://dash.cloudflare.com/
   - Workers & Pages → Create application → Create Worker

2. **Name it:** `lichess-keyvault-proxy`

3. **Copy Worker Code:**
   - Open `cloudflare-worker-keyvault.js`
   - Copy ALL the code
   - Paste into Worker editor
   - Click **"Save and deploy"**

4. **Add Secrets:**
   - Go to Worker → **Settings** → **Variables**
   - Click **"Add variable"** → **"Secret"**
   - Add these 4 secrets:
     - `KEY_VAULT_URL` = `https://chessvault.vault.azure.net`
     - `AZURE_TENANT_ID` = (your tenant ID)
     - `AZURE_CLIENT_ID` = (your client ID)
     - `AZURE_CLIENT_SECRET` = (your client secret)
   - Click **"Save"** after each

5. **Get Worker URL:**
   - In Worker overview, copy the URL
   - Looks like: `https://lichess-keyvault-proxy.YOUR_SUB.workers.dev`

---

## Step 2: Fix Pages (Analysis Page)

### Option A: Manual Upload (Fastest):

1. **Build locally:**
   ```bash
   cd /Users/donnybadamo/Documents/lichess/lichess-analyzer-extension
   npm install
   npm run build:cloudflare
   ```

2. **Upload to Cloudflare:**
   - Go to: https://dash.cloudflare.com/
   - Workers & Pages → Create application → Pages
   - Click **"Upload assets"**
   - Upload the entire `cloudflare-dist/` folder
   - Click **"Deploy site"**

### Option B: Fix GitHub Build:

1. **Check package.json exists:**
   ```bash
   cat package.json
   ```
   Should have `build:cloudflare` script

2. **Commit and push:**
   ```bash
   git add package.json cloudflare-pages-build.js
   git commit -m "Fix Cloudflare Pages build"
   git push
   ```

3. **In Cloudflare Pages:**
   - Connect to GitHub
   - Build command: `npm install && npm run build:cloudflare`
   - Build output: `cloudflare-dist`
   - Framework: `None`

### Option C: No Build Step (Simplest):

1. **In Cloudflare Pages settings:**
   - Build command: `echo "No build"`
   - Build output: `.` (dot)
   - Framework: `None`

2. **But then you need to manually update files:**
   - Replace `chrome.runtime.getURL()` with relative paths
   - This is more work but simpler setup

---

## Step 3: Set Worker URL in Extension

After Worker is deployed:

1. **Get Worker URL** from Cloudflare dashboard

2. **Set it in Chrome Console:**
   ```javascript
   chrome.storage.local.set({
     cloudflareWorkerUrl: 'https://your-worker.workers.dev'
   });
   ```

3. **Reload extension**

---

## Step 4: Test

### Test Worker:
```javascript
// In Chrome Console
fetch('https://your-worker.workers.dev/get-secret', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secretName: 'elevenlabs-api-key' })
}).then(r => r.json()).then(console.log);
```

### Test Pages:
- Visit your Pages URL
- Should see the analysis page
- Check console for errors

---

## Common Errors & Fixes

**Worker Error: "Module not found"**
- Make sure file name matches exactly
- Check `wrangler.toml` if using CLI

**Worker Error: "env.KEY_VAULT_URL is undefined"**
- Secrets not set
- Go to Settings → Variables → Add secrets

**Pages Error: "Build failed"**
- Check build logs
- Make sure `package.json` has build script
- Try manual upload instead

**Pages Error: "Files not found"**
- Check `cloudflare-dist/` was created
- Verify files are in GitHub repo
- Try manual upload

---

## Still Stuck?

1. **Check Cloudflare Logs:**
   - Worker: Settings → Logs
   - Pages: Deployments → Click deployment → View logs

2. **Verify:**
   - Worker code is correct
   - Secrets are set
   - GitHub repo is connected
   - Build script works locally

3. **Try Manual Upload:**
   - Build locally
   - Upload `cloudflare-dist/` folder
   - Simplest option

