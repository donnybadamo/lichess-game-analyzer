// Web version analysis script (for hosting on website)

let chess = null;
let board = null;
let stockfish = null;
let moves = [];
let currentMoveIndex = -1;
let analysisData = [];
let isPlaying = false;
let playInterval = null;
let voiceEnabled = true;
let synth = window.speechSynthesis;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupPGNInput();
  checkURLForPGN();
});

// Check if PGN is in URL parameter or clipboard
async function checkURLForPGN() {
  const urlParams = new URLSearchParams(window.location.search);
  const pgnFromUrl = urlParams.get('pgn');
  
  const pgnInput = document.getElementById('pgnInput');
  if (!pgnInput) return;
  
  // Try URL parameter first
  if (pgnFromUrl) {
    try {
      const decodedPgn = decodeURIComponent(pgnFromUrl);
      pgnInput.value = decodedPgn;
      // Auto-analyze after a short delay
      setTimeout(() => {
        document.getElementById('analyzeBtn').click();
      }, 500);
      return;
    } catch (err) {
      console.warn('Could not decode PGN from URL:', err);
    }
  }
  
  // Try clipboard (PGN was copied by extension)
  try {
    const clipboardText = await navigator.clipboard.readText();
    // Check if it looks like a PGN (has move notation)
    if (clipboardText && (clipboardText.includes('1.') || clipboardText.includes('[Event'))) {
      pgnInput.value = clipboardText;
      // Show a message that PGN was pasted
      const pasteBtn = document.getElementById('pasteBtn');
      if (pasteBtn) {
        const originalText = pasteBtn.textContent;
        pasteBtn.textContent = '✓ PGN Pasted!';
        pasteBtn.style.background = '#ff6b35';
        setTimeout(() => {
          pasteBtn.textContent = originalText;
          pasteBtn.style.background = '';
        }, 2000);
      }
    }
  } catch (err) {
    // Clipboard access denied or not available - that's okay
    console.log('Could not read clipboard:', err);
  }
}

function setupPGNInput() {
  const pgnInput = document.getElementById('pgnInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const pasteBtn = document.getElementById('pasteBtn');
  
  // Paste button
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      pgnInput.value = text;
      pgnInput.focus();
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      alert('Could not read from clipboard. Please paste manually.');
    }
  });
  
  // Analyze button
  analyzeBtn.addEventListener('click', () => {
    const pgn = pgnInput.value.trim();
    if (!pgn) {
      alert('Please paste a PGN first.');
      return;
    }
    initializeGame(pgn);
  });
  
  // Allow Enter+Ctrl to analyze
  pgnInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      analyzeBtn.click();
    }
  });
}

