# Secret Examples - What Values to Use

## Cloudflare Worker Secrets

These go in Cloudflare Worker → Settings → Variables → Secrets:

### 1. KEY_VAULT_URL
**Example:**
```
https://chessvault.vault.azure.net
```

**How to get it:**
- Go to Azure Portal → Key Vaults
- Click your Key Vault (e.g., `chessVault`)
- Copy the "Vault URI" or "DNS Name"
- Format: `https://YOUR-VAULT-NAME.vault.azure.net`

**Full example:**
```
https://chessvault.vault.azure.net
```

---

### 2. AZURE_TENANT_ID
**Example:**
```
b4482ccf-ca31-4d59-a65f-aecdbee42aaa
```

**How to get it:**
- Azure Portal → Azure Active Directory
- Properties → Copy "Tenant ID"
- Format: GUID (e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

**Full example:**
```
b4482ccf-ca31-4d59-a65f-aecdbee42aaa
```

---

### 3. AZURE_CLIENT_ID
**Example:**
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**How to get it:**
- Azure Portal → Azure Active Directory → App registrations
- Click your app (Service Principal)
- Copy "Application (client) ID"
- Format: GUID

**Full example:**
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### 4. AZURE_CLIENT_SECRET
**Example:**
```
abc123~XYZ456~def789~GHI012~jkl345
```

**How to get it:**
- Azure Portal → Azure Active Directory → App registrations
- Click your app → Certificates & secrets
- Create new client secret (if you don't have one)
- Copy the "Value" (NOT the Secret ID)
- Format: Random string (save immediately, can't view again!)

**Full example:**
```
abc123~XYZ456~def789~GHI012~jkl345
```

⚠️ **Important:** If you lost the secret value, you need to create a new one!

---

## Azure Key Vault Secret Names

These are the secret names that should exist IN your Azure Key Vault:

### 1. ElevenLabs API Key
**Secret Name (try these in order):**
```
elevenlabs-api-key
```
or
```
elevenlabsApiKey
```
or
```
ELEVENLABS_API_KEY
```

**Secret Value Example:**
```
sk_dbbac21a4dd5ed7f06da1bf260221b0bcfb5d17bba0637d7
```

**How to set in Azure Key Vault:**
```bash
az keyvault secret set \
  --vault-name chessVault \
  --name "elevenlabs-api-key" \
  --value "sk_dbbac21a4dd5ed7f06da1bf260221b0bcfb5d17bba0637d7"
```

---

### 2. ElevenLabs Agent ID
**Secret Name:**
```
elevenlabs-agent-id
```
or
```
elevenlabsAgentId
```

**Secret Value Example:**
```
agent_1201kd44fpr5ehethh3qchq0hj0a
```

**How to set:**
```bash
az keyvault secret set \
  --vault-name chessVault \
  --name "elevenlabs-agent-id" \
  --value "agent_1201kd44fpr5ehethh3qchq0hj0a"
```

---

### 3. ElevenLabs Voice ID (Optional)
**Secret Name:**
```
elevenlabs-voice-id
```
or
```
elevenlabsVoiceId
```

**Secret Value Example:**
```
21m00Tcm4TlvDq8ikWAM
```

**How to set:**
```bash
az keyvault secret set \
  --vault-name chessVault \
  --name "elevenlabs-voice-id" \
  --value "21m00Tcm4TlvDq8ikWAM"
```

---

## Complete Setup Example

### Step 1: Set Secrets in Azure Key Vault
```bash
# API Key
az keyvault secret set \
  --vault-name chessVault \
  --name "elevenlabs-api-key" \
  --value "sk_YOUR_ACTUAL_API_KEY"

# Agent ID
az keyvault secret set \
  --vault-name chessVault \
  --name "elevenlabs-agent-id" \
  --value "agent_1201kd44fpr5ehethh3qchq0hj0a"

# Voice ID (optional)
az keyvault secret set \
  --vault-name chessVault \
  --name "elevenlabs-voice-id" \
  --value "YOUR_VOICE_ID"
```

### Step 2: Set Secrets in Cloudflare Worker
Go to Cloudflare Dashboard → Your Worker → Settings → Variables:

1. **KEY_VAULT_URL:**
   ```
   https://chessvault.vault.azure.net
   ```

2. **AZURE_TENANT_ID:**
   ```
   b4482ccf-ca31-4d59-a65f-aecdbee42aaa
   ```

3. **AZURE_CLIENT_ID:**
   ```
   a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

4. **AZURE_CLIENT_SECRET:**
   ```
   abc123~XYZ456~def789~GHI012~jkl345
   ```

---

## Where to Find Your Actual Values

### Azure Key Vault URL:
1. Azure Portal → Key Vaults
2. Click your vault
3. Copy "Vault URI"

### Tenant ID:
1. Azure Portal → Azure Active Directory
2. Properties → Tenant ID

### Client ID & Secret:
1. Azure Portal → Azure Active Directory → App registrations
2. Click your Service Principal app
3. Overview → Application (client) ID
4. Certificates & secrets → Create new secret → Copy value

### ElevenLabs Values:
1. **API Key:** https://elevenlabs.io/app/settings/api-keys
2. **Agent ID:** https://elevenlabs.io/app/convai → Click your agent → Copy ID
3. **Voice ID:** https://elevenlabs.io/app/voices → Click voice → Copy ID

---

## Quick Checklist

- [ ] Azure Key Vault created (`chessVault`)
- [ ] Service Principal created with Key Vault access
- [ ] Secrets added to Key Vault:
  - [ ] `elevenlabs-api-key`
  - [ ] `elevenlabs-agent-id` (optional)
  - [ ] `elevenlabs-voice-id` (optional)
- [ ] Cloudflare Worker deployed
- [ ] Worker secrets set:
  - [ ] `KEY_VAULT_URL`
  - [ ] `AZURE_TENANT_ID`
  - [ ] `AZURE_CLIENT_ID`
  - [ ] `AZURE_CLIENT_SECRET`
- [ ] Worker URL copied
- [ ] Worker URL set in Chrome extension storage

---

## Test It

After setting everything up, test the Worker:

```javascript
// In Chrome Console
fetch('https://your-worker.workers.dev/get-secret', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secretName: 'elevenlabs-api-key' })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Success!', data.secretValue ? 'Secret retrieved' : 'No secret');
});
```

