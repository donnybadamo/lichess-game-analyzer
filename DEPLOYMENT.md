# Deployment Guide - Secure Setup

This guide explains how to safely deploy the extension without exposing secrets.

## ✅ What's Already Secure

- ✅ `.env` file is gitignored (won't be committed)
- ✅ Secrets stored in Azure Key Vault
- ✅ No hardcoded API keys in code
- ✅ Credentials loaded dynamically

## 📋 Deployment Checklist

### 1. **Never Commit Secrets**

These files are already in `.gitignore`:
- `.env`
- `secrets.json`
- `*.key`

**DO NOT** commit:
- API keys
- Agent IDs
- Azure credentials
- Any secrets

### 2. **For Personal Use**

Store credentials in Chrome storage (one-time setup):

```javascript
// Run in browser console (F12) on analysis page
chrome.storage.local.set({
  elevenlabsApiKey: 'your_api_key',
  elevenlabsAgentId: 'your_agent_id',
  azureProxyUrl: 'https://your-function.azurewebsites.net/api/get-secret'
});
```

### 3. **For Public Deployment (Chrome Web Store)**

**Option A: Use Azure Key Vault (Recommended)**

1. Deploy Azure Function with Key Vault integration
2. Users set their own `azureProxyUrl` in Chrome storage
3. Each user manages their own Key Vault secrets

**Option B: User-Provided Credentials**

1. Add a settings page in the extension
2. Users enter their own ElevenLabs API key
3. Store only in Chrome storage (local to their browser)

### 4. **Create Setup Instructions**

Create a `SETUP.md` file with:

```markdown
# Setup Instructions

1. Install the extension
2. Get your ElevenLabs API key from https://elevenlabs.io
3. Open extension options/settings
4. Enter your API key
5. (Optional) Enter your Agent ID for custom voice
```

## 🔐 Security Best Practices

### ✅ DO:
- Store secrets in Azure Key Vault
- Use Chrome storage for user credentials
- Load credentials dynamically
- Use environment variables for Azure Function
- Document setup process

### ❌ DON'T:
- Commit `.env` files
- Hardcode API keys
- Store secrets in code
- Share credentials publicly
- Commit Azure Function credentials

## 📁 File Structure

```
lichess-analyzer-extension/
├── .env                    # ❌ Gitignored - local secrets
├── .env.example            # ✅ Template - safe to commit
├── azure-keyvault.js       # ✅ Safe - no secrets
├── elevenlabs-tts.js       # ✅ Safe - loads from storage
├── manifest.json           # ✅ Safe - no secrets
└── DEPLOYMENT.md           # ✅ This file
```

## 🚀 Deployment Steps

### Step 1: Prepare Repository

```bash
# Make sure .env is gitignored
git check-ignore .env

# Verify no secrets in code
grep -r "sk_" --exclude-dir=node_modules .
grep -r "agent_" --exclude-dir=node_modules .
```

### Step 2: Create .env.example

```bash
# Create template (safe to commit)
cat > .env.example << 'EOF'
# ElevenLabs API Configuration
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here
ELEVENLABS_VOICE_ID=your_voice_id_here
EOF
```

### Step 3: Deploy Azure Function

1. Deploy `azure-function-proxy.js` to Azure Functions
2. Set environment variables in Function App:
   - `KEY_VAULT_URL`
   - `AZURE_TENANT_ID`
   - `AZURE_CLIENT_ID`
   - `AZURE_CLIENT_SECRET`
3. Keep these secret - never commit

### Step 4: Package Extension

```bash
# Create zip for Chrome Web Store
zip -r lichess-analyzer.zip . \
  -x "*.git*" \
  -x "*.env*" \
  -x "node_modules/*" \
  -x "*.md" \
  -x ".DS_Store"
```

### Step 5: Chrome Web Store

1. Upload zip file
2. Fill out store listing
3. Add setup instructions
4. Mention users need their own ElevenLabs API key

## 🔍 Verify Security

Before deploying, check:

```bash
# No secrets in code
grep -r "sk_" . --exclude-dir=.git --exclude-dir=node_modules
grep -r "agent_" . --exclude-dir=.git --exclude-dir=node_modules

# .env is ignored
git status | grep .env

# No hardcoded credentials
grep -r "elevenlabsApiKey.*=" . --exclude-dir=.git
```

## 📝 For Users

Users need to:

1. Install extension
2. Get ElevenLabs API key (free tier available)
3. Set credentials in Chrome storage OR use Azure Key Vault
4. (Optional) Create custom agent for personalized voice

See `SETUP.md` for detailed user instructions.

