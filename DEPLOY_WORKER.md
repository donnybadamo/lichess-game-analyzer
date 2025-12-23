# Deploy Cloudflare Worker - Step by Step

## Option 1: Via Cloudflare Dashboard (EASIEST - Recommended)

1. **Go to:** https://dash.cloudflare.com/
2. **Click:** Workers & Pages → Create application → Create Worker
3. **Name:** `lichess-keyvault-proxy`
4. **Copy code:**
   - Open `cloudflare-worker-keyvault.js`
   - Copy ALL the code
   - Paste into Worker editor
5. **Click:** "Save and deploy"
6. **Add secrets:**
   - Go to Settings → Variables
   - Add these 4 secrets:
     - `KEY_VAULT_URL`
     - `AZURE_TENANT_ID`
     - `AZURE_CLIENT_ID`
     - `AZURE_CLIENT_SECRET`
7. **Done!** Copy the Worker URL

---

## Option 2: Via Wrangler CLI

### Step 1: Install Wrangler
```bash
npm install -g wrangler
```

### Step 2: Login
```bash
wrangler login
```

### Step 3: Deploy Worker
```bash
cd /Users/donnybadamo/Documents/lichess/lichess-analyzer-extension
wrangler deploy cloudflare-worker-keyvault.js --name lichess-keyvault-proxy
```

**Important:** Use `--name` flag, don't rely on `wrangler.toml` if it's causing issues.

### Step 4: Add Secrets
```bash
wrangler secret put KEY_VAULT_URL
# Paste: https://chessvault.vault.azure.net

wrangler secret put AZURE_TENANT_ID
# Paste your tenant ID

wrangler secret put AZURE_CLIENT_ID
# Paste your client ID

wrangler secret put AZURE_CLIENT_SECRET
# Paste your client secret
```

### Step 5: Verify
```bash
wrangler deployments list
```

---

## Option 3: Fix Wrangler Config

If you're getting the "assets directory" error, make sure:

1. **wrangler.toml should NOT have `assets` section**
   - Workers are single files, not directories
   - Only Pages use assets directories

2. **Deploy with explicit file:**
   ```bash
   wrangler deploy cloudflare-worker-keyvault.js --name lichess-keyvault-proxy
   ```

3. **Or use minimal wrangler.toml:**
   ```toml
   name = "lichess-keyvault-proxy"
   main = "cloudflare-worker-keyvault.js"
   compatibility_date = "2024-12-01"
   ```

---

## Troubleshooting

**Error: "assets directory"**
- You're deploying a Worker, not Pages
- Use `wrangler deploy cloudflare-worker-keyvault.js` (single file)
- Don't use `--assets` flag

**Error: "Module not found"**
- Make sure `cloudflare-worker-keyvault.js` exists
- Use full path if needed: `wrangler deploy ./cloudflare-worker-keyvault.js`

**Error: "Authentication failed"**
- Run `wrangler login` again
- Check you're logged into correct Cloudflare account

**Error: "Secret not found"**
- Secrets must be set AFTER deployment
- Use `wrangler secret put KEY_NAME` for each secret

---

## Recommended: Use Dashboard

The **Cloudflare Dashboard** is the easiest way:
- No CLI setup needed
- Visual interface
- Easy secret management
- See logs immediately

Just copy/paste the code and add secrets!

