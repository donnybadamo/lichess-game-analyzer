// Analysis page script

let chess = null;
let board = null;
let stockfish = null;
let moves = [];
let currentMoveIndex = -1;
let analysisData = [];
let moveCommentary = []; // Store commentary for each move
let keyMoments = []; // Store key turning points
let gameSummary = null;
let isPlaying = false;
let playInterval = null;
let voiceEnabled = true;
let synth = window.speechSynthesis;
let selectedVoice = null;
let useGoogleTTS = false;
let googleTTSApiKey = null;
let boardOrientation = 'white'; // 'white' or 'black'
let isExploringLine = false; // Track if user is exploring alternate moves

// Board drag/drop handlers
function onDragStart(source, piece, position, orientation) {
  // Don't allow picking up pieces if game is over
  if (chess.isGameOver()) return false;
  
  // Only allow moving pieces of the current turn
  if ((chess.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (chess.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
  
  return true;
}

function onDrop(source, target) {
  // Check if this is a legal move
  const move = chess.move({
    from: source,
    to: target,
    promotion: 'q' // Always promote to queen for simplicity
  });
  
  // Illegal move
  if (move === null) return 'snapback';
  
  // Mark that we're exploring a line
  if (!isExploringLine) {
    isExploringLine = true;
    showExplorationIndicator();
  }
  
  // Update the analysis display for the new position
  updateExplorationAnalysis();
  
  return undefined; // Let the move happen
}

function onSnapEnd() {
  // Update board position after the piece snap animation
  board.position(chess.fen());
}

function showExplorationIndicator() {
  const analysisMove = document.getElementById('analysisMove');
  if (analysisMove) {
    analysisMove.innerHTML = '🔍 <span style="color: var(--brilliant);">Exploring alternate line</span>';
  }
  
  // Show a "Back to Game" button
  const hintEl = document.getElementById('bestMoveHint');
  if (hintEl) {
    hintEl.style.display = 'block';
    hintEl.innerHTML = `
      <button id="backToGameBtn" class="back-to-game-btn" onclick="returnToGame()">
        ↩ Back to Game Position
      </button>
    `;
  }
}

function returnToGame() {
  isExploringLine = false;
  
  // Reset to the current move in the game
  goToMove(currentMoveIndex);
  
  // Hide the back button
  const hintEl = document.getElementById('bestMoveHint');
  if (hintEl) {
    hintEl.style.display = 'none';
    hintEl.innerHTML = `
      <span class="hint-label">Better was:</span>
      <span class="hint-move" id="hintMove"></span>
    `;
  }
}

async function updateExplorationAnalysis() {
  if (!stockfish) return;
  
  const fen = chess.fen();
  
  // Quick analysis of the explored position
  const analysisText = document.getElementById('analysisText');
  if (analysisText) {
    analysisText.textContent = 'Analyzing position...';
  }
  
  try {
    const evalResult = await getPositionEvaluation(fen, -1);
    const cp = evalResult.cp || 0;
    
    // Update eval bar
    updateEvaluation(cp, true);
    
    // Update analysis text
    if (analysisText) {
      const evalDisplay = (cp / 100).toFixed(2);
      const sign = cp > 0 ? '+' : '';
      const advantage = cp > 50 ? 'White is better' : cp < -50 ? 'Black is better' : 'Position is equal';
      analysisText.textContent = `Eval: ${sign}${evalDisplay} • ${advantage}`;
      
      if (evalResult.bestMove) {
        analysisText.textContent += ` • Best: ${evalResult.bestMove}`;
      }
    }
    
    // Draw best move arrow
    clearMoveHighlights();
    if (evalResult.bestMove && evalResult.bestMove.length >= 4) {
      drawBestMoveArrow(evalResult.bestMove, '');
    }
    
  } catch (e) {
    console.error('Error analyzing explored position:', e);
  }
}

// Make returnToGame available globally
window.returnToGame = returnToGame;

// Wait for libraries to be loaded before initializing
function waitForLibraries() {
  return new Promise((resolve) => {
    const checkLibraries = () => {
      if (typeof window.Chess !== 'undefined' && 
          typeof window.Chessboard !== 'undefined' && 
          typeof window.$ !== 'undefined') {
        console.log('All libraries ready!');
        resolve();
      } else {
        console.log('Waiting for libraries...', {
          Chess: typeof window.Chess,
          Chessboard: typeof window.Chessboard,
          jQuery: typeof window.$
        });
        setTimeout(checkLibraries, 100);
      }
    };
    checkLibraries();
  });
}

// Show error message (but keep the UI so user can paste PGN)
function showError(message) {
  const gameInfo = document.getElementById('gameInfo');
  if (gameInfo) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'game-summary';
    errorDiv.style.background = 'rgba(255, 68, 68, 0.1)';
    errorDiv.style.borderLeftColor = '#ff4444';
    errorDiv.innerHTML = `<h3 style="color: #ff4444;">Error</h3><p>${message}</p>`;
    gameInfo.appendChild(errorDiv);
  }
  
  // Show PGN modal
  const pgnModal = document.getElementById('pgnModal');
  if (pgnModal) {
    pgnModal.style.display = 'flex';
  }
}

// Initialize voice with best available voice
function initializeVoice() {
  const loadVoices = () => {
    const voices = synth.getVoices();
    console.log('Available voices:', voices.length);
    
    // Prefer masculine "dude" voices (ordered by quality)
    const preferredVoices = [
      'Microsoft David',             // Best Windows male voice - natural dude sound
      'Microsoft Mark',              // Windows alternative male - good dude voice
      'Daniel',                      // macOS alternative male - natural
      'Alex',                        // macOS high quality male
      'Google US English',           // Best quality Google voice (usually male)
      'Microsoft Zira',              // Windows female (fallback)
      'Samantha',                    // macOS high quality female (fallback)
    ];
    
    // Try to find preferred voice (exact match first, then partial)
    for (const preferred of preferredVoices) {
      // Try exact match first
      let voice = voices.find(v => 
        v.name === preferred && v.lang.startsWith('en')
      );
      
      // If no exact match, try partial match
      if (!voice) {
        voice = voices.find(v => 
          v.name.includes(preferred) && v.lang.startsWith('en')
        );
      }
      
      if (voice) {
        selectedVoice = voice;
        console.log('Selected premium voice:', voice.name, voice.lang);
        return;
      }
    }
    
    // Fallback: find best quality English voice
    const qualityVoices = voices.filter(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Alex') || v.name.includes('Samantha'))
    );
    
    if (qualityVoices.length > 0) {
      selectedVoice = qualityVoices[0];
      console.log('Using quality fallback voice:', selectedVoice.name);
      return;
    }
    
    // Final fallback: any English voice
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
      selectedVoice = englishVoice;
      console.log('Using basic fallback voice:', englishVoice.name);
    } else {
      console.warn('No English voices found!');
    }
  };
  
  loadVoices();
  
  // Some browsers load voices asynchronously
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
  
  // Also try loading after a delay (some browsers need time)
  setTimeout(loadVoices, 500);
}

// Initialize function that can be called immediately or on DOMContentLoaded
async function initializeAnalysisPage() {
  console.log('Initializing analysis page...');
  console.log('Document ready state:', document.readyState);
  console.log('URL:', window.location.href);
  
  initializeVoice();
  
  await waitForLibraries();
  console.log('Libraries ready, setting up event listeners...');
  
  // Setup event listeners first
  setupEventListeners();
  
  // Get PGN from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  let pgn = urlParams.get('pgn');
  console.log('PGN from URL:', pgn ? 'Found (' + pgn.substring(0, 50) + '...)' : 'Not found');
  
  // Check if PGN input section exists
  const pgnInputSection = document.getElementById('pgnInputSection');
  console.log('PGN input section found:', !!pgnInputSection);
  if (pgnInputSection) {
    console.log('PGN input section display:', window.getComputedStyle(pgnInputSection).display);
  }
  
  // Fallback: try to get from localStorage if URL param is missing
  if (!pgn) {
    try {
      const storedPgn = localStorage.getItem('currentGamePGN');
      if (storedPgn) {
        console.log('Got PGN from localStorage');
        await initializeGame(storedPgn);
        // Hide PGN modal after successful analysis
        const pgnModal = document.getElementById('pgnModal');
        if (pgnModal) {
          pgnModal.style.display = 'none';
        }
        return;
      } else {
        // Show PGN modal instead of error
        const pgnModal = document.getElementById('pgnModal');
        if (pgnModal) {
          pgnModal.style.display = 'flex';
          console.log('Showing PGN modal (no PGN found)');
        }
        console.log('No PGN found. You can paste PGN in the input field.');
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
  }
  
  if (pgn) {
    pgn = decodeURIComponent(pgn);
    await initializeGame(pgn);
    
    // Hide PGN modal if we got PGN from URL
    const pgnModal = document.getElementById('pgnModal');
    if (pgnModal) {
      pgnModal.style.display = 'none';
    }
  } else {
    // Show PGN modal if no PGN provided
    const pgnModal = document.getElementById('pgnModal');
    if (pgnModal) {
      pgnModal.style.display = 'flex';
      console.log('Showing PGN modal (no PGN in URL)');
    }
    
    // Don't show error - let user paste PGN instead
    console.log('No PGN in URL. You can paste PGN in the input field below.');
  }
}

// Initialize Google TTS if available
async function initGoogleTTS() {
  try {
    const apiKey = localStorage.getItem('googleTTSApiKey');
    if (apiKey) {
      googleTTSApiKey = apiKey;
      useGoogleTTS = true;
      console.log('✓ Google TTS enabled with masculine voice');
      return true;
    }
  } catch (e) {
    console.error('Error checking Google TTS:', e);
  }
  return false;
}

// Speak using Google Cloud TTS with masculine voice
async function speakWithGoogleTTS(text) {
  if (!useGoogleTTS || !googleTTSApiKey) return false;
  
  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTTSApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Wavenet-B', // More natural masculine "dude" voice
            ssmlGender: 'MALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.1, // Natural conversational pace
            pitch: -2.0, // Lower pitch for more masculine "dude" sound
            volumeGainDb: 0.0
          }
        })
      }
    );
    
    if (!response.ok) throw new Error(`TTS API error: ${response.status}`);
    
    const data = await response.json();
    const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
    await audio.play();
    return true;
  } catch (error) {
    console.error('Google TTS error:', error);
    return false;
  }
}

