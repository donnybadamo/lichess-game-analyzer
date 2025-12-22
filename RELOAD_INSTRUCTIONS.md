# How to Reload the Extension After Updates

## Step-by-Step Instructions

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/`
   - Or: Chrome menu → More tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" ON (top right corner)

3. **Find Your Extension**
   - Look for "Lichess Game Analyzer"
   - You should see it in the list

4. **Reload the Extension**
   - Click the **reload icon** (circular arrow) on the extension card
   - Or click "Remove" and then "Load unpacked" again

5. **Refresh Lichess Page**
   - Go back to your Lichess game page
   - Press `F5` or `Cmd+R` to refresh
   - The extension will now work with the latest code

## Quick Test

After reloading:
1. Go to any finished game on Lichess (like `lichess.org/game/abc12345`)
2. You should see a purple "🔍 Analyze Game" button appear
3. Click it to test the analysis

## Troubleshooting

- **No button appears**: Check browser console (F12) for errors
- **Extension not loading**: Make sure all files are in the extension folder
- **Still not working**: Try removing and re-adding the extension

## Auto-Analysis

The extension will automatically open analysis when:
- You finish a live game
- The game result appears on screen

You can also manually trigger it:
- Click the "🔍 Analyze Game" button
- Or click extension icon → "Analyze Current Game"

