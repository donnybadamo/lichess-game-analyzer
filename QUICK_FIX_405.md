# Quick Fix for 405 Error

## The Problem
Your Cloudflare Worker is returning **405 Method Not Allowed**, which means it's not accepting POST requests to `/get-secret`.

## The Solution (3 Steps)

### Step 1: Redeploy Your Worker

1. Go to https://dash.cloudflare.com/
2. Click **"Workers & Pages"** → Find your Worker
3. Click **"Edit code"**
4. **Delete ALL existing code**
5. Copy the code from `cloudflare-worker-keyvault.js` (in this folder)
6. Paste it into the editor
7. Click **"Save and deploy"** ⚠️ **IMPORTANT: Must click deploy!**

### Step 2: Test Your Worker

Open browser console and run:

```javascript
// Replace with your actual Worker URL
const workerUrl = 'https://your-worker.workers.dev';

// Test POST request
fetch(`${workerUrl}/get-secret`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secretName: 'ELEVENLABS_API_KEY' })
})
.then(r => r.text())
.then(console.log)
.catch(console.error);
```

**Expected:** `{"secretValue":"sk_...","secretName":"ELEVENLABS_API_KEY"}`

**If still 405:** Worker not deployed correctly - go back to Step 1

### Step 3: Verify Extension Configuration

```javascript
// Check Worker URL
chrome.storage.local.get(['cloudflareWorkerUrl'], (result) => {
  console.log('Worker URL:', result.cloudflareWorkerUrl);
  
  // If wrong, set it (NO trailing slash!)
  chrome.storage.local.set({
    cloudflareWorkerUrl: 'https://your-worker.workers.dev'
  });
});
```

## Common Mistakes

❌ **Forgot to click "Save and deploy"** → Worker code didn't update  
❌ **Trailing slash in URL** → `https://worker.workers.dev/` (wrong)  
✅ **Correct:** `https://worker.workers.dev` (no slash)

❌ **Using old Worker code** → Delete and paste fresh code  
❌ **Secrets not set** → Go to Settings → Variables → Secrets

## Still Not Working?

Run the diagnostic script:

1. Open extension page
2. Open DevTools Console
3. Copy/paste contents of `test-worker.js`
4. It will test your Worker and show what's wrong

## Need Help?

Check `FIX_405_ERROR.md` for detailed troubleshooting steps.