// Initialize when page loads - handle both cases (DOM ready or already loaded)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await initGoogleTTS();
    initializeAnalysisPage();
  });
} else {
  // DOM is already loaded, run immediately
  (async () => {
    await initGoogleTTS();
    initializeAnalysisPage();
  })();
}

async function initializeGame(pgn) {
  try {
    console.log('Initializing game with PGN:', pgn.substring(0, 100) + '...');
    
    // Initialize Chess.js
    console.log('Creating Chess instance...');
    chess = new window.Chess();
    
    // Clean PGN - remove annotations but preserve structure
    let cleanPgn = pgn.trim();
    // Remove annotations in braces { } but keep move notation
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
    
    // Initialize board - wait for Chessboard to be available
    if (typeof window.Chessboard === 'undefined') {
      console.error('Chessboard not available. Available globals:', Object.keys(window).filter(k => k.toLowerCase().includes('chess')));
      throw new Error('Chessboard library not loaded');
    }
    
    // Verify jQuery is available before initializing Chessboard
    if (typeof window.$ === 'undefined' || typeof window.jQuery === 'undefined' || !window.$.fn) {
      console.error('jQuery check failed:', {
        $: typeof window.$,
        jQuery: typeof window.jQuery,
        $fn: typeof window.$?.fn
      });
      throw new Error('jQuery not available - Chessboard requires jQuery with $.fn');
    }
    
    console.log('Initializing chessboard...', {
      Chessboard: typeof window.Chessboard,
      $: typeof window.$,
      jQuery: typeof window.jQuery,
      $fn: typeof window.$.fn
    });
    
    // Wait a bit for DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const boardElement = document.getElementById('board');
    if (!boardElement) {
      throw new Error('Board element #board not found');
    }
    
    console.log('Board element found:', boardElement);
    
    try {
      // Use chessboard.js default pieces from jsDelivr (most reliable)
      // Use local PNG pieces from extension (custom naming: white-king.png, black-king.png)
      // Chessboard.js piece names: wK, wQ, wR, wB, wN, wP, bK, bQ, bR, bB, bN, bP
      // Map to: white-king.png, white-queen.png, etc.
      const pieceTheme = (piece) => {
        const pieceMap = {
          'wK': 'white-king',
          'wQ': 'white-queen',
          'wR': 'white-rook',
          'wB': 'white-bishop',
          'wN': 'white-knight',
          'wP': 'white-pawn',
          'bK': 'black-king',
          'bQ': 'black-queen',
          'bR': 'black-rook',
          'bB': 'black-bishop',
          'bN': 'black-knight',
          'bP': 'black-pawn'
        };
        const pieceName = pieceMap[piece] || piece;
        return `libs/pieces/${pieceName}.png`;
      };
      
      board = window.Chessboard('board', {
        position: 'start',
        draggable: true,
        pieceTheme: pieceTheme,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
      });
      
      console.log('Chessboard initialized with drag enabled:', pieceTheme);
      
      // Force refresh and verify pieces load
      setTimeout(() => {
        if (board) {
          board.position('start');
          const boardEl = document.getElementById('board');
          if (boardEl) {
            const pieceImages = boardEl.querySelectorAll('img');
            console.log('Piece images on board:', pieceImages.length);
            
            // Check each piece image for errors
            let loadedCount = 0;
            let errorCount = 0;
            pieceImages.forEach((img, i) => {
              img.onerror = () => {
                errorCount++;
                console.error(`Piece ${i} failed:`, img.src);
                if (errorCount === pieceImages.length) {
                  console.error('⚠️ ALL PIECES FAILED TO LOAD! Check CORS/CSP.');
                }
              };
              img.onload = () => {
                loadedCount++;
                if (loadedCount === pieceImages.length) {
                  console.log('✓ All pieces loaded successfully!');
                }
              };
            });
            
            if (pieceImages.length === 0) {
              console.error('⚠️ NO PIECES FOUND ON BOARD! Board may not be initialized.');
            } else {
              console.log(`Waiting for ${pieceImages.length} pieces to load...`);
            }
          }
        }
      }, 1000);
      
      console.log('Chessboard initialized successfully:', board);
      console.log('Board position:', board ? board.position() : 'null');
      
      // Verify board was created and has content
      if (!board) {
        throw new Error('Chessboard returned null');
      }
      
      // Force a refresh
      board.position('start');
      
      // Add resize handler to keep board properly sized
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (board) {
            board.resize();
            // Redraw arrows after resize
            if (currentMoveIndex >= 0 && moves[currentMoveIndex]) {
              highlightMove(moves[currentMoveIndex]);
            }
          }
        }, 150);
      });
      
    } catch (err) {
      console.error('Chessboard initialization error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        Chessboard: typeof window.Chessboard,
        $: typeof window.$,
        jQuery: typeof window.jQuery,
        $fn: typeof window.$?.fn
      });
      throw err;
    }

    // Initialize Stockfish
    console.log('Initializing Stockfish...');
    await initializeStockfish();
    
    // Display moves
    displayMoves();
    displayGameInfo(cleanPgn);
    
    // Analyze game
    console.log('Starting game analysis...');
    await analyzeGame();
    
    // Show game summary
    displayGameSummary();
    
  } catch (error) {
    console.error('Error initializing game:', error);
    document.body.innerHTML = `<div style="padding: 40px; text-align: center;"><h2>Error</h2><p>${error.message}</p></div>`;
  }
}