async function initializeGame(pgn) {
  try {
    console.log('Initializing game with PGN:', pgn.substring(0, 100) + '...');
    
    // Wait for Chess to be available
    let retries = 0;
    while ((typeof Chess === 'undefined' && typeof window.Chess === 'undefined') && retries < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    const ChessClass = window.Chess || Chess;
    if (typeof ChessClass === 'undefined') {
      throw new Error('Chess library not loaded. Please refresh the page.');
    }
    
    // Hide input section, show analysis
    document.querySelector('.pgn-input-section').style.display = 'none';
    document.getElementById('mainContent').style.display = 'grid';
    document.getElementById('analysisInfo').style.display = 'block';
    
    // Initialize Chess.js
    console.log('Creating Chess instance...', ChessClass);
    chess = new ChessClass();
    
    // Clean PGN - remove annotations but preserve structure
    let cleanPgn = pgn.trim();
    
    // Remove Lichess-style annotations in braces { } but keep move notation
    cleanPgn = cleanPgn.replace(/\{[^}]*\}/g, '');
    // Remove variations in parentheses ( )
    cleanPgn = cleanPgn.replace(/\([^)]*\)/g, '');
    // Remove annotation symbols (? ! ?! ??) from moves
    cleanPgn = cleanPgn.replace(/[?!]{1,2}/g, '');
    // Fix problematic pattern: "14. fxg3 14... Qg6" -> "14. fxg3 Qg6"
    cleanPgn = cleanPgn.replace(/(\d+)\.\s+(\S+)\s+\1\.\.\.\s+(\S+)/g, '$1. $2 $3');
    
    // Clean up multiple spaces but preserve newlines (important for chess.js)
    cleanPgn = cleanPgn.replace(/[ \t]+/g, ' ');
    // Ensure blank line between headers and moves
    cleanPgn = cleanPgn.replace(/\n\n+/g, '\n\n');
    cleanPgn = cleanPgn.trim();
    
    // Parse PGN (loadPgn returns undefined on success, throws on error)
    console.log('Parsing PGN...', cleanPgn.substring(0, 200));
    try {
      chess.loadPgn(cleanPgn);
      const testMoves = chess.history();
      if (testMoves.length === 0) {
        throw new Error('PGN parsed but no moves found');
      }
      console.log('PGN parsed successfully,', testMoves.length, 'moves found');
    } catch (parseError) {
      console.error('PGN parse error:', parseError.message);
      console.error('Cleaned PGN (first 500 chars):', cleanPgn.substring(0, 500));
      throw new Error('Could not parse PGN: ' + parseError.message);
    }

    // Extract moves
    moves = chess.history({ verbose: true });
    console.log('Moves extracted:', moves.length);
    
    // Wait for Chessboard to be available
    retries = 0;
    while (typeof Chessboard === 'undefined' && retries < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    if (typeof Chessboard === 'undefined') {
      throw new Error('Chessboard library not loaded. Please refresh the page.');
    }
    
    console.log('Initializing chessboard...');
    
    const boardElement = document.getElementById('board');
    if (!boardElement) {
      throw new Error('Board element #board not found');
    }
    
    // Wait a bit for DOM
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      board = Chessboard('board', {
        position: 'start',
        draggable: false,
        pieceTheme: 'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/img/chesspieces/wikipedia/{piece}.png'
      });
      
      if (!board) {
        throw new Error('Chessboard returned null');
      }
      
      console.log('Chessboard initialized successfully');
    } catch (err) {
      console.error('Chessboard error:', err);
      throw new Error('Failed to initialize chessboard: ' + err.message);
    }
    
    // Initialize Stockfish (optional for web version)
    try {
      await initializeStockfish();
    } catch (err) {
      console.warn('Stockfish not available:', err);
    }

    // Display moves
    displayMoves();

    // Analyze moves (if Stockfish available)
    if (stockfish) {
      await analyzeMoves();
    }

    // Display game info
    displayGameInfo(pgn);

    // Reset to start position
    resetToStart();
  } catch (error) {
    console.error('Error initializing game:', error);
    alert('Error: ' + error.message);
    // Show input section again
    document.querySelector('.pgn-input-section').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
  }
}

function setupEventListeners() {
  document.getElementById('playBtn').addEventListener('click', playMoves);
  document.getElementById('pauseBtn').addEventListener('click', pauseMoves);
  document.getElementById('stopBtn').addEventListener('click', stopMoves);
  document.getElementById('prevBtn').addEventListener('click', previousMove);
  document.getElementById('nextBtn').addEventListener('click', nextMove);
  document.getElementById('voiceToggle').addEventListener('change', (e) => {
    voiceEnabled = e.target.checked;
  });
}

async function initializeStockfish() {
  return new Promise((resolve) => {
    try {
      // Try to load Stockfish from CDN
      stockfish = new Worker('https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js');
      
      let ready = false;
      
      stockfish.onmessage = (event) => {
        const message = event.data || event;
        
        if (typeof message === 'string') {
          if (message.includes('uciok')) {
            stockfish.postMessage('isready');
          } else if (message.includes('readyok') && !ready) {
            ready = true;
            resolve();
          }
        }
      };
      
      stockfish.postMessage('uci');
      
      setTimeout(() => {
        if (!ready) {
          console.warn('Stockfish initialization timeout');
          resolve();
        }
      }, 5000);
    } catch (e) {
      console.error('Could not initialize Stockfish:', e);
      resolve(); // Continue without Stockfish
    }
  });
}

