# Cloudflare Worker Deployment Guide

This guide will help you deploy the secrets Worker for your chess analyzer web app.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com) if you don't have one
2. **Wrangler CLI**: Already installed at `/opt/homebrew/bin/wrangler`

## Step 1: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate with Cloudflare.

## Step 2: Deploy the Worker

From the project directory:

```bash
cd /Users/donnybadamo/Documents/lichess/lichess-analyzer-extension
wrangler deploy
```

This will deploy the Worker named `chess-analyzer-secrets` based on `wrangler.toml`.

After deployment, you'll get a URL like:
```
https://chess-analyzer-secrets.YOUR_SUBDOMAIN.workers.dev
```

**⚠️ Save this URL!** You'll need it for the next step.

## Step 3: Add Secrets to the Worker

Add your API keys as encrypted secrets:

### Required: ElevenLabs API Key

```bash
wrangler secret put ELEVENLABS_API_KEY
```

When prompted, paste your ElevenLabs API key (starts with `sk_`).

### Optional: ElevenLabs Agent ID

```bash
wrangler secret put ELEVENLABS_AGENT_ID
```

Paste your ElevenLabs Agent ID when prompted.

### Optional: ElevenLabs Voice ID

```bash
wrangler secret put ELEVENLABS_VOICE_ID
```

Paste your ElevenLabs Voice ID when prompted (if you have one directly).

### Optional: Google TTS API Key

```bash
wrangler secret put GOOGLE_TTS_API_KEY
```

Paste your Google Cloud TTS API key when prompted.

## Step 4: Update Worker URL in Web App

After deployment, update `cloudflare-secrets-web.js` with your Worker URL:

```javascript
const CLOUDFLARE_WORKER_URL = 'https://chess-analyzer-secrets.YOUR_SUBDOMAIN.workers.dev';
```

Replace `YOUR_SUBDOMAIN` with your actual subdomain from Step 2.

## Step 5: Verify Secrets

Check that secrets are set:

```bash
wrangler secret list
```

You should see your secrets listed (values are hidden for security).

## Step 6: Test the Worker

Test that the Worker is working:

```bash
curl -X POST https://chess-analyzer-secrets.YOUR_SUBDOMAIN.workers.dev/get-secret \
  -H "Content-Type: application/json" \
  -d '{"secretName": "ELEVENLABS_API_KEY"}'
```

You should get a JSON response with `secretValue` (the actual key will be returned if the secret is set).

## Troubleshooting

### "Authentication required"

Run `wrangler login` again.

### "Worker not found"

Make sure you're in the correct directory with `wrangler.toml` and `cloudflare-worker-simple.js`.

### "Secret not found" error

1. Check that you've added the secret: `wrangler secret list`
2. Make sure the secret name matches exactly (case-sensitive): `ELEVENLABS_API_KEY`

### CORS errors in browser

The Worker already includes CORS headers. If you see CORS errors:
1. Make sure you're using the correct Worker URL
2. Check that the request is a POST request
3. Verify the endpoint is `/get-secret`

## Next Steps

After deployment:
1. Update `cloudflare-secrets-web.js` with your Worker URL
2. Commit and push the change
3. Cloudflare Pages will auto-deploy
4. Test on your website at `chess.donnybadamo.com`

## Security Notes

- ✅ Secrets are encrypted at rest in Cloudflare
- ✅ Secrets are only accessible via the Worker (not exposed in code)
- ✅ Worker requires POST requests (GET won't work)
- ✅ CORS is enabled for your website
- ⚠️ Keep your Worker URL private (don't commit it if it's sensitive)