function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Wait a bit for DOM to be ready
  setTimeout(() => {
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const endBtn = document.getElementById('endBtn');
    const voiceToggle = document.getElementById('voiceToggle');
    
    if (playBtn) playBtn.addEventListener('click', playMoves);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseMoves);
    if (stopBtn) stopBtn.addEventListener('click', stopMoves);
    if (prevBtn) prevBtn.addEventListener('click', previousMove);
    if (nextBtn) nextBtn.addEventListener('click', nextMove);
    if (endBtn) endBtn.addEventListener('click', goToEnd);
    
    const flipBtn = document.getElementById('flipBtn');
    if (flipBtn) flipBtn.addEventListener('click', flipBoard);
    
    // Keyboard navigation for moves
    document.addEventListener('keydown', (e) => {
      // Don't trigger if typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          previousMove();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextMove();
          break;
        case 'ArrowUp':
          e.preventDefault();
          stopMoves(); // Go to start
          break;
        case 'ArrowDown':
          e.preventDefault();
          goToEnd(); // Go to end
          break;
        case ' ': // Spacebar
          e.preventDefault();
          if (isPlaying) {
            pauseMoves();
          } else {
            playMoves();
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          flipBoard();
          break;
      }
    });
    
    if (voiceToggle) {
      // Set initial state
      voiceEnabled = voiceToggle.checked;
      console.log('Voice toggle initial state:', voiceEnabled);
      
      voiceToggle.addEventListener('change', (e) => {
        voiceEnabled = e.target.checked;
        console.log('Voice toggled:', voiceEnabled);
      });
    } else {
      console.warn('Voice toggle element not found!');
    }
    
    // PGN modal handler
    const analyzePgnBtn = document.getElementById('analyzePgnBtn');
    const pgnInput = document.getElementById('pgnInput');
    const pgnModal = document.getElementById('pgnModal');
    const closePgnModal = document.getElementById('closePgnModal');
    
    console.log('PGN input elements:', {
      analyzePgnBtn: !!analyzePgnBtn,
      pgnInput: !!pgnInput,
      pgnModal: !!pgnModal
    });
    
    if (closePgnModal) {
      closePgnModal.addEventListener('click', () => {
        pgnModal.style.display = 'none';
      });
    }
    
    if (analyzePgnBtn && pgnInput) {
      console.log('Setting up PGN input handlers');
      analyzePgnBtn.addEventListener('click', async () => {
        const pgn = pgnInput.value.trim();
        if (!pgn) {
          alert('Please paste a PGN before analyzing.');
          return;
        }
        
        analyzePgnBtn.disabled = true;
        analyzePgnBtn.textContent = 'Analyzing...';
        
        try {
          // Reset game state
          resetGameState();
          
          // Initialize with pasted PGN
          await initializeGame(pgn);
          
          // Hide modal after successful analysis
          if (pgnModal) {
            pgnModal.style.display = 'none';
          }
        } catch (error) {
          console.error('Error analyzing PGN:', error);
          alert('Error analyzing PGN: ' + error.message);
        }
        
        analyzePgnBtn.disabled = false;
        analyzePgnBtn.textContent = 'Analyze Game';
      });
      
      // Allow Enter+Ctrl/Cmd to submit
      pgnInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          analyzePgnBtn.click();
        }
      });
    } else {
      console.warn('PGN input elements not found');
    }
  }, 200);
}

function goToEnd() {
  if (moves.length > 0) {
    goToMove(moves.length - 1);
  }
}

function resetGameState() {
  // Reset all game state variables
  chess = null;
  board = null;
  moves = [];
  currentMoveIndex = -1;
  analysisData = [];
  moveCommentary = [];
  keyMoments = [];
  gameSummary = null;
  isPlaying = false;
  
  // Clear UI
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
  
  // Clear moves list
  const movesList = document.getElementById('movesList');
  if (movesList) {
    movesList.innerHTML = '';
  }
  
  // Clear game info (but keep PGN input section)
  const gameInfo = document.getElementById('gameInfo');
  if (gameInfo) {
    gameInfo.innerHTML = '';
  }
  
  // Reset evaluation
  updateEvaluation(0);
}

async function initializeStockfish() {
  return new Promise((resolve) => {
    try {
      // Load Stockfish as a Web Worker (use relative path for web deployment)
      const stockfishUrl = 'libs/stockfish.js';
      console.log('🔧 Loading Stockfish from:', stockfishUrl);
      stockfish = new Worker(stockfishUrl);
      
      let ready = false;
      let messageCount = 0;
      
      stockfish.onmessage = (event) => {
        const message = event.data || event;
        messageCount++;
        
        if (typeof message === 'string') {
          // Log first few messages and important ones for debugging
          if (messageCount <= 5 || message.includes('id name') || message.includes('uciok') || message.includes('readyok')) {
            console.log('♟️ Stockfish init msg:', message.substring(0, 100));
          }
          
          if (message.includes('uciok')) {
            console.log('✅ Stockfish UCI ready');
            stockfish.postMessage('isready');
          } else if (message.includes('readyok') && !ready) {
            ready = true;
            console.log('✅ Stockfish engine ready! Received', messageCount, 'messages');
            updateAnalysisStatus('Stockfish ready');
            
            // Quick test to verify Stockfish is actually analyzing
            console.log('🧪 Testing Stockfish with starting position...');
            stockfish.postMessage('position startpos');
            stockfish.postMessage('go depth 5');
            resolve();
          } else if (message.startsWith('info') && message.includes('score cp')) {
            console.log('📊 Stockfish test eval:', message.substring(0, 80));
          } else if (message.startsWith('bestmove')) {
            console.log('✅ Stockfish test complete:', message);
          }
        }
      };
      
      stockfish.onerror = (error) => {
        console.error('❌ Stockfish worker error:', error);
        updateAnalysisStatus('Engine error');
        stockfish = null;
        resolve();
      };
      
      console.log('📤 Sending uci command to Stockfish...');
      stockfish.postMessage('uci');
      
      // Timeout fallback
      setTimeout(() => {
        if (!ready) {
          console.warn('⚠️ Stockfish initialization timeout after', messageCount, 'messages');
          if (messageCount === 0) {
            console.error('❌ No messages received from Stockfish - worker may have failed to load');
            stockfish = null;
          }
          updateAnalysisStatus('Engine timeout - using fallback');
          resolve();
        }
      }, 5000);
    } catch (e) {
      console.error('❌ Could not initialize Stockfish:', e);
      updateAnalysisStatus('Engine not available');
      stockfish = null;
      resolve();
    }
  });
}

function updateAnalysisStatus(status) {
  const analysisText = document.getElementById('analysisText');
  if (analysisText) {
    analysisText.textContent = status;
  }
  
  // Update SF badge state
  const sfBadge = document.getElementById('sfBadge');
  if (sfBadge) {
    if (status.includes('analyzing') || status.includes('Analyzing')) {
      sfBadge.classList.add('active');
    } else {
      sfBadge.classList.remove('active');
    }
    
    // Show/hide based on Stockfish availability
    sfBadge.style.display = stockfish ? 'block' : 'none';
  }
}

function displayMoves() {
  const movesList = document.getElementById('movesList');
  if (!movesList) return;
  movesList.innerHTML = '';

  // Compact grid: move number | white move | black move
  for (let i = 0; i < moves.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    
    // Move number
    const numCell = document.createElement('div');
    numCell.className = 'move-num';
    numCell.textContent = `${moveNumber}.`;
    movesList.appendChild(numCell);
    
    // White's move
    const whiteMove = moves[i];
    const whiteCell = document.createElement('div');
    whiteCell.className = 'move-cell white-move';
    whiteCell.dataset.moveIndex = i;
    whiteCell.id = `move-${i}`;
    whiteCell.innerHTML = `<span class="piece-dot white-dot"></span><span class="move-san">${whiteMove.san}</span><span class="move-icon"></span>`;
    whiteCell.addEventListener('click', () => goToMove(i));
    movesList.appendChild(whiteCell);
    
    // Black's move (if exists)
    if (i + 1 < moves.length) {
      const blackMove = moves[i + 1];
      const blackCell = document.createElement('div');
      blackCell.className = 'move-cell black-move';
      blackCell.dataset.moveIndex = i + 1;
      blackCell.id = `move-${i + 1}`;
      blackCell.innerHTML = `<span class="piece-dot black-dot"></span><span class="move-san">${blackMove.san}</span><span class="move-icon"></span>`;
      blackCell.addEventListener('click', () => goToMove(i + 1));
      movesList.appendChild(blackCell);
    } else {
      // Empty cell for alignment
      const emptyCell = document.createElement('div');
      emptyCell.className = 'move-cell empty';
      movesList.appendChild(emptyCell);
    }
  }
}

