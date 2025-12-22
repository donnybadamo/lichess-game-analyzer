#!/usr/bin/env node

const fs = require('fs');

async function test() {
  const chessModule = await import('./libs/chess-esm.js');
  const Chess = chessModule.Chess;
  const chess = new Chess();
  
  // Simple test first
  console.log('Test 1: Simple PGN');
  const chess1 = new Chess();
  const simple = '[Event "Test"]\n\n1. e4 e5 2. Nf3';
  try {
    chess1.loadPgn(simple);
    const moves1 = chess1.history();
    console.log('Result:', moves1.length > 0 ? '✓ PASS' : '✗ FAIL');
    console.log('Moves parsed:', moves1.length);
  } catch (e) {
    console.log('Result: ✗ FAIL -', e.message);
  }
  
  // Your PGN
  console.log('\nTest 2: Your PGN');
  let pgn = fs.readFileSync('./test.pgn', 'utf8');
  
  // Clean it
  pgn = pgn.replace(/\{[^}]*\}/g, '');
  pgn = pgn.replace(/\([^)]*\)/g, '');
  pgn = pgn.replace(/[?!]{1,2}/g, '');
  // Fix problematic pattern: "14. fxg3 14... Qg6" -> "14. fxg3 Qg6"
  // Remove duplicate move numbers before black moves
  pgn = pgn.replace(/(\d+)\.\s+(\S+)\s+\1\.\.\.\s+(\S+)/g, '$1. $2 $3');
  pgn = pgn.replace(/[ \t]+/g, ' ');
  pgn = pgn.replace(/\n\n+/g, '\n\n').trim();
  
  const chess2 = new Chess();
  let r2 = false;
  try {
    chess2.loadPgn(pgn);
    const moves2 = chess2.history();
    r2 = moves2.length > 0;
    console.log('Result:', r2 ? '✓ PASS' : '✗ FAIL');
  } catch (e) {
    console.log('Result: ✗ FAIL -', e.message);
  }
  
  if (r2) {
    const moves = chess2.history();
    console.log('Moves parsed:', moves.length);
    console.log('Last move:', moves[moves.length - 1]);
  } else {
    // Try to find where it fails
    const chess3 = new Chess();
    const lines = pgn.split('\n');
    let moveSection = false;
    let moveText = '';
    for (const line of lines) {
      if (line.trim() === '') {
        moveSection = true;
        continue;
      }
      if (moveSection) {
        moveText += line + ' ';
      }
    }
    console.log('Move text (first 200 chars):', moveText.substring(0, 200));
    
    // Try parsing just moves
    const chess4 = new Chess();
    const headers = pgn.split('\n\n')[0];
    const movesOnly = pgn.split('\n\n')[1];
    console.log('\nTrying headers + moves separately...');
    console.log('Headers:', headers.substring(0, 100));
    console.log('Moves (first 200):', movesOnly.substring(0, 200));
    
    const r3 = chess4.loadPgn(pgn);
    console.log('Direct parse:', r3 ? '✓' : '✗');
  }
}

test().catch(console.error);

