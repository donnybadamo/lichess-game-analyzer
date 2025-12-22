# Quick Load Instructions

## Step 1: Open Extensions Page
Go to: `chrome://extensions/`

## Step 2: Enable Developer Mode
Toggle "Developer mode" ON (top right)

## Step 3: Load Extension
1. Click "Load unpacked" button (top left)
2. Navigate to this folder:
   ```
   /Users/donnybadamo/Documents/lichess/lichess-analyzer-extension
   ```
3. Click "Select" or "Open"

## Step 4: Verify
You should see:
- ✅ "Lichess Game Analyzer" in your extensions list
- ✅ A reload icon (circular arrow) on the extension card
- ✅ Extension icon in Chrome toolbar

## Step 5: Test
1. Go to: `lichess.org` 
2. Open any finished game
3. Look for purple "🔍 Analyze Game" button
4. Or click extension icon → "Analyze Current Game"

## Troubleshooting

**Extension doesn't appear:**
- Make sure you selected the correct folder
- Check that manifest.json exists in the folder
- Look for errors in the extensions page

**Button doesn't appear:**
- Refresh the Lichess page (F5)
- Check browser console (F12) for errors
- Make sure you're on a game page

**Auto-analysis doesn't work:**
- Finish a live game
- Or manually click the "🔍 Analyze Game" button
- Or use extension popup → "Analyze Current Game"