async function analyzeGame() {
  if (!stockfish) {
    console.log('❌ Stockfish not available, skipping detailed analysis');
    updateAnalysisStatus('Stockfish engine not loaded - analysis unavailable');
    // Still show basic info
    for (let i = 0; i < moves.length; i++) {
      analysisData[i] = { cp: 0, depth: 0, bestMove: null };
      moveCommentary[i] = 'Analysis unavailable';
    }
    // Hide key moments loading
    const keyMomentsList = document.getElementById('keyMomentsList');
    if (keyMomentsList) {
      keyMomentsList.innerHTML = '<div class="loading-moments">⚠️ Stockfish engine not available</div>';
    }
    return;
  }
  
  console.log('🚀 Starting Stockfish analysis of', moves.length, 'moves');
  
  const ChessClass = window.Chess;
  const tempChess = new ChessClass();
  
  // Show loading indicator
  const movesList = document.getElementById('movesList');
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'analysis-loading';
  loadingDiv.style.cssText = 'padding: 20px; text-align: center; color: var(--accent-orange);';
  loadingDiv.textContent = 'Analyzing game... This may take a minute.';
  movesList.parentElement.insertBefore(loadingDiv, movesList);
  
  let totalMistakes = 0;
  let totalBlunders = 0;
  let totalInaccuracies = 0;
  let openingPhase = true;
  let openingMoves = 0;
  
  // Reset key moments
  keyMoments = [];
  let prevEvalForMoments = 0;
  
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    
    // CRITICAL: Analyze position BEFORE making the move
    // This gives us the best move for the player whose turn it is
    const positionBeforeMove = tempChess.fen();
    const evaluationBefore = await getPositionEvaluation(positionBeforeMove, i);
    
    // Now make the move
    tempChess.move(move);
    
    // Get quick evaluation after the move to see how position changed
    // We only need the eval, not the best move (since it's opponent's turn now)
    const positionAfterMove = tempChess.fen();
    const evaluationAfter = await getPositionEvaluation(positionAfterMove, i, true); // quickEval = true
    
    // Convert best move from UCI to SAN format for comparison
    let bestMoveSAN = null;
    if (evaluationBefore.bestMove) {
      try {
        // Create a temporary chess instance to convert UCI to SAN
        const tempChessForConversion = new window.Chess(positionBeforeMove);
        const uciMove = evaluationBefore.bestMove;
        // UCI format: "e2e4" or "e7e8q" (with promotion)
        if (uciMove.length >= 4) {
          const from = uciMove.substring(0, 2);
          const to = uciMove.substring(2, 4);
          const promotion = uciMove.length > 4 ? uciMove[4] : null;
          
          const moveObj = tempChessForConversion.move({
            from: from,
            to: to,
            promotion: promotion || undefined
          });
          
          if (moveObj) {
            bestMoveSAN = moveObj.san;
          }
        }
      } catch (e) {
        console.warn('Could not convert best move to SAN:', e);
        bestMoveSAN = evaluationBefore.bestMove; // Fallback to UCI
      }
    }
    
    // Combine: bestMove from before (converted to SAN), eval from after
    const evaluation = {
      ...evaluationAfter,
      bestMove: bestMoveSAN, // Best move for the player who just moved (in SAN format)
      cp: evaluationAfter.cp, // Position evaluation after the move
      mate: evaluationAfter.mate,
      depth: Math.max(evaluationBefore.depth, evaluationAfter.depth),
      pv: evaluationBefore.pv,
      annotation: '',
      moveIndex: i
    };
    
    // Update progress
    const progress = Math.round(((i + 1) / moves.length) * 100);
    updateAnalysisStatus(`🔬 Stockfish analyzing: ${i + 1}/${moves.length} (${progress}%)`);
    
    // Store evaluation
    analysisData[i] = evaluation;
    
    // Generate commentary for this move
    const commentary = generateMoveCommentary(i, move, evaluation, tempChess);
    moveCommentary[i] = commentary;
    
    // Update annotation and commentary display
    updateMoveAnnotation(i, evaluation);
    updateMoveCommentary(i, commentary);
    
    // Track key moments - significant eval swings
    const currentCp = evaluation.cp || 0;
    const evalSwing = Math.abs(currentCp - prevEvalForMoments);
    const isWhiteMove = i % 2 === 0;
    const player = isWhiteMove ? 'White' : 'Black';
    
    // Detect key moments
    if (evaluation.annotation === '!!') {
      // Blunder
      keyMoments.push({
        moveIndex: i,
        type: 'blunder',
        move: move.san,
        player: player,
        evalBefore: prevEvalForMoments,
        evalAfter: currentCp,
        bestMove: evaluation.bestMove,
        description: `${player} blunders with ${move.san}. ${evaluation.bestMove ? `${evaluation.bestMove} was much better.` : ''}`
      });
    } else if (evaluation.annotation === '!' && evalSwing > 100) {
      // Mistake
      keyMoments.push({
        moveIndex: i,
        type: 'mistake',
        move: move.san,
        player: player,
        evalBefore: prevEvalForMoments,
        evalAfter: currentCp,
        bestMove: evaluation.bestMove,
        description: `${player} makes a mistake with ${move.san} that changes the game.`
      });
    } else if (evalSwing > 200 && i > 0) {
      // Major turning point
      const direction = currentCp > prevEvalForMoments ? 'White' : 'Black';
      keyMoments.push({
        moveIndex: i,
        type: 'turning-point',
        move: move.san,
        player: player,
        evalBefore: prevEvalForMoments,
        evalAfter: currentCp,
        description: `Turning point! After ${move.san}, ${direction} gains a significant advantage.`
      });
    } else if (evaluation.annotation === '!' && evalSwing < 50) {
      // Brilliant/excellent move
      keyMoments.push({
        moveIndex: i,
        type: 'brilliant',
        move: move.san,
        player: player,
        evalBefore: prevEvalForMoments,
        evalAfter: currentCp,
        description: `Excellent move by ${player}! ${move.san} is the engine's top choice.`
      });
    }
    
    prevEvalForMoments = currentCp;
    
    // Track game phases
    if (i < 20) {
      openingMoves++;
    }
    
    // Count mistakes/blunders
    if (evaluation.annotation === '!!') {
      totalBlunders++;
    } else if (evaluation.annotation === '!') {
      totalMistakes++;
    } else if (evaluation.annotation === '?!') {
      totalInaccuracies++;
    }
    
    // Update progress
    if (i % 5 === 0) {
      loadingDiv.textContent = `Analyzing move ${i + 1} of ${moves.length}...`;
    }
  }
  
  // Generate game summary
  gameSummary = generateGameSummary(totalMistakes, totalBlunders, totalInaccuracies, openingMoves);
  
  // Display key moments
  displayKeyMoments();
  
  // Remove loading indicator
  loadingDiv.remove();
  
  console.log('✅ Stockfish analysis complete!', {
    moves: moves.length,
    blunders: totalBlunders,
    mistakes: totalMistakes,
    inaccuracies: totalInaccuracies,
    keyMoments: keyMoments.length
  });
  updateAnalysisStatus('Analysis complete - click Play or use arrows');
}

function displayKeyMoments() {
  const keyMomentsList = document.getElementById('keyMomentsList');
  if (!keyMomentsList) return;
  
  keyMomentsList.innerHTML = '';
  
  if (keyMoments.length === 0) {
    keyMomentsList.innerHTML = '<div class="moments-placeholder">No major turning points. Solid game!</div>';
    return;
  }
  
  // Sort by move order for horizontal scroll
  const sortedMoments = [...keyMoments].sort((a, b) => a.moveIndex - b.moveIndex);
  
  // Show all moments as chips
  sortedMoments.forEach(moment => {
    const chip = document.createElement('div');
    chip.className = `moment-chip ${moment.type}`;
    chip.dataset.moveIndex = moment.moveIndex;
    
    const icon = getKeyMomentIcon(moment.type);
    const moveNum = Math.floor(moment.moveIndex / 2) + 1;
    
    chip.innerHTML = `
      <span class="chip-icon">${icon}</span>
      <span class="chip-move">${moveNum}. ${moment.move}</span>
    `;
    
    chip.addEventListener('click', () => {
      goToMove(moment.moveIndex);
    });
    
    keyMomentsList.appendChild(chip);
  });
}

function getKeyMomentIcon(type) {
  switch(type) {
    case 'blunder': return '💥';
    case 'mistake': return '⚠️';
    case 'turning-point': return '🔄';
    case 'brilliant': return '✨';
    default: return '📍';
  }
}

function getKeyMomentLabel(type) {
  switch(type) {
    case 'blunder': return 'Blunder';
    case 'mistake': return 'Mistake';
    case 'turning-point': return 'Turning Point';
    case 'brilliant': return 'Brilliant';
    default: return 'Key Move';
  }
}

