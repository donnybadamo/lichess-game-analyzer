# Installation Guide

## Quick Start

The easiest way to set up the extension is to run the installation script:

### macOS/Linux
```bash
./install.sh
```

### Windows
```batch
install.bat
```

### Node.js (Cross-platform)
```bash
node install.js
# or if you have npm
npm run install
```

## What the Installation Script Does

1. **Generates Icons**: Automatically creates the required icon files (16x16, 48x48, 128x128 pixels)
   - Uses Node.js `canvas` module if available
   - Falls back to ImageMagick if available
   - Otherwise provides instructions for manual icon generation

2. **Verifies Files**: Checks that all required extension files are present:
   - manifest.json
   - content.js
   - background.js
   - analysis.html
   - analysis.js
   - analysis.css
   - popup.html
   - popup.js

3. **Provides Instructions**: Shows platform-specific instructions for loading the extension in Chrome

## Manual Installation

If you prefer to install manually:

1. **Generate Icons**:
   - Open `create-icons.html` in your browser
   - Click "Generate Icons"
   - Download all three icon sizes
   - Save them in the `icons/` folder

2. **Load in Chrome**:
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension folder

## Requirements

- **Chrome Browser**: Version 88+ (for Manifest V3 support)
- **Node.js** (optional): For automated icon generation
- **Canvas module** (optional): `npm install canvas` for better icon generation

## Troubleshooting

### Icons Not Generated
- Install Node.js and canvas: `npm install canvas`
- Or use ImageMagick: `brew install imagemagick` (macOS) / `apt-get install imagemagick` (Linux)
- Or manually generate using `create-icons.html`

### Extension Won't Load
- Make sure all files are present (run the install script to verify)
- Check Chrome console for errors (F12)
- Ensure you're using Chrome (not Chromium or other browsers)

### Script Won't Run
- Make scripts executable: `chmod +x install.sh install.js`
- On Windows, use `install.bat` instead
- Or run with: `bash install.sh` or `node install.js`

