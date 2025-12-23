# Enable Agent API Access

## The Problem

Your ElevenLabs API key is missing the `convai_read` permission, which is required to fetch agent voice IDs.

## Solution: Enable convai_read Permission

### Step 1: Go to ElevenLabs API Settings

1. Visit: https://elevenlabs.io/app/settings/api-keys
2. Log in to your ElevenLabs account

### Step 2: Find Your API Key

1. Locate your API key in the list (the one starting with `sk_...`)
2. Click on it to view/edit permissions

### Step 3: Enable Conversational AI Read Permission

1. Look for **"Conversational AI Read"** or **"convai_read"** permission
2. **Enable** this permission
3. Save the changes

**Note:** If you don't see this option, you may need to:
- Upgrade your ElevenLabs plan (some permissions require higher tiers)
- Contact ElevenLabs support to enable it
- Create a new API key with the permission enabled

### Step 4: Update API Key in Cloudflare Worker

1. Go to Cloudflare Dashboard → Your Worker → Settings → Variables → Secrets
2. Update `ELEVENLABS_API_KEY` with the new/updated key
3. Save and redeploy if needed

### Step 5: Test

1. Reload the Chrome extension
2. Try analyzing a game
3. Check console for: `✅ Agent voice ID found: ...`

---

## Alternative: Check API Key Permissions

You can check what permissions your API key has:

```javascript
// Run in browser console
fetch('https://api.elevenlabs.io/v1/user', {
  headers: {
    'xi-api-key': 'YOUR_API_KEY'
  }
})
.then(r => r.json())
.then(data => {
  console.log('User data:', data);
  console.log('Permissions:', data.permissions || 'Not shown');
});
```

---

## Verify Agent Endpoint Works

Test if the agent API endpoint works with your key:

```javascript
// Run in browser console (replace with your agent ID)
fetch('https://api.elevenlabs.io/v1/convai/agents/agent_1201kd44fpr5ehethh3qchq0hj0a', {
  headers: {
    'xi-api-key': 'YOUR_API_KEY',
    'Accept': 'application/json'
  }
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(data => {
  console.log('Agent data:', data);
  console.log('Voice ID:', data.voice_id || data.voice?.voice_id);
});
```

**Expected:**
- Status: `200` (success)
- Response contains `voice_id` field

**If you get 401:**
- API key missing `convai_read` permission
- Follow steps above to enable it

**If you get 404:**
- Agent ID might be incorrect
- Or agent doesn't exist in your account
- Check agent ID in ElevenLabs dashboard

---

## Troubleshooting

### Still Getting 401 After Enabling Permission?

1. **Wait a few minutes** - permissions can take time to propagate
2. **Verify the key** - Make sure you're using the updated key
3. **Check Cloudflare Worker** - Ensure the secret is updated
4. **Clear Chrome storage** - Reload extension to fetch fresh credentials

### Permission Not Available?

Some ElevenLabs plans don't include Conversational AI API access. You may need to:
- Upgrade to a plan that includes it
- Use a different API key that has the permission
- Contact ElevenLabs support

---

## What the Extension Does Now

The extension will:
1. ✅ **ONLY** use the agent API to fetch voice ID
2. ✅ **Require** agent ID to be set
3. ✅ **Fail gracefully** if API key lacks permissions (with clear error)
4. ✅ **Cache** the voice ID after first fetch
5. ❌ **NOT** use manual voice ID override
6. ❌ **NOT** use default fallback voices

This ensures you're always using your agent's voice!