async function getPositionEvaluation(fen, moveIndex, quickEval = false) {
  if (!stockfish) {
    console.warn('⚠️ Stockfish not available for evaluation');
    return { cp: 0, depth: 0, bestMove: null, annotation: '', moveIndex: moveIndex };
  }

  return new Promise((resolve) => {
    let bestMove = null;
    let evaluation = null;
    let depth = 0;
    let bestDepth = 0;
    let pv = [];
    let resolved = false;
    
    // For quick eval, we don't need best move or high depth
    const targetDepth = quickEval ? 8 : 15;
    
    const finishAnalysis = (reason) => {
      if (resolved) return;
      resolved = true;
      
      const result = { 
        cp: evaluation?.cp || 0,
        mate: evaluation?.mate,
        depth: bestDepth, 
        bestMove: bestMove,
        pv: pv,
        annotation: '',
        moveIndex: moveIndex
      };
      
      // Compare with previous move to determine annotation
      if (moveIndex > 0 && analysisData[moveIndex - 1]) {
        result.annotation = determineAnnotation(analysisData[moveIndex - 1], result, moveIndex);
      }
      
      console.log(`📊 Move ${moveIndex + 1} (${reason}): eval=${result.cp !== undefined ? (result.cp / 100).toFixed(2) : 'M' + result.mate} depth=${bestDepth} best=${bestMove || 'none'}`);
      resolve(result);
    };
    
    const timeout = setTimeout(() => {
      finishAnalysis('timeout');
    }, 3000); // 3 second timeout per position
    
    // Create message handler for this analysis
    const handler = (event) => {
      const message = event.data || event;
      
      if (typeof message === 'string') {
        // Debug: log info messages
        if (message.startsWith('info') && message.includes('score')) {
          // Parse evaluation from info string
          const evalMatch = message.match(/score (cp|mate) (-?\d+)/);
          const depthMatch = message.match(/depth (\d+)/);
          const pvMatch = message.match(/ pv (.+)/);
          
          if (depthMatch) {
            depth = parseInt(depthMatch[1]);
            if (depth > bestDepth) bestDepth = depth;
          }
          
          if (evalMatch) {
            const score = parseInt(evalMatch[2]);
            evaluation = evalMatch[1] === 'mate' ? { mate: score } : { cp: score };
          }
          
          if (pvMatch && !quickEval) {
            // Only extract best move if we're doing full analysis
            // Split PV and filter out move numbers and game results
            pv = pvMatch[1].split(' ').filter(move => {
              if (/^\d+\.?$/.test(move)) return false;
              if (['1-0', '0-1', '1/2-1/2', '*'].includes(move)) return false;
              return move.length >= 2;
            });
            // Get first valid move as best move
            if (pv.length > 0) {
              bestMove = pv[0];
            }
          }
          
          // Stop when we have enough depth
          const requiredDepth = quickEval ? 6 : 12;
          if (depth >= requiredDepth && evaluation) {
            clearTimeout(timeout);
            finishAnalysis('depth reached');
          }
        } else if (message.startsWith('bestmove')) {
          // Engine finished analyzing
          if (!quickEval) {
            // Only extract best move if we're doing full analysis
            const bestMoveMatch = message.match(/bestmove (\S+)/);
            if (bestMoveMatch && !bestMove) {
              bestMove = bestMoveMatch[1];
            }
          }
          clearTimeout(timeout);
          finishAnalysis('bestmove');
        }
      }
    };
    
    // Set the handler
    stockfish.onmessage = handler;
    
    // Stop any previous analysis and start new one
    stockfish.postMessage('stop');
    stockfish.postMessage(`position fen ${fen}`);
    stockfish.postMessage(`go depth ${targetDepth}`);
    
    if (moveIndex % 10 === 0 || moveIndex === 0) {
      console.log(`🔍 Analyzing position ${moveIndex + 1}: ${fen.split(' ')[0].substring(0, 30)}...`);
    }
  });
}

function determineAnnotation(prevEval, currEval, moveIndex) {
  const prevCp = prevEval.cp || (prevEval.mate ? (prevEval.mate > 0 ? 1000 : -1000) : 0);
  const currCp = currEval.cp || (currEval.mate ? (currEval.mate > 0 ? 1000 : -1000) : 0);
  
  // Calculate evaluation change from the player's perspective
  // If it's white's move, positive cp is good, negative is bad
  // If it's black's move, negative cp is good, positive is bad
  const isWhiteMove = moveIndex % 2 === 0;
  
  // From the player's perspective: did their position get worse?
  // For white: if cp goes down, that's bad
  // For black: if cp goes up (less negative), that's bad
  const evalDiff = isWhiteMove ? (prevCp - currCp) : (currCp - prevCp);
  const absDiff = Math.abs(evalDiff);
  
  if (absDiff > 300) {
    return '!!'; // Blunder - lost significant advantage
  } else if (absDiff > 150) {
    return '!'; // Mistake - lost advantage
  } else if (absDiff > 75) {
    return '?!'; // Inaccuracy - small loss
  } else if (absDiff < 30 && evalDiff < -50) {
    return '!'; // Best move - gained advantage
  }
  return ''; // Good move
}

function generateMoveCommentary(moveIndex, move, evaluation, chessInstance) {
  if (!evaluation || evaluation.cp === undefined) {
    return 'Analyzing position...';
  }
  
  const moveNumber = Math.floor(moveIndex / 2) + 1;
  const isWhite = moveIndex % 2 === 0;
  const player = isWhite ? 'White' : 'Black';
  const prevEval = moveIndex > 0 ? analysisData[moveIndex - 1] : null;
  
  let commentary = '';
  
  // Calculate eval change
  const currentCp = evaluation.cp || 0;
  const prevCp = prevEval ? (prevEval.cp || 0) : 0;
  const evalChange = currentCp - prevCp;
  const evalLoss = isWhite ? -evalChange : evalChange; // Positive = player lost advantage
  
  // Get piece name for better readability
  const getPieceName = (p) => {
    const names = { 'p': 'pawn', 'n': 'knight', 'b': 'bishop', 'r': 'rook', 'q': 'queen', 'k': 'king' };
    return names[p.toLowerCase()] || p;
  };
  
  // Opening phase commentary
  if (moveIndex < 10) {
    if (moveIndex === 0) {
      commentary = `${player} opens with ${move.san}. `;
    } else if (moveIndex < 6) {
      const pieceName = getPieceName(move.piece);
      if (move.piece === 'p') {
        commentary = `${player} plays ${move.san}, advancing a pawn to control the center. `;
      } else {
        commentary = `${player} plays ${move.san}, developing the ${pieceName} to an active square. `;
      }
    }
  }
  
  // Tactical commentary first
  if (move.san.includes('#')) {
    return `Checkmate! ${player} delivers the final blow with ${move.san}. Game over!`;
  }
  
  if (move.captured) {
    const capturedPiece = getPieceName(move.captured);
    commentary += `${player} captures the ${capturedPiece} on ${move.to}. `;
  }
  
  if (move.san.includes('+')) {
    commentary += `${player} delivers check! `;
  }
  
  // Castling
  if (move.san === 'O-O' || move.san === 'O-O-O') {
    const side = move.san === 'O-O' ? 'kingside' : 'queenside';
    commentary += `${player} castles ${side}, securing the king and connecting the rooks. `;
  }
  
  // Analyze the move quality with detailed feedback
  const bestMove = evaluation.bestMove;
  const hasBetterMove = bestMove && 
    typeof bestMove === 'string' && 
    bestMove !== move.san &&
    !/^\d+\.?$/.test(bestMove) &&
    !['1-0', '0-1', '1/2-1/2', '*'].includes(bestMove);
  
  if (evaluation.annotation === '!!') {
    // Blunder - use beginner-friendly language
    commentary += `Oops! This is a blunder - a serious mistake that really hurts the position. `;
    if (hasBetterMove) {
      commentary += `${bestMove} would have been much better here. `;
      commentary += explainBestMoveDetailed(bestMove, move, evaluation, prevEval);
    }
  } else if (evaluation.annotation === '!') {
    // Could be mistake or best move depending on context
    if (evalLoss > 100) {
      commentary += `This is a mistake that gives the opponent an advantage. `;
      if (hasBetterMove) {
        commentary += `${bestMove} was the stronger choice. `;
        commentary += explainBestMoveDetailed(bestMove, move, evaluation, prevEval);
      }
    } else {
      commentary += `Nice move! ${player} finds an excellent continuation. `;
    }
  } else if (evaluation.annotation === '?!') {
    // Inaccuracy - beginner-friendly
    commentary += `This move is okay, but not the best. `;
    if (hasBetterMove) {
      commentary += `${bestMove} would have been more precise. `;
      commentary += explainBestMoveDetailed(bestMove, move, evaluation, prevEval);
    }
  } else if (hasBetterMove && Math.abs(evalLoss) > 30) {
    // Slight inaccuracy that doesn't trigger annotation
    commentary += `A reasonable move. ${bestMove} was slightly better. `;
  }
  
  // Position assessment - beginner-friendly language
  const cp = evaluation.cp || 0;
  if (Math.abs(cp) > 500) {
    const leading = cp > 0 ? 'White' : 'Black';
    commentary += `${leading} is completely winning here. `;
  } else if (Math.abs(cp) > 300) {
    const leading = cp > 0 ? 'White' : 'Black';
    commentary += `${leading} has a big advantage. `;
  } else if (Math.abs(cp) > 150) {
    const leading = cp > 0 ? 'White' : 'Black';
    commentary += `${leading} is doing better. `;
  } else if (Math.abs(cp) < 50) {
    commentary += `The game is pretty even. `;
  }
  
  return commentary.trim() || `${player} plays ${move.san}.`;
}

