# Cloudflare Pages Setup - Quick Guide

## Step 1: Connect GitHub Repo

1. Go to: https://dash.cloudflare.com/
2. Click **"Workers & Pages"** in sidebar
3. Click **"Create application"**
4. Click **"Pages"** tab
5. Click **"Connect to Git"**
6. Select your GitHub account
7. Select repository: `lichess-analyzer-extension` (or your repo name)
8. Click **"Begin setup"**

---

## Step 2: Configure Build Settings

**Project name:** `lichess-analysis` (or your choice)

**Production branch:** `main` (or `master`)

**Framework preset:** `None` (or `Static`)

**Build command:**
```bash
npm install && npm run build:cloudflare
```

**Build output directory:**
```
cloudflare-dist
```

**Root directory:** (leave empty)

**Environment variables:** (none needed for now)

Click **"Save and Deploy"**

---

## Step 3: Wait for Deployment

- Cloudflare will clone your repo
- Run the build command
- Deploy to Pages
- You'll get a URL like: `https://lichess-analysis.pages.dev`

---

## Step 4: Get Your Pages URL

After deployment:
1. Go to your Pages project
2. Copy the **production URL**: `https://lichess-analysis.pages.dev`
3. This is your analysis page URL!

---

## Step 5: Update Extension

Update `content.js` to use your Cloudflare Pages URL instead of `chrome.runtime.getURL('analysis.html')`:

```javascript
const cloudflarePagesUrl = 'https://lichess-analysis.pages.dev';
// Use this URL when opening analysis
```

---

## Step 6: Add Custom Domain (Optional)

1. In Pages project, go to **"Custom domains"**
2. Click **"Set up a custom domain"**
3. Enter: `chess.donnybadamo.com`
4. Follow DNS instructions
5. Add CNAME record in your DNS:
   - **Name:** `chess`
   - **Target:** `lichess-analysis.pages.dev`
   - **Proxy:** ✅ (orange cloud)

---

## Step 7: Add to ElevenLabs Allowed Hosts

1. Go to ElevenLabs dashboard
2. Settings → API → Allowed hosts
3. Add your Pages URL:
   - `https://lichess-analysis.pages.dev`
   - Or: `https://chess.donnybadamo.com` (if using custom domain)

---

## ✅ Done!

Your analysis page is now live on Cloudflare Pages!

**Next:** Update the extension to use this URL instead of the local `analysis.html`.

