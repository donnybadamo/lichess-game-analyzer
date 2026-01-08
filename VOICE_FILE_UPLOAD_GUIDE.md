# Voice File Upload Guide

This guide explains how to upload pre-recorded voice files for the demo game so you don't need to use ElevenLabs API.

## How It Works

The system uses a hash-based matching system:
1. Each commentary text is converted to a hash (unique identifier)
2. Voice files are matched to commentary by hash
3. If a matching voice file exists, it's played instead of calling ElevenLabs

## Step-by-Step Instructions

### 1. Generate Hashes for Your Commentary

1. Open the extension popup
2. Click "Generate Hash Helper" button
3. Paste each piece of commentary text into the text area
4. The hash will appear automatically
5. Note down the hash (it looks like: `a1b2c3d4`)

### 2. Record Voice Files

Record audio files (MP3 or WAV) for each piece of commentary:
- **Demo game intro**: Record the intro text
- **Each move commentary**: Record each move's commentary text
- You'll need one file per unique commentary text

**Estimated number of files:**
- 1 intro file
- ~60 move commentary files (one per move, typically 30 moves × 2 players)
- **Total: ~61 files** for a full demo game

### 3. Name Your Files

Name each file with its hash in the filename:
- Format: `voice_HASH.mp3` or `HASH.mp3`
- Example: `voice_a1b2c3d4.mp3`
- The hash can appear anywhere in the filename

### 4. Upload Files

1. Open the extension popup
2. Click "Choose Files" under "Upload Voice Files"
3. Select all your voice files at once
4. Click "Upload Selected Files"
5. Wait for confirmation

### 5. Test

1. Load the demo game
2. Play through the game
3. Check the browser console (F12) to see:
   - `✅ Played local voice file` = using your uploaded file
   - `⚠️ No local voice file found` = falling back to ElevenLabs

## Alternative: Bulk Hash Generation Script

If you have many files, you can generate hashes programmatically:

```javascript
// Run this in browser console on the analysis page
function generateHashes() {
  const hashes = {};
  
  // Get intro hash
  const intro = "Let's review this game! " + gameSummary;
  hashes.intro = hashText(intro);
  
  // Get all move commentary hashes
  moveCommentary.forEach((commentary, index) => {
    if (commentary) {
      hashes[`move_${index}`] = hashText(commentary);
    }
  });
  
  console.log('Voice file hashes:', hashes);
  return hashes;
}

// Then run:
generateHashes();
```

## File Naming Tips

You can name files in any of these formats:
- `voice_a1b2c3d4.mp3` ✅
- `a1b2c3d4_commentary.mp3` ✅
- `move_1_voice_a1b2c3d4.mp3` ✅
- `a1b2c3d4.mp3` ✅

As long as the hash appears in the filename, it will be recognized.

## Optimization Tips

1. **Reuse files**: If multiple moves have the same commentary text, they'll have the same hash and can share one file
2. **Use MP3**: MP3 files are smaller and load faster
3. **Batch upload**: You can upload all files at once

## Troubleshooting

**Q: Files uploaded but not playing?**
- Check browser console for hash mismatches
- Verify hash appears in filename
- Make sure file format is supported (MP3, WAV, etc.)

**Q: How do I know which hash goes with which file?**
- Use the Hash Helper in the popup
- Or generate hashes programmatically (see above)

**Q: Can I update/replace a file?**
- Yes! Just upload a new file with the same hash
- The old file will be replaced

**Q: How much storage space do I need?**
- Each file is typically 50-200 KB
- ~61 files × 100 KB = ~6 MB total
- IndexedDB has plenty of space (usually 50MB+)
