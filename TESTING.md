# Testing Guide

This extension includes automated terminal tests to verify PGN parsing and cleaning logic.

## Test Files

### `test-pgn.js`
Tests the PGN cleaning logic without requiring chess.js:
- Validates annotation removal (`{...}`)
- Checks move notation presence
- Verifies metadata extraction
- Validates structure (no unclosed braces/parentheses)

**Run:** `npm run test:clean` or `node test-pgn.js`

### `test-full.js`
Full integration test with chess.js library:
- Loads chess.js ESM module
- Cleans and parses the test PGN
- Validates move parsing (65 moves expected)
- Checks game headers (players, result, opening)
- Displays first/last moves and final position

**Run:** `npm run test:full` or `node test-full.js`

### `test-simple.js`
Quick validation test:
- Tests simple PGN parsing
- Tests your full PGN
- Useful for debugging

**Run:** `node test-simple.js`

## Running All Tests

```bash
npm test
```

This runs both `test-pgn.js` and `test-full.js` sequentially.

## Test PGN

The tests use `test.pgn` which contains a real Lichess game with:
- Lichess annotations (`{...}`)
- Move variations `(...)`
- Annotation symbols (`?`, `!`, `?!`, `??`)
- Duplicate move numbers (`14. fxg3 14... Qg6`)

## Expected Results

✅ **test-pgn.js**: Should show:
- Original length: ~2095 chars
- Cleaned length: ~1535 chars
- 82 move notations found
- No validation errors

✅ **test-full.js**: Should show:
- Chess.js loaded successfully
- 65 moves parsed
- Game result: 1-0
- White: IIOhManII
- Black: hamitaldirmaz10
- Opening: Polish Opening

## PGN Cleaning Logic

The cleaning process removes:
1. Lichess annotations: `{...}` → removed
2. Move variations: `(...)` → removed
3. Annotation symbols: `?`, `!`, `?!`, `??` → removed
4. Duplicate move numbers: `14. fxg3 14... Qg6` → `14. fxg3 Qg6`

But preserves:
- Headers `[Event "..."]`
- Move notation `1. e4 e5`
- Newlines (important for chess.js)
- Blank line between headers and moves

## Troubleshooting

If tests fail:
1. Check that `test.pgn` exists in the extension directory
2. Verify `libs/chess-esm.js` is present
3. Check Node.js version (should be 14+)
4. Review error messages for specific parsing issues

## Continuous Integration

These tests can be integrated into CI/CD pipelines:
```bash
# Exit code 0 = success, 1 = failure
npm test && echo "All tests passed" || exit 1
```

