# Where to Put Each Secret - Step by Step

## Two Different Places!

There are **TWO separate places** to store secrets:

1. **Azure Key Vault** (stores your ElevenLabs credentials)
2. **Cloudflare Worker** (stores Azure connection info)

---

## Part 1: Azure Key Vault Secrets

**Location:** Azure Portal → Key Vaults → `chessVault`

**Purpose:** Store your ElevenLabs API keys/IDs

**Secrets to add:**

### 1. ElevenLabs API Key
- **Secret Name:** `elevenlabs-api-key`
- **Secret Value:** Your actual ElevenLabs API key (starts with `sk_`)
- **How to add:**
  ```bash
  az keyvault secret set \
    --vault-name chessVault \
    --name "elevenlabs-api-key" \
    --value "sk_YOUR_ACTUAL_API_KEY_HERE"
  ```

### 2. ElevenLabs Agent ID
- **Secret Name:** `elevenlabs-agent-id`
- **Secret Value:** `agent_1201kd44fpr5ehethh3qchq0hj0a` ← **YOUR VALUE**
- **How to add:**
  ```bash
  az keyvault secret set \
    --vault-name chessVault \
    --name "elevenlabs-agent-id" \
    --value "agent_1201kd44fpr5ehethh3qchq0hj0a"
  ```

### 3. ElevenLabs Voice ID (Optional)
- **Secret Name:** `elevenlabs-voice-id`
- **Secret Value:** Your voice ID (if you want to override agent voice)
- **How to add:**
  ```bash
  az keyvault secret set \
    --vault-name chessVault \
    --name "elevenlabs-voice-id" \
    --value "YOUR_VOICE_ID"
  ```

---

## Part 2: Cloudflare Worker Secrets

**Location:** Cloudflare Dashboard → Your Worker → Settings → Variables → Secrets

**Purpose:** Store Azure connection info (so Worker can access Key Vault)

**Secrets to add:**

### 1. KEY_VAULT_URL
- **Variable Name:** `KEY_VAULT_URL`
- **Value:** `https://chessvault.vault.azure.net` ← **YOUR VALUE** (remove trailing slash!)
- **How to add:**
  - Cloudflare Dashboard → Your Worker → Settings → Variables
  - Click "Add variable" → "Secret"
  - Name: `KEY_VAULT_URL`
  - Value: `https://chessvault.vault.azure.net`
  - Click "Save"

### 2. AZURE_TENANT_ID
- **Variable Name:** `AZURE_TENANT_ID`
- **Value:** Your Azure tenant ID (GUID format)
- **Where to find:** Azure Portal → Azure Active Directory → Properties → Tenant ID
- **Example:** `b4482ccf-ca31-4d59-a65f-aecdbee42aaa`

### 3. AZURE_CLIENT_ID
- **Variable Name:** `AZURE_CLIENT_ID`
- **Value:** Your Service Principal client ID (GUID format)
- **Where to find:** Azure Portal → App registrations → Your app → Application (client) ID
- **Example:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 4. AZURE_CLIENT_SECRET
- **Variable Name:** `AZURE_CLIENT_SECRET`
- **Value:** Your Service Principal secret value
- **Where to find:** Azure Portal → App registrations → Certificates & secrets → Create new secret → Copy VALUE
- **Example:** `abc123~XYZ456~def789~GHI012~jkl345`

---

## Visual Guide

```
┌─────────────────────────────────────┐
│   AZURE KEY VAULT                   │
│   (chessvault.vault.azure.net)      │
├─────────────────────────────────────┤
│ Secret Name: elevenlabs-api-key     │
│ Value: sk_...                       │
│                                     │
│ Secret Name: elevenlabs-agent-id   │
│ Value: agent_1201kd44fpr5...       │ ← YOUR VALUE
│                                     │
│ Secret Name: elevenlabs-voice-id   │
│ Value: (optional)                  │
└─────────────────────────────────────┘
              ↑
              │ Worker fetches from here
              │
┌─────────────┴─────────────────────┐
│   CLOUDFLARE WORKER               │
│   (Settings → Variables → Secrets)│
├───────────────────────────────────┤
│ KEY_VAULT_URL                     │
│ = https://chessvault.vault...    │ ← YOUR VALUE
│                                     │
│ AZURE_TENANT_ID                   │
│ = b4482ccf-ca31-4d59...          │
│                                     │
│ AZURE_CLIENT_ID                   │
│ = a1b2c3d4-e5f6-7890...          │
│                                     │
│ AZURE_CLIENT_SECRET               │
│ = abc123~XYZ456~...              │
└───────────────────────────────────┘
```

---

## Step-by-Step Checklist

### ✅ Step 1: Add Secrets to Azure Key Vault

```bash
# 1. API Key
az keyvault secret set \
  --vault-name chessVault \
  --name "elevenlabs-api-key" \
  --value "sk_YOUR_ELEVENLABS_API_KEY"

# 2. Agent ID (YOUR VALUE)
az keyvault secret set \
  --vault-name chessVault \
  --name "elevenlabs-agent-id" \
  --value "agent_1201kd44fpr5ehethh3qchq0hj0a"

# 3. Voice ID (optional)
az keyvault secret set \
  --vault-name chessVault \
  --name "elevenlabs-voice-id" \
  --value "YOUR_VOICE_ID"
```

### ✅ Step 2: Add Secrets to Cloudflare Worker

1. Go to: https://dash.cloudflare.com/
2. Workers & Pages → Your Worker → **Settings** → **Variables**
3. Click **"Add variable"** → **"Secret"**
4. Add these 4 secrets one by one:

   **Secret 1:**
   - Name: `KEY_VAULT_URL`
   - Value: `https://chessvault.vault.azure.net`

   **Secret 2:**
   - Name: `AZURE_TENANT_ID`
   - Value: (your tenant ID from Azure)

   **Secret 3:**
   - Name: `AZURE_CLIENT_ID`
   - Value: (your client ID from Azure)

   **Secret 4:**
   - Name: `AZURE_CLIENT_SECRET`
   - Value: (your client secret from Azure)

---

## Summary

**Azure Key Vault** = Stores your ElevenLabs credentials
- `elevenlabs-api-key` → Your ElevenLabs API key
- `elevenlabs-agent-id` → `agent_1201kd44fpr5ehethh3qchq0hj0a` ← **YOUR VALUE**
- `elevenlabs-voice-id` → (optional)

**Cloudflare Worker** = Stores Azure connection info
- `KEY_VAULT_URL` → `https://chessvault.vault.azure.net` ← **YOUR VALUE**
- `AZURE_TENANT_ID` → (from Azure AD)
- `AZURE_CLIENT_ID` → (from Service Principal)
- `AZURE_CLIENT_SECRET` → (from Service Principal)

---

## Quick Test

After setting everything up, test if Worker can access Key Vault:

```javascript
// In Chrome Console
fetch('https://your-worker.workers.dev/get-secret', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secretName: 'elevenlabs-agent-id' })
})
.then(r => r.json())
.then(data => {
  console.log('Should return:', 'agent_1201kd44fpr5ehethh3qchq0hj0a');
  console.log('Actually returned:', data.secretValue);
});
```