function displayMoves() {
  const movesList = document.getElementById('movesList');
  movesList.innerHTML = '';

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const moveNumber = Math.floor(i / 2) + 1;
    const isWhite = i % 2 === 0;
    
    const moveItem = document.createElement('div');
    moveItem.className = 'move-item';
    moveItem.dataset.moveIndex = i;
    
    const moveNumberSpan = document.createElement('span');
    moveNumberSpan.className = 'move-number';
    moveNumberSpan.textContent = isWhite ? `${moveNumber}.` : '';
    
    const moveTextSpan = document.createElement('span');
    moveTextSpan.className = 'move-text';
    moveTextSpan.textContent = move.san;
    
    const annotationSpan = document.createElement('span');
    annotationSpan.className = 'move-annotation';
    annotationSpan.id = `annotation-${i}`;
    
    moveItem.appendChild(moveNumberSpan);
    moveItem.appendChild(moveTextSpan);
    moveItem.appendChild(annotationSpan);
    
    moveItem.addEventListener('click', () => {
      goToMove(i);
    });
    
    movesList.appendChild(moveItem);
  }
}

async function analyzeMoves() {
  if (!stockfish) return;
  
  const tempChess = new Chess();
  
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    tempChess.move(move);
    
    // Analyze position
    const evaluation = await getPositionEvaluation(tempChess.fen());
    analysisData[i] = evaluation;
    
    // Update annotation
    updateMoveAnnotation(i, evaluation);
  }
}

async function getPositionEvaluation(fen) {
  if (!stockfish) {
    return { cp: 0, depth: 0, bestMove: null };
  }

  return new Promise((resolve) => {
    let bestMove = null;
    let evaluation = null;
    let depth = 0;
    let bestDepth = 0;
    let handler = null;
    
    const timeout = setTimeout(() => {
      if (handler && stockfish.removeEventListener) {
        stockfish.removeEventListener('message', handler);
      }
      resolve({ cp: evaluation?.cp || 0, depth: bestDepth, bestMove: bestMove });
    }, 3000);
    
    handler = (event) => {
      const message = event.data || event;
      
      if (typeof message === 'string') {
        const evalMatch = message.match(/score (cp|mate) (-?\d+)/);
        const depthMatch = message.match(/depth (\d+)/);
        const pvMatch = message.match(/pv (.+)/);
        
        if (depthMatch) {
          depth = parseInt(depthMatch[1]);
          if (depth > bestDepth) bestDepth = depth;
        }
        
        if (evalMatch) {
          const score = parseInt(evalMatch[2]);
          evaluation = evalMatch[1] === 'mate' ? { mate: score } : { cp: score };
        }
        
        if (pvMatch && !bestMove) {
          bestMove = pvMatch[1].split(' ')[0];
        }
        
        if (depth >= 12 && evaluation) {
          clearTimeout(timeout);
          if (stockfish.removeEventListener) {
            stockfish.removeEventListener('message', handler);
          }
          resolve({ ...evaluation, depth: bestDepth, bestMove });
        }
      }
    };
    
    stockfish.onmessage = handler;
    stockfish.postMessage(`position fen ${fen}`);
    stockfish.postMessage('go depth 15');
  });
}

function updateMoveAnnotation(moveIndex, evaluation) {
  const annotationEl = document.getElementById(`annotation-${moveIndex}`);
  if (!annotationEl || !evaluation) return;
  
  let annotation = '';
  let className = '';
  
  if (moveIndex > 0 && analysisData[moveIndex - 1]) {
    const prevEval = analysisData[moveIndex - 1];
    const currEval = evaluation;
    
    const prevCp = prevEval.cp || (prevEval.mate ? (prevEval.mate > 0 ? 1000 : -1000) : 0);
    const currCp = currEval.cp || (currEval.mate ? (currEval.mate > 0 ? 1000 : -1000) : 0);
    
    const diff = Math.abs(currCp - prevCp);
    
    if (diff > 300) {
      annotation = '!!';
      className = 'blunder';
    } else if (diff > 150) {
      annotation = '!';
      className = 'mistake';
    } else if (diff > 75) {
      annotation = '?!';
      className = 'inaccuracy';
    } else if (diff < 30 && currCp > prevCp) {
      annotation = '!';
      className = 'best';
    } else if (diff < 30) {
      annotation = '=';
      className = 'good';
    }
  }
  
  if (annotation) {
    const icon = document.createElement('span');
    icon.className = `annotation-icon ${className}`;
    icon.textContent = annotation;
    annotationEl.appendChild(icon);
  }
}

