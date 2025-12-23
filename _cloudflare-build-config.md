# Cloudflare Pages Build Configuration

## For GitHub Integration

When connecting your GitHub repo to Cloudflare Pages:

### Build Settings:

**Framework preset:** None (or Static)

**Build command:**
```bash
npm install && npm run build:cloudflare
```

**Build output directory:**
```
cloudflare-dist
```

**Root directory:** (leave empty or `/`)

**Environment variables:** (none needed)

---

## Alternative: No Build Step

If you prefer **no build step** (simpler):

**Build command:**
```bash
echo "No build needed - static files"
```

**Build output directory:**
```
.
```

Then manually update files to use relative paths instead of `chrome.runtime.getURL()`.

---

## Manual Setup (Recommended for First Time)

1. Run build script locally:
   ```bash
   npm install
   npm run build:cloudflare
   ```

2. Upload `cloudflare-dist/` folder contents to Cloudflare Pages

3. Or connect GitHub and use build settings above

---

## What the Build Script Does:

- Copies all necessary files
- Replaces `chrome.runtime.getURL('path')` with `'path'` (relative paths)
- Prepares files for static hosting on Cloudflare Pages
- Outputs to `cloudflare-dist/` directory

