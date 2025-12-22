#!/usr/bin/env node

// Full test with chess.js library
const fs = require('fs');

// Load chess.js ESM module
async function loadChess() {
  try {
    // Use dynamic import for ESM
    const chessModule = await import('./libs/chess-esm.js');
    return chessModule.Chess;
  } catch (e) {
    console.error('❌ Could not load chess.js:', e.message);
    process.exit(1);
  }
}

const testPGN = fs.readFileSync('./test.pgn', 'utf8');

function cleanPGN(pgn) {
  let cleanPgn = pgn.trim();
  // Remove annotations in braces { } but keep newlines
  cleanPgn = cleanPgn.replace(/\{[^}]*\}/g, '');
  // Remove variations in parentheses ( ) - chess.js can have issues with complex variations
  cleanPgn = cleanPgn.replace(/\([^)]*\)/g, '');
  // Remove annotation symbols (? ! ?! ??) from moves
  cleanPgn = cleanPgn.replace(/[?!]{1,2}/g, '');
  // Clean up multiple spaces but preserve newlines
  cleanPgn = cleanPgn.replace(/[ \t]+/g, ' ');
  // Ensure there's a blank line between headers and moves
  cleanPgn = cleanPgn.replace(/\n\n+/g, '\n\n');
  return cleanPgn.trim();
}

async function testFullParsing() {
  console.log('🧪 Full PGN Parsing Test with chess.js\n');
  console.log('='.repeat(60));
  
  const Chess = await loadChess();
  console.log('✅ Chess.js loaded\n');
  
  const cleaned = cleanPGN(testPGN);
  console.log('📋 Testing cleaned PGN...\n');
  
  try {
    const chess = new Chess();
    try {
      chess.loadPgn(cleaned);
      const testMoves = chess.history();
      if (testMoves.length === 0) {
        console.log('❌ PGN parsed but no moves found');
        return false;
      }
    } catch (parseError) {
      console.log('❌ PGN parsing error:', parseError.message);
      console.log('\nFirst 500 chars of cleaned PGN:');
      console.log(cleaned.substring(0, 500));
      console.log('\nLast 200 chars of cleaned PGN:');
      console.log(cleaned.substring(cleaned.length - 200));
      return false;
    }
    
    console.log('✅ PGN parsed successfully!');
    
    const moves = chess.history({ verbose: true });
    console.log('✅ Total moves:', moves.length);
    
    const headers = chess.header();
    console.log('✅ Game result:', headers.Result || 'Unknown');
    console.log('✅ White player:', headers.White || 'Unknown');
    console.log('✅ Black player:', headers.Black || 'Unknown');
    console.log('✅ Opening:', headers.Opening || 'Unknown');
    
    console.log('\n📊 First 5 moves:');
    moves.slice(0, 5).forEach((move, i) => {
      console.log(`  ${i + 1}. ${move.san} (from ${move.from} to ${move.to})`);
    });
    
    console.log('\n📊 Last 5 moves:');
    moves.slice(-5).forEach((move, i) => {
      const moveNum = moves.length - 4 + i;
      console.log(`  ${moveNum}. ${move.san} (from ${move.from} to ${move.to})`);
    });
    
    // Test final position
    const fen = chess.fen();
    console.log('\n📊 Final position FEN:');
    console.log('  ' + fen);
    
    console.log('\n✅ All tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nStack:', error.stack);
    return false;
  }
}

testFullParsing().then(success => {
  process.exit(success ? 0 : 1);
});