function explainBestMoveDetailed(bestMove, playedMove, evaluation, prevEval) {
  if (!bestMove || typeof bestMove !== 'string') return '';
  
  let explanation = '';
  
  // Check what type of move the best move was
  if (bestMove.includes('x')) {
    // Best move was a capture
    const targetSquare = bestMove.match(/x([a-h][1-8])/);
    if (targetSquare) {
      explanation += `Capturing on ${targetSquare[1]} would have won material or created a strong threat. `;
    } else {
      explanation += `The capture would have won material. `;
    }
  } else if (bestMove.includes('+')) {
    // Best move gave check
    explanation += `Giving check with ${bestMove} would have maintained pressure and tempo. `;
  } else if (bestMove.startsWith('N') || bestMove.startsWith('B')) {
    // Knight or bishop move
    const piece = bestMove.startsWith('N') ? 'knight' : 'bishop';
    explanation += `Developing the ${piece} to a more active square would have improved piece coordination. `;
  } else if (bestMove === 'O-O' || bestMove === 'O-O-O') {
    explanation += `Castling would have improved king safety. `;
  } else if (bestMove.match(/^[a-h]/)) {
    // Pawn move
    explanation += `The pawn move would have improved pawn structure or created threats. `;
  }
  
  return explanation;
}


function generateGameSummary(mistakes, blunders, inaccuracies, openingMoves) {
  const totalErrors = mistakes + blunders + inaccuracies;
  
  let summary = '';
  
  // Game length context
  if (moves.length < 30) {
    summary += `This was a quick ${moves.length} move game. `;
  } else if (moves.length > 60) {
    summary += `This was a long battle with ${moves.length} moves. `;
  } else {
    summary += `This ${moves.length} move game had some interesting moments. `;
  }
  
  // Error summary - beginner friendly
  if (totalErrors === 0) {
    summary += 'Both players made solid moves throughout! ';
  } else if (blunders > 0) {
    summary += `There ${blunders === 1 ? 'was' : 'were'} ${blunders} big mistake${blunders > 1 ? 's' : ''} that really mattered. `;
  } else if (mistakes > 0) {
    summary += `There ${mistakes === 1 ? 'was' : 'were'} ${mistakes} mistake${mistakes > 1 ? 's' : ''} to learn from. `;
  } else if (inaccuracies > 0) {
    summary += `Just ${inaccuracies} small inaccurac${inaccuracies === 1 ? 'y' : 'ies'} - pretty clean play! `;
  }
  
  // Encouragement
  if (totalErrors <= 3) {
    summary += "Great game! ";
  } else if (blunders <= 1) {
    summary += "Good effort! ";
  }
  
  return summary;
}

function updateMoveAnnotation(moveIndex, evaluation) {
  const moveCell = document.getElementById(`move-${moveIndex}`);
  if (!moveCell || !evaluation) return;
  
  // Add annotation class to the cell
  moveCell.classList.remove('blunder', 'mistake', 'inaccuracy', 'best', 'brilliant');
  
  const iconEl = moveCell.querySelector('.move-icon');
  
  if (evaluation.annotation === '!!') {
    moveCell.classList.add('blunder');
    if (iconEl) iconEl.textContent = '??';
  } else if (evaluation.annotation === '!') {
    // Could be mistake or best move
    const prevEval = moveIndex > 0 ? analysisData[moveIndex - 1] : null;
    const evalChange = prevEval ? Math.abs((evaluation.cp || 0) - (prevEval.cp || 0)) : 0;
    if (evalChange > 100) {
      moveCell.classList.add('mistake');
      if (iconEl) iconEl.textContent = '?';
    } else {
      moveCell.classList.add('best');
      if (iconEl) iconEl.textContent = '!';
    }
  } else if (evaluation.annotation === '?!') {
    moveCell.classList.add('inaccuracy');
    if (iconEl) iconEl.textContent = '?!';
  }
}

function getAnnotationClass(annotation) {
  if (annotation === '!!') return 'blunder';
  if (annotation === '!') return 'best';
  if (annotation === '?!') return 'inaccuracy';
  return 'good';
}

function getAnnotationTitle(annotation) {
  if (annotation === '!!') return 'Blunder';
  if (annotation === '!') return 'Best move / Mistake';
  if (annotation === '?!') return 'Inaccuracy';
  return '';
}

function updateMoveCommentary(moveIndex, commentary) {
  // Commentary is now shown in the analysis panel instead
  // This function is kept for compatibility but does nothing
}

function displayGameSummary() {
  console.log('Game summary:', gameSummary);
  
  // Show summary in the move analysis panel when at start
  if (gameSummary && currentMoveIndex === -1) {
    const analysisMove = document.getElementById('analysisMove');
    const analysisText = document.getElementById('analysisText');
    const analysisIcon = document.getElementById('analysisIcon');
    
    if (analysisMove) analysisMove.textContent = '📊 Game Overview';
    if (analysisText) analysisText.textContent = gameSummary;
    if (analysisIcon) analysisIcon.textContent = '📋';
  }
}

function displayGameInfo(pgn) {
  const lines = pgn.split('\n');
  
  // Parse PGN headers into an object
  const headers = {};
  lines.forEach(line => {
    const match = line.match(/\[(\w+)\s+"([^"]*)"\]/);
    if (match) {
      headers[match[1]] = match[2];
    }
  });
  
  // Display player info
  displayPlayerInfo(headers);
  
  // Display game meta
  displayGameMeta(headers);
}

function displayPlayerInfo(headers) {
  const whiteEl = document.getElementById('playerWhite');
  const blackEl = document.getElementById('playerBlack');
  
  if (whiteEl) {
    const nameEl = whiteEl.querySelector('.player-name');
    const ratingEl = whiteEl.querySelector('.player-rating');
    
    if (nameEl) {
      nameEl.textContent = headers.White || 'White';
    }
    if (ratingEl) {
      const rating = headers.WhiteElo || '';
      ratingEl.textContent = rating ? `(${rating})` : '';
    }
  }
  
  if (blackEl) {
    const nameEl = blackEl.querySelector('.player-name');
    const ratingEl = blackEl.querySelector('.player-rating');
    
    if (nameEl) {
      nameEl.textContent = headers.Black || 'Black';
    }
    if (ratingEl) {
      const rating = headers.BlackElo || '';
      ratingEl.textContent = rating ? `(${rating})` : '';
    }
  }
}

function displayGameMeta(headers) {
  const metaEl = document.getElementById('gameMeta');
  if (!metaEl) return;
  
  let metaInfo = [];
  
  // Event type
  if (headers.Event) {
    metaInfo.push(headers.Event);
  }
  
  // Time control
  if (headers.TimeControl) {
    const tc = headers.TimeControl;
    if (tc.includes('+')) {
      const [base, inc] = tc.split('+');
      const baseMin = Math.floor(parseInt(base) / 60);
      metaInfo.push(`${baseMin}+${inc}`);
    } else if (!isNaN(tc)) {
      const baseMin = Math.floor(parseInt(tc) / 60);
      metaInfo.push(`${baseMin} min`);
    }
  }
  
  // Date
  if (headers.Date) {
    metaInfo.push(headers.Date.replace(/\./g, '-'));
  }
  
  // Result
  if (headers.Result && headers.Result !== '*') {
    metaInfo.push(headers.Result);
  }
  
  metaEl.textContent = metaInfo.join(' • ');
}

function resetToStart() {
  currentMoveIndex = -1;
  chess.reset();
  board.position('start');
  updateMoveHighlight();
  clearMoveHighlights();
  updateEvaluation(0);
}

