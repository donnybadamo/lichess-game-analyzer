# Testing with Specific Lichess Game

## Test Game URL
https://lichess.org/nPe5K3VN/white

## How to Test

### Step 1: Install/Reload Extension
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension folder
5. Click the reload button if already loaded

### Step 2: Open the Game
1. Open: https://lichess.org/nPe5K3VN/white
2. Wait for page to load completely

### Step 3: Check for Analyze Button
Look for the "🔍 Analyze Game" button on the page (should appear near game controls)

### Step 4: Click Analyze Button
1. Click "🔍 Analyze Game"
2. The analysis should open (either embedded on page or in new tab, depending on your settings)

### Step 5: Check Console for Errors
1. Press F12 (DevTools)
2. Go to Console tab
3. Look for:
   - `🔍 Initializing agent voice for: agent_1201kd44fpr5ehethh3qchq0hj0a`
   - `✅ Agent voice ID found: [voice_id]`
   - `🎤 Using agent voice ID: [voice_id]`
   - Any red errors

### Step 6: Test Voice
1. Analysis should auto-play moves
2. Listen to the voice - should use your custom agent voice
3. If it sounds wrong, check console for errors

## Debugging

If the button doesn't appear:
- Check console for errors
- Make sure you're on a finished game page
- Try refreshing the page

If voice doesn't work:
- Run the test script in console (see test-agent-voice.js)
- Check if credentials are set in Chrome storage
- Verify agent ID is correct

## Expected PGN
The extension should extract this PGN from the game:

```
[Event "rated blitz game"]
[Site "https://lichess.org/nPe5K3VN"]
[Date "2025.12.22"]
[White "IIOhManII"]
[Black "hamitaldirmaz10"]
[Result "1-0"]
1. b4 e5 2. Bb2 Nc6 3. b5 Nd4 4. e3 Ne6 5. Bxe5 Qg5 6. Nf3 Qf5 7. Bd3 Qg4 8. O-O d6 9. Bg3 Nf6 10. Be2 Bd7 11. a4 a6 12. c4 Ne4 13. d3 Nxg3 14. fxg3 Qg6 15. Nc3 Be7 16. d4 O-O 17. Bd3 Qh6 18. e4 Nxd4 19. Nxd4 Qe3+ 20. Kh1 Qxd4 21. Nd5 Bd8 22. Qe2 c6 23. Nf4 cxb5 24. cxb5 axb5 25. Bxb5 Bxb5 26. Qxb5 Qxe4 27. Rae1 Qxa4 28. Qxb7 Bf6 29. Nh5 Bc3 30. Re7 d5 31. Rexf7 Qc4 32. Rxg7+ Bxg7 33. Qxg7# 1-0
```

