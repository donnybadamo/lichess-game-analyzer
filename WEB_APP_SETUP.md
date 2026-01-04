# Web App Setup Guide

This extension can also be deployed as a standalone web app on your website.

## Web App Files

### Main Web App (Recommended)
- **`index.html`** - Main web app entry point (uses same UI as extension)
- **`analysis-web.js`** - Web version of analysis script (67KB, full featured)
- Uses the same beautiful UI as the extension
- Supports all features: Stockfish analysis, voice, move playback

### Alternative Web App (Simpler)
- **`web-version.html`** - Simpler web version
- **`web-analysis.js`** - Simpler analysis script (16KB)
- Basic functionality, uses CDN libraries

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)

1. **Connect GitHub repo to Cloudflare Pages:**
   - Go to Cloudflare Dashboard → Workers & Pages
   - Create application → Connect to Git
   - Select your repository

2. **Build Configuration:**
   - Framework preset: None
   - Build command: `npm run build` (or leave empty)
   - Build output directory: `/` (root)
   - Root directory: `/`

3. **Files needed for web app:**
   - `index.html` (or `web-version.html`)
   - `analysis-web.js` (or `web-analysis.js`)
   - `analysis.css`
   - `libs/` directory (all chess libraries)
   - `icons/` directory (optional)

4. **Deploy:**
   - Cloudflare will auto-deploy on git push
   - Or use: `npm run build:cloudflare` to create `cloudflare-dist/` folder

### Option 2: Static Hosting (Netlify, Vercel, etc.)

1. **Upload these files:**
   ```
   index.html
   analysis-web.js
   analysis.css
   libs/
   icons/
   ```

2. **For CDN version (web-version.html):**
   - Uses CDN for libraries (no libs/ folder needed)
   - Just upload: `web-version.html`, `web-analysis.js`, `analysis.css`

### Option 3: Direct File Upload

1. Upload all files to your web server
2. Access via: `https://yourdomain.com/index.html`
3. Or set `index.html` as your default page

## Features Available in Web App

✅ **Full Analysis:**
- Stockfish engine analysis
- Move annotations (!, ?, !!, etc.)
- Position evaluation
- Key moments detection

✅ **Interactive Board:**
- Click moves to navigate
- Play/pause controls
- Flip board
- Drag pieces to explore lines

✅ **Voice Narration:**
- ElevenLabs TTS (if configured)
- Browser TTS fallback
- Voice toggle control

✅ **Beautiful UI:**
- Same design as extension
- Responsive layout
- Modern chess.com-style interface

## Configuration

### For Voice (ElevenLabs):
The web app can use the same Cloudflare Worker for secrets, or you can:
1. Set credentials in browser localStorage
2. Or configure via URL parameters (not recommended for security)

### For Stockfish:
- Uses CDN version: `https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js`
- Works automatically, no configuration needed

## Testing Locally

1. **Simple HTTP server:**
   ```bash
   python3 -m http.server 8000
   # Or
   npx serve .
   ```

2. **Open:** `http://localhost:8000/index.html`

3. **Paste a PGN** and click "Analyze Game"

## Differences from Extension

- **No automatic game detection** - User must paste PGN manually
- **No Lichess integration** - Works with any PGN
- **Uses CDN libraries** - No need for local libs/ folder (if using web-version.html)
- **No Chrome storage** - Uses localStorage or URL params

## Recommended Setup

For your website (`chess.donnybadamo.com` or similar):

1. **Use `index.html`** - Full featured, best UI
2. **Deploy via Cloudflare Pages** - Easiest, auto-deploys
3. **Keep `libs/` folder** - For offline functionality
4. **Configure Cloudflare Worker** - For ElevenLabs voice (optional)

## File Structure for Web App

```
your-website/
├── index.html          # Main entry point
├── analysis-web.js     # Analysis script
├── analysis.css        # Styles
├── libs/              # Chess libraries
│   ├── chess-esm.js
│   ├── chessboard.min.js
│   ├── jquery.min.js
│   ├── chessboard.css
│   └── stockfish.js
└── icons/             # Optional
    └── ...
```

