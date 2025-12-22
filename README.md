# Lichess Game Analyzer Chrome Extension

A Chrome extension that automatically analyzes your finished Lichess games with chess.com-style annotations and natural voice narration.

## Features

- 🎯 **Automatic Analysis**: Automatically detects when you finish a game on Lichess
- 📊 **Chess.com-style Annotations**: Shows move quality indicators (!, ?, !!, etc.)
- 🎤 **Voice Narration**: Natural text-to-speech that reads moves aloud
- 🎨 **Beautiful UI**: Modern, responsive design with interactive chess board
- 📈 **Position Evaluation**: Visual evaluation bar showing position strength
- ▶️ **Move Playback**: Play through moves with controls

## Installation

### Quick Install (Recommended)

Run the installation script to set up everything:

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
# or
npm run install
```

The script will:
- Generate extension icons automatically
- Verify all required files are present
- Provide installation instructions

### Manual Installation

1. Generate icons (if not done automatically):
   - Open `create-icons.html` in your browser
   - Click "Generate Icons" and download all three sizes
   - Save them in the `icons/` folder

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `lichess-analyzer-extension` folder

## Usage

1. Play a game on Lichess.org
2. When the game finishes, the extension will automatically:
   - Detect the game end
   - Extract the game data
   - Open a new tab with the analysis

Alternatively, you can:
- Click the extension icon and click "Analyze Current Game" to manually trigger analysis

## Controls

- **▶ Play**: Automatically play through all moves
- **⏸ Pause**: Pause the move playback
- **⏹ Stop**: Stop and reset to start position
- **◀ Previous**: Go to previous move
- **Next ▶**: Go to next move
- **Voice Toggle**: Enable/disable voice narration

## Move Annotations

- **!!** (Red): Blunder - major mistake
- **!** (Orange): Mistake - significant error
- **?!** (Yellow): Inaccuracy - minor error
- **!** (Green): Best move
- **=** (Blue): Good move

## Technical Details

- Uses Stockfish.js for chess engine analysis
- Chess.js for move validation and game logic
- Chessboard.js for board visualization
- Web Speech API for voice narration

## Development

The extension consists of:
- `manifest.json`: Extension configuration
- `content.js`: Script that runs on Lichess pages
- `background.js`: Background service worker
- `analysis.html/js/css`: Analysis page interface
- `popup.html/js`: Extension popup

## Notes

- Analysis may take a few seconds per move
- Voice narration uses your system's default text-to-speech voices
- The extension requires internet connection for Stockfish.js and chess libraries

## License

MIT License

