# Web Version Deployment Guide

## Files for Website Hosting

1. **web-version.html** - Main HTML file (host this on your website)
2. **analysis.css** - Stylesheet (host this alongside HTML)
3. **web-analysis.js** - JavaScript file (host this alongside HTML)

## Deployment Steps

1. **Upload files to your website:**
   ```
   /chess-analyzer/
     ├── index.html (rename web-version.html)
     ├── analysis.css
     └── web-analysis.js
   ```

2. **Update paths in HTML if needed:**
   - The HTML file references `analysis.css` and `web-analysis.js` in the same directory
   - Libraries are loaded from CDN (no local files needed)

3. **Access the page:**
   - URL: `https://donnybadamo.com/chess-analyzer/`
   - Or whatever path you choose

## Features

- ✅ Paste PGN directly
- ✅ Copy PGN button on clipboard
- ✅ Full analysis with board visualization
- ✅ Move annotations (!, ?, !!, etc.)
- ✅ Voice narration
- ✅ Your website branding (dark green + orange)

## Extension Features

The Chrome extension adds:
- **📋 Copy PGN** button on Lichess game pages
- **🔍 Analyze Game** button to open analysis in extension

Users can:
1. Click "Copy PGN" on Lichess
2. Go to your website
3. Click "Paste from Clipboard" or paste manually
4. Click "Analyze Game"

## Customization

To customize the hosted version:
- Update colors in `analysis.css` (already matches your site)
- Change the URL in the extension's `content.js` if you want the analyze button to open your website instead of the extension