function goToMove(index) {
  if (index < -1 || index >= moves.length) return;
  
  // Reset exploration mode
  isExploringLine = false;
  
  currentMoveIndex = index;
  chess.reset();
  
  for (let i = 0; i <= index; i++) {
    chess.move(moves[i]);
  }
  
  const position = chess.fen();
  board.position(position);
  
  updateMoveHighlight();
  
  // Highlight the move on the board
  if (index >= 0) {
    highlightMove(moves[index]);
  } else {
    clearMoveHighlights();
  }
  
  // Update evaluation bar based on current position
  if (index >= 0 && analysisData[index]) {
    const eval = analysisData[index];
    const cp = eval.cp || 0;
    // Use the evaluation after this move (which is stored in analysisData[index])
    updateEvaluation(cp, true);
    console.log(`📊 Move ${index + 1}: Updating eval bar to ${cp}cp (${(cp/100).toFixed(1)})`);
  } else if (index === -1) {
    // Starting position - equal
    updateEvaluation(0, false);
  } else {
    // Move not analyzed yet
    updateEvaluation(0, false);
  }
  
  // Speak the move
  if (voiceEnabled && synth) {
    speakMoveWithAnalysis(index);
  }
}

function highlightMove(move) {
  clearMoveHighlights();
  
  if (!move || !move.from || !move.to) return;
  
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  
  // Add highlight classes to squares
  const fromSquare = boardEl.querySelector(`[data-square="${move.from}"]`);
  const toSquare = boardEl.querySelector(`[data-square="${move.to}"]`);
  
  if (fromSquare) {
    fromSquare.classList.add('highlight-from');
  }
  if (toSquare) {
    toSquare.classList.add('highlight-to');
  }
  
  // Draw played move arrow
  drawMoveArrow(move.from, move.to, 'played');
  
  // Draw best move arrow if there was a better move
  if (currentMoveIndex >= 0 && analysisData[currentMoveIndex]) {
    const analysis = analysisData[currentMoveIndex];
    const bestMove = analysis.bestMove;
    const annotation = analysis.annotation;
    
    // Show best move arrow if this wasn't the best move
    if (bestMove && typeof bestMove === 'string' && bestMove.length >= 4) {
      // Check if the played move matches the best move
      const bestFrom = bestMove.substring(0, 2);
      const bestTo = bestMove.substring(2, 4);
      
      // Only draw if different from played move
      if (bestFrom !== move.from || bestTo !== move.to) {
        // Draw best move arrow - more prominent for mistakes/blunders
        drawBestMoveArrow(bestMove, annotation);
      }
    }
  }
}

function clearMoveHighlights() {
  // Remove highlight classes
  document.querySelectorAll('.highlight-from, .highlight-to').forEach(el => {
    el.classList.remove('highlight-from', 'highlight-to');
  });
  
  // Clear arrows
  const arrowsSvg = document.getElementById('moveArrows');
  if (arrowsSvg) {
    arrowsSvg.innerHTML = '';
  }
}

function drawMoveArrow(from, to, type = 'played') {
  const arrowsSvg = document.getElementById('moveArrows');
  const boardEl = document.getElementById('board');
  
  if (!arrowsSvg || !boardEl) return;
  
  // Get board dimensions
  const boardRect = boardEl.getBoundingClientRect();
  const squareSize = boardRect.width / 8;
  
  // Convert square names to coordinates
  const fromCoords = squareToCoords(from, squareSize);
  const toCoords = squareToCoords(to, squareSize);
  
  if (!fromCoords || !toCoords) return;
  
  // Shorten arrow to not cover pieces
  const dx = toCoords.x - fromCoords.x;
  const dy = toCoords.y - fromCoords.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const shortenBy = squareSize * 0.35;
  
  const startX = fromCoords.x + (dx / len) * shortenBy;
  const startY = fromCoords.y + (dy / len) * shortenBy;
  const endX = toCoords.x - (dx / len) * shortenBy;
  const endY = toCoords.y - (dy / len) * shortenBy;
  
  // Create arrow line
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', startX);
  line.setAttribute('y1', startY);
  line.setAttribute('x2', endX);
  line.setAttribute('y2', endY);
  line.classList.add('arrow-line', `arrow-${type}`);
  
  // Create arrow head
  const headSize = squareSize * (type === 'best' ? 0.3 : 0.25);
  const angle = Math.atan2(dy, dx);
  const headPoints = [
    [endX, endY],
    [endX - headSize * Math.cos(angle - Math.PI / 6), endY - headSize * Math.sin(angle - Math.PI / 6)],
    [endX - headSize * Math.cos(angle + Math.PI / 6), endY - headSize * Math.sin(angle + Math.PI / 6)]
  ];
  
  const head = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  head.setAttribute('points', headPoints.map(p => p.join(',')).join(' '));
  head.classList.add('arrow-head', `arrow-${type}`);
  
  arrowsSvg.appendChild(line);
  arrowsSvg.appendChild(head);
}

// Draw the best move arrow (green, for what should have been played)
function drawBestMoveArrow(bestMoveUCI, annotation) {
  if (!bestMoveUCI || typeof bestMoveUCI !== 'string') return;
  
  // UCI format: e2e4, e7e8q (with promotion)
  // Need at least 4 characters
  if (bestMoveUCI.length < 4) return;
  
  const from = bestMoveUCI.substring(0, 2);
  const to = bestMoveUCI.substring(2, 4);
  
  // Validate squares
  if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) return;
  
  // Determine arrow type based on annotation
  let arrowType = 'best';
  if (annotation === '!!' || annotation === '!') {
    arrowType = 'best-critical'; // More prominent for blunders/mistakes
  }
  
  drawMoveArrow(from, to, arrowType);
}

function squareToCoords(square, squareSize) {
  if (!square || square.length !== 2) return null;
  
  const file = square.charCodeAt(0) - 97; // 'a' = 0, 'h' = 7
  const rank = parseInt(square[1]) - 1; // '1' = 0, '8' = 7
  
  // Adjust for board orientation
  let x, y;
  if (boardOrientation === 'black') {
    x = (7 - file + 0.5) * squareSize;
    y = (rank + 0.5) * squareSize;
  } else {
    x = (file + 0.5) * squareSize;
    y = (7 - rank + 0.5) * squareSize;
  }
  
  return { x, y };
}

