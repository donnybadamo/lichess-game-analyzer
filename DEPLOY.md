# Cloudflare Pages Deployment Instructions

## Quick Deploy

Deploy the contents of `cloudflare-dist/` folder to Cloudflare Pages:

### Option 1: Using Wrangler CLI
```bash
# Install wrangler if not already installed
npm install -g wrangler

# Deploy to Cloudflare Pages
wrangler pages deploy cloudflare-dist --project-name=chess-donnybadamo
```

### Option 2: Using Cloudflare Dashboard
1. Go to your Cloudflare Pages dashboard
2. Select your chess project
3. Go to "Deployments" tab
4. Click "Create deployment"
5. Upload the contents of the `cloudflare-dist/` folder
6. Wait for deployment to complete (~2 minutes)

### Option 3: Git Push (if connected to repo)
```bash
# Commit the cloudflare-dist folder
git add cloudflare-dist/
git commit -m "Update deployment with fixes"
git push

# Cloudflare Pages will auto-deploy if connected to your repo
```

## Verify Deployment

After deployment, check the browser console:
- Old message: `cloudflare-secrets-web.js:60 ✅ Loaded ElevenLabs credentials from Cloudflare Worker`
- **New message**: `cloudflare-secrets-web.js:70 ✅ Loaded ElevenLabs credentials: API_KEY`

## What Was Fixed

1. **Stockfish ERR_BLOCKED_BY_CLIENT** - `_headers` file prevents asset optimization
2. **Better secret error messages** - Shows which secrets loaded/missing
3. **No Chrome extension dependencies** - All web files use localStorage

## Configure Worker Secrets (Optional)

If you want to use ElevenLabs TTS instead of browser voice:
```bash
wrangler secret put ELEVENLABS_API_KEY --env production
wrangler secret put ELEVENLABS_AGENT_ID --env production
wrangler secret put ELEVENLABS_VOICE_ID --env production
```
