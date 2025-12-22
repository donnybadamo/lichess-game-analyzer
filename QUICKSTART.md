# Quick Start Guide

## Installation Steps

### Option 1: Automated Installation (Recommended)

Run the installation script:

**macOS/Linux:**
```bash
./install.sh
```

**Windows:**
```batch
install.bat
```

**Node.js (any platform):**
```bash
node install.js
```

The script will automatically:
- Generate extension icons
- Verify all files are present
- Provide Chrome installation instructions

### Option 2: Manual Installation

1. **Generate Icons** (if not done automatically):
   - Open `create-icons.html` in your browser
   - Click "Generate Icons"
   - Download all three icon sizes (16x16, 48x48, 128x128)
   - Save them in the `icons/` folder as `icon16.png`, `icon48.png`, and `icon128.png`

2. **Load Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `lichess-analyzer-extension` folder

3. **Test the Extension**:
   - Go to lichess.org and finish a game
   - The extension should automatically open an analysis tab
   - Or click the extension icon and click "Analyze Current Game"

## Features to Try

- **Play Button**: Automatically plays through all moves
- **Voice Toggle**: Enable/disable move narration
- **Click Moves**: Click any move in the list to jump to that position
- **Evaluation Bar**: See the position evaluation at the top

## Troubleshooting

- **No analysis opens**: Make sure you're on a finished game page on Lichess
- **Board doesn't show**: Check browser console for errors (F12)
- **Voice doesn't work**: Check your system's text-to-speech settings
- **Analysis is slow**: Stockfish analysis takes time - be patient!

## Notes

- The extension works best on finished games
- Analysis quality depends on Stockfish depth (currently set to 15)
- Voice uses your system's default TTS voices

