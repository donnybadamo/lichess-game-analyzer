# Web Version - For Website Hosting

## ⚠️ Important

**web-version.html is ONLY for hosting on your website (donnybadamo.com), NOT for the Chrome extension.**

The extension uses `analysis.html` which loads libraries locally.

## Files for Website

Upload these 3 files to your website:
- `web-version.html` → rename to `index.html` or `chess-analyzer.html`
- `analysis.css` → keep same name
- `web-analysis.js` → keep same name

## Directory Structure

```
/chess-analyzer/
  ├── index.html (web-version.html renamed)
  ├── analysis.css
  └── web-analysis.js
```

## How It Works

1. User visits: `https://donnybadamo.com/chess-analyzer/`
2. Libraries load from CDN (jQuery, Chess.js, Chessboard.js)
3. User pastes PGN
4. Analysis runs in browser

## No CSP Issues

When hosted on your website (not in extension), there are NO Content Security Policy restrictions. CDN scripts work fine.

## Testing Locally

You can test locally by:
1. Opening `web-version.html` in a browser (not via extension)
2. Or using a local server: `python -m http.server 8000`
3. Then visit: `http://localhost:8000/web-version.html`

## Extension vs Web Version

- **Extension**: Uses `analysis.html` + local libraries (libs/*)
- **Website**: Uses `web-version.html` + CDN libraries

Both have the same features and branding!

