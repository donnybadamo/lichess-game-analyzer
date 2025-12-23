# Cloudflare Troubleshooting Guide

## Worker Failed

### Common Issues:

**1. Worker Code Syntax Error**
- Check the Worker code in Cloudflare dashboard
- Make sure `cloudflare-worker-keyvault.js` is copied correctly
- Look for JavaScript syntax errors

**2. Missing Secrets**
The Worker needs these secrets set:
- `KEY_VAULT_URL` (e.g., `https://chessvault.vault.azure.net`)
- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`

**To set secrets:**
1. Go to Cloudflare Dashboard → Workers & Pages
2. Click your Worker
3. Go to **Settings** → **Variables**
4. Click **Add variable** → **Secret**
5. Add each secret one by one

**3. Worker Not Deployed**
- Make sure you clicked **"Save and Deploy"**
- Check deployment status in dashboard

**4. Wrong File Name**
- Worker file should be named exactly: `cloudflare-worker-keyvault.js`
- Or update `wrangler.toml` to match your file name

---

## Pages Failed

### Common Issues:

**1. Build Command Failed**
Error: `npm error Missing script: "build:cloudflare"`

**Fix:**
- Make sure `package.json` has the build script
- Check that `cloudflare-pages-build.js` exists
- Verify files are committed to GitHub

**2. Build Output Directory Not Found**
Error: `Build output directory "cloudflare-dist" not found`

**Fix:**
- The build script should create `cloudflare-dist/`
- Check build logs to see if script ran
- Make sure Node.js is available in build environment

**3. Missing Files**
Error: Files not found during build

**Fix:**
- Make sure all files are committed to GitHub
- Check that `libs/` directory exists
- Verify `analysis.html`, `analysis.css`, etc. are in repo

**4. GitHub Connection Issues**
- Reconnect GitHub repo
- Check repository permissions
- Verify branch name matches (usually `main`)

---

## Quick Fixes

### For Worker:

**Option 1: Deploy via Dashboard**
1. Go to: https://dash.cloudflare.com/
2. Workers & Pages → Your Worker
3. Click **"Edit code"**
4. Copy/paste code from `cloudflare-worker-keyvault.js`
5. Click **"Save and deploy"**
6. Add secrets in Settings → Variables

**Option 2: Deploy via Wrangler CLI**
```bash
npm install -g wrangler
wrangler login
cd /path/to/extension
wrangler deploy cloudflare-worker-keyvault.js --name lichess-keyvault-proxy
wrangler secret put KEY_VAULT_URL
wrangler secret put AZURE_TENANT_ID
wrangler secret put AZURE_CLIENT_ID
wrangler secret put AZURE_CLIENT_SECRET
```

### For Pages:

**Option 1: Manual Upload**
1. Run build locally:
   ```bash
   npm install
   npm run build:cloudflare
   ```
2. Go to Cloudflare Pages dashboard
3. Upload `cloudflare-dist/` folder manually

**Option 2: Fix GitHub Build**
1. Make sure `package.json` has:
   ```json
   {
     "scripts": {
       "build:cloudflare": "node cloudflare-pages-build.js"
     }
   }
   ```
2. Commit and push to GitHub
3. Cloudflare will auto-rebuild

**Option 3: Use No Build Step**
- Build command: `echo "No build"`
- Build output: `.` (root directory)
- Manually update files to use relative paths

---

## Testing

### Test Worker:
```bash
curl -X POST https://your-worker.workers.dev/get-secret \
  -H "Content-Type: application/json" \
  -d '{"secretName": "elevenlabs-api-key"}'
```

### Test Pages:
- Visit your Pages URL
- Check browser console for errors
- Verify files load correctly

---

## Still Not Working?

1. **Check Cloudflare Dashboard Logs**
   - Worker: Settings → Logs
   - Pages: Deployments → View logs

2. **Verify Secrets**
   - Worker secrets are set correctly
   - Azure Key Vault secrets exist

3. **Check File Paths**
   - Worker file name matches
   - Pages files are in correct directory

4. **Contact Support**
   - Cloudflare support if infrastructure issue
   - Check Cloudflare status page