function displayGameInfo(pgn) {
  const gameInfo = document.getElementById('gameInfo');
  const lines = pgn.split('\n');
  
  let info = '';
  lines.forEach(line => {
    if (line.startsWith('[') && line.includes('"')) {
      info += line + '<br>';
    }
  });
  
  gameInfo.innerHTML = info || 'Game information not available';
}

function resetToStart() {
  currentMoveIndex = -1;
  chess.reset();
  board.position('start');
  updateMoveHighlight();
  updateEvaluation(0);
}

function goToMove(index) {
  if (index < -1 || index >= moves.length) return;
  
  stopMoves();
  
  chess.reset();
  board.position('start');
  
  for (let i = 0; i <= index; i++) {
    chess.move(moves[i]);
  }
  
  currentMoveIndex = index;
  board.position(chess.fen());
  updateMoveHighlight();
  
  if (analysisData[index]) {
    const eval = analysisData[index];
    const cp = eval.cp || (eval.mate ? (eval.mate > 0 ? 1000 : -1000) : 0);
    updateEvaluation(cp);
  }
}

function updateMoveHighlight() {
  document.querySelectorAll('.move-item').forEach((item, index) => {
    item.classList.toggle('active', index === currentMoveIndex);
  });
}

function updateEvaluation(cp) {
  const evalBar = document.getElementById('evalBar');
  const evalText = document.getElementById('evalText');
  
  const percentage = Math.max(0, Math.min(100, 50 + (cp / 20)));
  
  evalBar.style.width = percentage + '%';
  evalBar.classList.toggle('black-leading', cp < 0);
  
  if (Math.abs(cp) > 900) {
    evalText.textContent = cp > 0 ? 'M' + Math.ceil((1000 - cp) / 100) : 'M' + Math.ceil((cp + 1000) / 100);
  } else {
    evalText.textContent = (cp > 0 ? '+' : '') + (cp / 100).toFixed(1);
  }
}

function playMoves() {
  if (isPlaying) return;
  
  isPlaying = true;
  playInterval = setInterval(() => {
    if (currentMoveIndex < moves.length - 1) {
      nextMove();
    } else {
      stopMoves();
    }
  }, 2000);
}

function pauseMoves() {
  isPlaying = false;
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
}

function stopMoves() {
  pauseMoves();
  resetToStart();
}

function previousMove() {
  if (currentMoveIndex >= 0) {
    goToMove(currentMoveIndex - 1);
  }
}

function nextMove() {
  if (currentMoveIndex < moves.length - 1) {
    goToMove(currentMoveIndex + 1);
    
    if (voiceEnabled && synth) {
      speakMove(currentMoveIndex);
    }
  }
}

function speakMove(moveIndex) {
  if (moveIndex < 0 || moveIndex >= moves.length) return;
  
  const move = moves[moveIndex];
  const moveNumber = Math.floor(moveIndex / 2) + 1;
  const isWhite = moveIndex % 2 === 0;
  
  let text = '';
  if (isWhite) {
    text = `Move ${moveNumber}. ${move.san}`;
  } else {
    text = `${move.san}`;
  }
  
  synth.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  utterance.volume = 1;
  
  const voices = synth.getVoices();
  const preferredVoices = voices.filter(v => 
    v.lang.startsWith('en') && 
    (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex'))
  );
  
  if (preferredVoices.length > 0) {
    utterance.voice = preferredVoices[0];
  }
  
  synth.speak(utterance);
}

if (synth.onvoiceschanged !== undefined) {
  synth.onvoiceschanged = () => {};
}