function updateMoveHighlight() {
  // Remove active from all move cells
  document.querySelectorAll('.move-cell').forEach(item => {
    item.classList.remove('active');
  });
  
  if (currentMoveIndex >= 0) {
    const activeCell = document.getElementById(`move-${currentMoveIndex}`);
    if (activeCell) {
      activeCell.classList.add('active');
      activeCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Update the move analysis panel
    updateMoveAnalysisPanel(currentMoveIndex);
  } else {
    // Reset analysis panel
    resetMoveAnalysisPanel();
  }
}

function updateMoveAnalysisPanel(moveIndex) {
  const move = moves[moveIndex];
  const analysis = analysisData[moveIndex];
  const commentary = moveCommentary[moveIndex];
  
  const iconEl = document.getElementById('analysisIcon');
  const moveEl = document.getElementById('analysisMove');
  const textEl = document.getElementById('analysisText');
  const evalEl = document.getElementById('analysisEval');
  const hintEl = document.getElementById('bestMoveHint');
  const hintMoveEl = document.getElementById('hintMove');
  
  if (!iconEl || !moveEl || !textEl) return;
  
  const moveNum = Math.floor(moveIndex / 2) + 1;
  const isWhite = moveIndex % 2 === 0;
  const player = isWhite ? 'White' : 'Black';
  
  // Set icon based on annotation
  if (analysis) {
    if (analysis.annotation === '!!') {
      iconEl.textContent = '💥';
    } else if (analysis.annotation === '!') {
      iconEl.textContent = '⚠️';
    } else if (analysis.annotation === '?!') {
      iconEl.textContent = '❓';
    } else {
      iconEl.textContent = '✓';
    }
  } else {
    iconEl.textContent = '📊';
  }
  
  // Move notation
  moveEl.textContent = `${moveNum}. ${isWhite ? '' : '...'}${move.san}`;
  
  // Commentary text
  textEl.textContent = commentary || `${player} plays ${move.san}`;
  
  // Evaluation - update both the panel and the side bar
  if (analysis && analysis.cp !== undefined) {
    const cp = analysis.cp; // Keep in centipawns for updateEvaluation
    const displayCp = cp / 100; // Convert to pawns for display
    evalEl.textContent = displayCp > 0 ? `+${displayCp.toFixed(1)}` : displayCp.toFixed(1);
    evalEl.className = 'analysis-eval' + (displayCp > 1 ? ' winning' : displayCp < -1 ? ' losing' : '');
    evalEl.style.display = 'block';
    
    // Also update the evaluation bar on the side
    updateEvaluation(cp, true);
  } else {
    evalEl.style.display = 'none';
    // Reset eval bar if no analysis
    updateEvaluation(0, false);
  }
  
  // Best move hint
  if (analysis && analysis.bestMove && analysis.bestMove !== move.san && 
      (analysis.annotation === '!!' || analysis.annotation === '!' || analysis.annotation === '?!')) {
    hintMoveEl.textContent = analysis.bestMove;
    hintEl.style.display = 'flex';
  } else {
    hintEl.style.display = 'none';
  }
}

function resetMoveAnalysisPanel() {
  const iconEl = document.getElementById('analysisIcon');
  const moveEl = document.getElementById('analysisMove');
  const textEl = document.getElementById('analysisText');
  const evalEl = document.getElementById('analysisEval');
  const hintEl = document.getElementById('bestMoveHint');
  
  if (iconEl) iconEl.textContent = '📊';
  if (moveEl) moveEl.textContent = 'Ready to analyze';
  if (textEl) textEl.textContent = 'Click Play or use arrows to step through the game';
  if (evalEl) evalEl.style.display = 'none';
  if (hintEl) hintEl.style.display = 'none';
}

function updateEvaluation(cp, isFromStockfish = true) {
  const evalBar = document.getElementById('evalBar');
  const evalText = document.getElementById('evalText');
  
  if (!evalBar || !evalText) return;
  
  // Convert centipawns to display value
  const displayValue = cp / 100;
  const evalStr = displayValue > 0 ? `+${displayValue.toFixed(1)}` : displayValue.toFixed(1);
  
  // Show Stockfish indicator if this is a real Stockfish evaluation
  if (isFromStockfish && stockfish) {
    evalText.textContent = evalStr;
    evalText.title = 'Stockfish evaluation';
    evalText.style.fontWeight = 'bold';
  } else {
    evalText.textContent = evalStr;
    evalText.title = 'Analysis pending';
    evalText.style.fontWeight = 'normal';
  }
  
  // Vertical bar: white at bottom (100% = all white), black at top (0% = all black)
  // 50% is equal position
  // Clamp cp to reasonable range (-1000 to +1000 centipawns)
  const clampedCp = Math.max(-1000, Math.min(1000, cp));
  
  // Convert to percentage: +1000cp = 100% white, -1000cp = 0% white (100% black)
  const whitePercentage = 50 + (clampedCp / 20); // 50% base, ±50% for ±1000cp
  
  // White fills from bottom up
  evalBar.style.height = `${Math.max(0, Math.min(100, whitePercentage))}%`;
  evalBar.style.bottom = '0';
  evalBar.style.top = 'auto';
  evalBar.className = 'eval-fill-vertical';
}

function playMoves() {
  if (isPlaying) return;
  
  isPlaying = true;
  
  // Speak intro summary if starting from beginning
  if (currentMoveIndex === -1 && gameSummary) {
    speakGameIntro();
  }
  
  playInterval = setInterval(() => {
    if (currentMoveIndex < moves.length - 1) {
      nextMove();
    } else {
      stopMoves();
    }
  }, 2000);
  
  // Play first move if at start
  if (currentMoveIndex === -1) {
    // Delay first move to let intro finish
    setTimeout(() => {
      if (isPlaying) nextMove();
    }, gameSummary ? 3000 : 0);
  }
}

async function speakGameIntro() {
  if (!gameSummary || !voiceEnabled) return;
  
  // Create a friendly game intro
  let intro = "Let's review this game! ";
  intro += gameSummary;
  
  // Try ElevenLabs first
  if (typeof window.speakWithElevenLabs === 'function') {
    try {
      const success = await window.speakWithElevenLabs(intro);
      if (success) return;
    } catch (e) {
      console.log('ElevenLabs intro failed, using fallback');
    }
  }
  
  // Fallback to browser TTS
  if (synth && selectedVoice) {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(intro);
    utterance.voice = selectedVoice;
    utterance.rate = 1.0;
    synth.speak(utterance);
  }
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

function flipBoard() {
  if (!board) return;
  
  boardOrientation = boardOrientation === 'white' ? 'black' : 'white';
  board.orientation(boardOrientation);
  
  // Swap player bars visually by reordering in DOM
  const boardSection = document.querySelector('.board-section');
  const playerBlack = document.getElementById('playerBlack');
  const playerWhite = document.getElementById('playerWhite');
  const boardWithEval = document.querySelector('.board-with-eval');
  
  if (boardSection && playerBlack && playerWhite && boardWithEval) {
    if (boardOrientation === 'black') {
      // White on top, Black on bottom
      boardSection.insertBefore(playerWhite, boardWithEval);
      boardWithEval.after(playerBlack);
    } else {
      // Black on top, White on bottom (default)
      boardSection.insertBefore(playerBlack, boardWithEval);
      boardWithEval.after(playerWhite);
    }
  }
  
  // Redraw arrows with new orientation
  if (currentMoveIndex >= 0 && moves[currentMoveIndex]) {
    highlightMove(moves[currentMoveIndex]);
  }
  
  console.log('Board flipped to:', boardOrientation);
}

function previousMove() {
  pauseMoves();
  if (currentMoveIndex > -1) {
    goToMove(currentMoveIndex - 1);
  }
}

function nextMove() {
  pauseMoves();
  if (currentMoveIndex < moves.length - 1) {
    goToMove(currentMoveIndex + 1);
  }
}

async function speakMoveWithAnalysis(moveIndex) {
  if (moveIndex < 0 || moveIndex >= moves.length) return;
  
  const move = moves[moveIndex];
  
  // Build concise, natural commentary - NO move notation
  let text = '';
  
  // Only speak the commentary, make it conversational
  if (moveCommentary[moveIndex]) {
    let commentary = moveCommentary[moveIndex];
    
    // Make it more conversational and concise
    // Remove formal language, make it sound like a coach talking
    commentary = commentary
      .replace(/White plays|Black plays/g, '')
      .replace(/This is a/g, 'That\'s a')
      .replace(/This was/g, 'That was')
      .replace(/\. /g, '. ') // Keep periods for natural pauses
      .trim();
    
    // Limit to first 150 chars for brevity
    if (commentary.length > 150) {
      // Try to cut at a sentence boundary
      const sentences = commentary.substring(0, 150).split('.');
      if (sentences.length > 1) {
        commentary = sentences.slice(0, -1).join('.') + '.';
      } else {
        commentary = commentary.substring(0, 150) + '...';
      }
    }
    
    text = commentary;
  } else {
    // Fallback: very brief move description
    const piece = move.piece === 'p' ? 'pawn' : 
                  move.piece === 'n' ? 'knight' :
                  move.piece === 'b' ? 'bishop' :
                  move.piece === 'r' ? 'rook' :
                  move.piece === 'q' ? 'queen' : 'king';
    text = `${piece} to ${move.to}`;
  }
  
  // Skip if no text
  if (!text || text.trim().length === 0) return;
  
  // Try ElevenLabs first (premium voice with agent)
  if (typeof window.speakWithElevenLabs === 'function') {
    try {
      const success = await window.speakWithElevenLabs(text);
      if (success) {
        console.log('✓ Spoke with ElevenLabs (premium voice)');
        return;
      }
    } catch (error) {
      console.log('ElevenLabs failed, using fallback:', error);
    }
  }
  
  // Fallback to Google TTS
  if (useGoogleTTS) {
    const success = await speakWithGoogleTTS(text);
    if (success) {
      console.log('Spoke with Google TTS (masculine voice)');
      return;
    }
  }
  
  // Final fallback to Web Speech API
  // Cancel any ongoing speech
  synth.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // More natural "dude" voice parameters
  utterance.rate = 1.0; // Natural conversational pace
  utterance.pitch = 0.9; // Lower pitch for more masculine "dude" sound
  utterance.volume = 1.0;
  
  // Add slight pause between sentences for naturalness
  utterance.text = text.replace(/\. /g, '. '); // Natural pauses
  
  // Use selected voice (re-select if needed)
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  } else {
    // Fallback: try to get a good voice on the fly
    const voices = synth.getVoices();
    const goodVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Alex') || v.name.includes('Samantha'))
    );
    if (goodVoice) {
      utterance.voice = goodVoice;
      selectedVoice = goodVoice;
      console.log('Selected voice on-the-fly:', goodVoice.name);
    }
  }
  
  // Add event listeners
  utterance.onstart = () => {
    console.log('Speaking:', text.substring(0, 50) + '...');
  };
  
  utterance.onerror = (e) => {
    console.error('Speech error:', e);
  };
  
  synth.speak(utterance);
}
