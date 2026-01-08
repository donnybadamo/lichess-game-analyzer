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
let currentAudio = null; // Track currently playing audio to stop it
let currentSpeechPromise = null; // Track current speech promise to cancel it
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
  
  // Fallback: try to get from chrome.storage if URL param is missing
  if (!pgn) {
    try {
      chrome.storage.local.get(['currentGamePGN'], async (result) => {
        if (result.currentGamePGN) {
          console.log('Got PGN from storage');
          await initializeGame(result.currentGamePGN);
          // Hide PGN modal after successful analysis
          const pgnModal = document.getElementById('pgnModal');
          if (pgnModal) {
            pgnModal.style.display = 'none';
          }
        } else {
          // Show PGN modal instead of error
          const pgnModal = document.getElementById('pgnModal');
          if (pgnModal) {
            pgnModal.style.display = 'flex';
            console.log('Showing PGN modal (no PGN found)');
          }
          console.log('No PGN found. You can paste PGN in the input field.');
        }
      });
      return; // Exit early, will initialize from storage callback
    } catch (e) {
      console.error('Error accessing storage:', e);
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
    const result = await chrome.storage.local.get(['googleTTSApiKey']);
    if (result.googleTTSApiKey) {
      googleTTSApiKey = result.googleTTSApiKey;
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
    
    // Store audio globally so it can be stopped
    currentAudio = audio;
    
    await audio.play();
    
    // Wait for audio to finish or be stopped
    return new Promise((resolve) => {
      audio.onended = () => {
        if (currentAudio === audio) {
          currentAudio = null;
        }
        resolve(true);
      };
      audio.onerror = () => {
        if (currentAudio === audio) {
          currentAudio = null;
        }
        resolve(false);
      };
      audio.onpause = () => {
        // If paused externally (currentTime reset), it was stopped
        if (audio.currentTime === 0 && currentAudio === audio) {
          currentAudio = null;
          resolve(false);
        }
      };
    });
  } catch (error) {
    console.error('Google TTS error:', error);
    return false;
  }
}

// Initialize when page loads - handle both cases (DOM ready or already loaded)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await initGoogleTTS();
    // Try to load credentials from Cloudflare Worker if configured (optional)
    if (typeof window.loadElevenLabsCredentials === 'function') {
      try {
        await window.loadElevenLabsCredentials();
        console.log('✅ Credentials loaded from Cloudflare Worker');
      } catch (e) {
        console.log('💡 Using local credentials from Chrome storage');
      }
    } else {
      console.log('💡 Using local credentials from Chrome storage');
    }
    initializeAnalysisPage();
  });
} else {
  // DOM is already loaded, run immediately
  (async () => {
    await initGoogleTTS();
    // Try to load credentials from Cloudflare Worker if configured (optional)
    if (typeof window.loadElevenLabsCredentials === 'function') {
      try {
        await window.loadElevenLabsCredentials();
        console.log('✅ Credentials loaded from Cloudflare Worker');
      } catch (e) {
        console.log('💡 Using local credentials from Chrome storage');
      }
    } else {
      console.log('💡 Using local credentials from Chrome storage');
    }
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
      // Check if extension context is still valid
      const isExtensionValid = () => {
        try {
          return chrome.runtime && chrome.runtime.getURL;
        } catch (e) {
          return false;
        }
      };
      
      // Use local PNG pieces from extension, with CDN fallback
      const pieceTheme = (piece) => {
        // Try extension URL first, fall back to CDN if context is invalid
        if (isExtensionValid()) {
          try {
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
        return chrome.runtime.getURL(`libs/pieces/${pieceName}.png`);
          } catch (e) {
            // Fall through to CDN
          }
        }
        // CDN fallback (Wikipedia pieces)
        return `https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/img/chesspieces/wikipedia/${piece}.png`;
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
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (board) {
            // Force board to recalculate size
            board.resize();
            // Small delay to ensure CSS has updated
            setTimeout(() => {
          if (board) {
            board.resize();
            // Redraw arrows after resize
            if (currentMoveIndex >= 0 && moves[currentMoveIndex]) {
              highlightMove(moves[currentMoveIndex]);
            }
          }
            }, 50);
          }
        }, 100);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Also listen for orientation changes on mobile
      window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 200);
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
    
    // Initialize button visibility
    updatePlayPauseButton();
    
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
  return new Promise(async (resolve) => {
    try {
      // Try multiple approaches to load Stockfish
      let stockfishUrl;
      
      try {
        if (chrome.runtime && chrome.runtime.getURL) {
          stockfishUrl = chrome.runtime.getURL('libs/stockfish.js');
        }
      } catch (e) {
        console.warn('⚠️ Extension context invalid');
      }
      
      if (!stockfishUrl) {
        console.error('❌ Cannot determine Stockfish URL');
        stockfish = null;
        updateAnalysisStatus('Engine not available');
        resolve();
        return;
      }
      
      console.log('🔧 Loading Stockfish from:', stockfishUrl);
      
      // Try to load Stockfish directly (skip test worker since it may not exist)
      
      // Create stockfish worker
      try {
      stockfish = new Worker(stockfishUrl);
        console.log('✓ Stockfish worker created');
      } catch (workerError) {
        console.error('❌ Worker creation failed:', workerError);
        stockfish = null;
        updateAnalysisStatus('Engine not available');
        resolve();
        return;
      }
      
      // Add error event listener
      stockfish.addEventListener('error', (e) => {
        console.error('Worker error event:', e.message || e);
      });
      
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
        console.error('Error details:', {
          message: error.message,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
          error: error.error
        });
        updateAnalysisStatus('Engine error - check console');
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
    
    // Convert best move from UCI to SAN format
    let bestMoveSAN = null;
    let bestMoveEval = null; // What the eval would be after the best move
    
    if (evaluationBefore.bestMove) {
      try {
        // Create a temporary chess instance to convert UCI to SAN and evaluate best move
        const tempChessForBestMove = new window.Chess(positionBeforeMove);
        const uciMove = evaluationBefore.bestMove;
        
        // UCI format: "e2e4" or "e7e8q" (with promotion)
        if (uciMove && uciMove.length >= 4 && uciMove !== '0000') {
          const from = uciMove.substring(0, 2);
          const to = uciMove.substring(2, 4);
          const promotion = uciMove.length > 4 ? uciMove[4].toLowerCase() : null;
          
          // Validate squares are valid
          if (/^[a-h][1-8]$/.test(from) && /^[a-h][1-8]$/.test(to)) {
            // Get all legal moves to find the matching one
            const legalMoves = tempChessForBestMove.moves({ verbose: true });
            const matchingMove = legalMoves.find(m => 
              m.from === from && 
              m.to === to && 
              (!promotion || (m.promotion && m.promotion.toLowerCase() === promotion))
            );
            
            if (matchingMove) {
              bestMoveSAN = matchingMove.san;
              
              // Make the best move and evaluate the resulting position
              try {
                tempChessForBestMove.move(matchingMove);
                const positionAfterBestMove = tempChessForBestMove.fen();
                bestMoveEval = await getPositionEvaluation(positionAfterBestMove, i, true); // Quick eval
              } catch (e) {
                console.warn('Could not evaluate best move position:', e);
              }
            } else {
              // Try making the move directly as fallback
              try {
                const moveObj = tempChessForBestMove.move({
                  from: from,
                  to: to,
                  promotion: promotion || undefined
                });
                if (moveObj) {
                  bestMoveSAN = moveObj.san;
                  const positionAfterBestMove = tempChessForBestMove.fen();
                  bestMoveEval = await getPositionEvaluation(positionAfterBestMove, i, true);
                }
              } catch (moveError) {
                // Log error details properly with JSON.stringify to avoid [object Object]
                const errorMsg = moveError instanceof Error ? moveError.message : String(moveError);
                const errorDetails = {
                  uciMove: uciMove,
                  from: from,
                  to: to,
                  promotion: promotion,
                  error: errorMsg,
                  fen: positionBeforeMove.substring(0, 50) + '...'
                };
                console.warn('Invalid best move for position:', JSON.stringify(errorDetails, null, 2));
              }
            }
          }
        }
      } catch (e) {
        console.warn('Could not convert best move to SAN:', e, 'UCI:', evaluationBefore.bestMove);
        bestMoveSAN = evaluationBefore.bestMove; // Fallback to UCI
      }
    }
    
    // Now make the actual played move
    tempChess.move(move);
    
    // Get evaluation after the played move
    const positionAfterMove = tempChess.fen();
    const evaluationAfter = await getPositionEvaluation(positionAfterMove, i, true); // quickEval = true
    
    // Determine annotation by comparing best move eval vs played move eval
    // This is how Lichess does it - compare what the position would be with best move
    // vs what it actually is with the played move
    let annotation = '';
    if (bestMoveEval && evaluationAfter) {
      const bestCp = bestMoveEval.cp || 0;
      const playedCp = evaluationAfter.cp || 0;
      const isWhiteMove = i % 2 === 0;
      
      // Calculate eval loss from player's perspective
      // Stockfish always reports from White's perspective
      const evalLoss = isWhiteMove ? (bestCp - playedCp) : (playedCp - bestCp);
      const absLoss = Math.abs(evalLoss);
      
      // Lichess-like thresholds (in centipawns)
      if (absLoss > 200) {
        annotation = '!!'; // Blunder
      } else if (absLoss > 100) {
        annotation = '!'; // Mistake
      } else if (absLoss > 50) {
        annotation = '?!'; // Inaccuracy
      } else if (absLoss < 10 && bestMoveSAN === move.san) {
        annotation = '!'; // Best move (or very close)
      }
      // Otherwise annotation stays empty (good move)
    }
    
    // Combine: bestMove from before (converted to SAN), eval from after
    const evaluation = {
      ...evaluationAfter,
      bestMove: bestMoveSAN, // Best move for the player who just moved (in SAN format)
      cp: evaluationAfter.cp, // Position evaluation after the move
      mate: evaluationAfter.mate,
      depth: Math.max(evaluationBefore.depth, evaluationAfter.depth),
      pv: evaluationBefore.pv,
      annotation: annotation, // Set based on comparison with best move
      moveIndex: i,
      evalLoss: bestMoveEval ? (() => {
        // Calculate eval loss from player's perspective
        const bestCp = bestMoveEval.cp || 0;
        const playedCp = evaluationAfter.cp || 0;
        const isWhiteMove = i % 2 === 0;
        // Loss = what you could have had (best) - what you got (played)
        // Positive = player lost advantage
        return isWhiteMove ? (bestCp - playedCp) : (playedCp - bestCp);
      })() : 0 // Store eval loss for commentary
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
  
  // Generate game summary (pass keyMoments for detailed feedback)
  // Use the actual number of moves analyzed (analysisData.length) to ensure accuracy
  const analyzedMovesCount = analysisData.length;
  gameSummary = generateGameSummary(totalMistakes, totalBlunders, totalInaccuracies, openingMoves, keyMoments, analyzedMovesCount);
  
  // Display key moments
  displayKeyMoments();
  
  // Remove loading indicator
  loadingDiv.remove();
  
  // Reset to start position to show game summary
  goToMove(-1);
  
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
    // Increased depth for better accuracy matching Lichess
    const targetDepth = quickEval ? 12 : 20; // Increased from 8/15 to 12/20
    
    const finishAnalysis = (reason) => {
      if (resolved) return;
      resolved = true;
      
      // Handle mate scores properly - Stockfish reports from White's perspective
      let finalCp = 0;
      let finalMate = null;
      
      if (evaluation) {
        if (evaluation.mate !== undefined && evaluation.mate !== null) {
          // Mate score: positive = White mates, negative = Black mates
          finalMate = evaluation.mate;
          // Use large CP value for comparison (1000 centipawns per move)
          finalCp = evaluation.mate > 0 ? 10000 : -10000;
        } else if (evaluation.cp !== undefined) {
          finalCp = evaluation.cp;
        }
      }
      
      const result = { 
        cp: finalCp,
        mate: finalMate,
        depth: bestDepth, 
        bestMove: bestMove,
        pv: pv,
        annotation: '',
        moveIndex: moveIndex
      };
      
      // Annotation is set during analyzeGame() by comparing best move vs played move
      // This function is only used for quick evaluations, so annotation stays empty here
      
      // Log with proper format
      const evalStr = finalMate !== null 
        ? `M${finalMate > 0 ? '+' : ''}${finalMate}` 
        : `${(finalCp / 100).toFixed(2)}`;
      console.log(`📊 Move ${moveIndex + 1} (${reason}): eval=${evalStr} depth=${bestDepth} best=${bestMove || 'none'}`);
      resolve(result);
    };
    
    const timeout = setTimeout(() => {
      finishAnalysis('timeout');
    }, quickEval ? 4000 : 8000); // Longer timeout for deeper analysis (4s quick, 8s full)
    
    // Create message handler for this analysis
    const handler = (event) => {
      const message = event.data || event;
      
      if (typeof message === 'string') {
        // Debug: log info messages
        if (message.startsWith('info') && message.includes('score')) {
          // Parse evaluation from info string
          // Stockfish format: "info depth X score cp Y" or "info depth X score mate Y"
          // Y can be positive or negative (with or without + sign)
          const evalMatch = message.match(/score (cp|mate) ([+-]?\d+)/);
          const depthMatch = message.match(/depth (\d+)/);
          const pvMatch = message.match(/ pv (.+)/);
          
          if (depthMatch) {
            depth = parseInt(depthMatch[1]);
            if (depth > bestDepth) bestDepth = depth;
          }
          
          if (evalMatch) {
            const scoreType = evalMatch[1];
            const score = parseInt(evalMatch[2]);
            
            if (scoreType === 'mate') {
              // Mate score: positive = White mates, negative = Black mates
              // Stockfish reports: mate 5 = White mates in 5, mate -5 = Black mates in 5
              evaluation = { mate: score };
            } else {
              // CP score: positive = White better, negative = Black better
              // Stockfish always reports from White's perspective
              evaluation = { cp: score };
            }
            
            // Only update if this is a better depth or we don't have an evaluation yet
            if (!evaluation || depth >= bestDepth) {
              // Keep the latest evaluation
            }
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
          
          // Stop when we have enough depth - use higher depth for better accuracy (like Lichess)
          const requiredDepth = quickEval ? 10 : 18; // Increased from 6/12 to 10/18 for better accuracy
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


// Convert chess notation to spoken form (e.g., "e4" -> "eh-four", "Nf3" -> "knight f three")
function convertNotationToSpoken(notation) {
  if (!notation || typeof notation !== 'string') return notation;
  
  // Map file letters to spoken form
  const fileMap = {
    'a': 'eh', 'b': 'bee', 'c': 'see', 'd': 'dee',
    'e': 'eh', 'f': 'eff', 'g': 'gee', 'h': 'aitch'
  };
  
  // Map piece letters to spoken form
  const pieceMap = {
    'K': 'king', 'Q': 'queen', 'R': 'rook',
    'B': 'bishop', 'N': 'knight', 'P': 'pawn'
  };
  
  let spoken = notation;
  
  // Handle castling
  if (notation === 'O-O' || notation === 'O-O-O') {
    return notation === 'O-O' ? 'castles kingside' : 'castles queenside';
  }
  
  // Handle simple file+rank moves (e.g., e4, d5) - most common case, check first
  const simpleMoveMatch = notation.match(/^([a-h])([1-8])([+#]?)$/);
  if (simpleMoveMatch) {
    const [, file, rank, suffix] = simpleMoveMatch;
    const fileSpoken = fileMap[file.toLowerCase()] || file;
    let result = `${fileSpoken}-${rank}`;
    if (suffix === '+') result += ' check';
    if (suffix === '#') result += ' checkmate';
    return result;
  }
  
  // Handle piece moves (e.g., Nf3, Bc4, Qd1)
  // Pattern: [Piece][file][rank] or [Piece][file][rank][capture/promotion/check]
  const pieceMoveMatch = notation.match(/^([KQRBN])([a-h])([1-8])([x+#=]?.*)?$/);
  if (pieceMoveMatch) {
    const [, piece, file, rank, suffix] = pieceMoveMatch;
    const pieceName = pieceMap[piece] || piece;
    const fileSpoken = fileMap[file.toLowerCase()] || file;
    let result = `${pieceName} ${fileSpoken} ${rank}`;
    
    // Handle suffix (captures, checks, promotions)
    if (suffix) {
      if (suffix.includes('x')) result += ' takes';
      if (suffix.includes('+')) result += ' check';
      if (suffix.includes('#')) result += ' checkmate';
      if (suffix.includes('=')) {
        const promoMatch = suffix.match(/=([QRBN])/);
        if (promoMatch) {
          const promoPiece = pieceMap[promoMatch[1]] || promoMatch[1];
          result += ` promotes to ${promoPiece}`;
        }
      }
    }
    return result;
  }
  
  // Handle pawn captures (e.g., exd5, e8=Q) - must have 'x' for capture
  const pawnCaptureMatch = notation.match(/^([a-h])x([a-h])([1-8])([=+#]?.*)?$/);
  if (pawnCaptureMatch) {
    const [, fromFile, toFile, rank, suffix] = pawnCaptureMatch;
    const fromFileSpoken = fileMap[fromFile.toLowerCase()] || fromFile;
    const toFileSpoken = fileMap[toFile.toLowerCase()] || toFile;
    let result = `${fromFileSpoken} takes ${toFileSpoken} ${rank}`;
    if (suffix) {
      if (suffix.includes('+')) result += ' check';
      if (suffix.includes('#')) result += ' checkmate';
      if (suffix.includes('=')) {
        const promoMatch = suffix.match(/=([QRBN])/);
        if (promoMatch) {
          const promoPiece = pieceMap[promoMatch[1]] || promoMatch[1];
          result += ` promotes to ${promoPiece}`;
        }
      }
    }
    return result;
  }
  
  // Fallback: return as-is if we can't parse it
  return notation;
}

// Apply notation conversion to commentary text
function convertCommentaryNotation(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Find chess notation patterns (e.g., e4, Nf3, exd5, O-O)
  // Pattern: word boundary, then notation, then word boundary or punctuation
  return text.replace(/\b([KQRBN]?[a-h]?x?[a-h][1-8][+#=]?[QRBN]?|O-O-O?)\b/g, (match) => {
    return convertNotationToSpoken(match);
  });
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
  
  // Use the evalLoss stored during analysis (compares best move vs played move)
  // This is the correct way - compares what position would be with best move vs actual position
  const evalLoss = evaluation.evalLoss !== undefined 
    ? Math.abs(evaluation.evalLoss) 
    : Math.abs(isWhite ? -evalChange : evalChange); // Fallback to old calculation
  
  // Get piece name for better readability
  const getPieceName = (p) => {
    const names = { 'p': 'pawn', 'n': 'knight', 'b': 'bishop', 'r': 'rook', 'q': 'queen', 'k': 'king' };
    return names[p.toLowerCase()] || p;
  };
  
  // Opening phase commentary - match voice script style with variations
  if (moveIndex < 10) {
    if (moveIndex === 0) {
      const openingPhrases = [
        `${player} opens with ${move.san} - `,
        `${player} plays ${move.san}. `,
        `Here's ${move.san}. `,
        `${move.san} - ${player} makes the first move. `,
        `And we're off! ${player} opens with ${move.san}. `,
        `Here we go! ${move.san}. `
      ];
      commentary = openingPhrases[Math.floor(Math.random() * openingPhrases.length)];
      
      // Add opening-specific commentary with variations
      if (move.san === 'e4') {
        const e4Comments = [
          "The King's Pawn opening. Classic, aggressive, and sets the tone for an open game. ",
          "The King's Pawn. Classic and aggressive. ",
          "King's Pawn opening - going for an open game. "
        ];
        commentary += e4Comments[Math.floor(Math.random() * e4Comments.length)];
      } else if (move.san === 'd4') {
        const d4Comments = [
          "The Queen's Pawn opening. Solid and positional. ",
          "Queen's Pawn - solid and positional. ",
          "The Queen's Pawn. A solid choice. "
        ];
        commentary += d4Comments[Math.floor(Math.random() * d4Comments.length)];
      } else if (move.san === 'Nf3') {
        const nf3Comments = [
          "Developing with tempo. ",
          "Knight to f3, developing with tempo. ",
          "Nf3 - developing with tempo. "
        ];
        commentary += nf3Comments[Math.floor(Math.random() * nf3Comments.length)];
      } else if (move.san === 'c4') {
        const c4Comments = [
          "The English Opening. ",
          "English Opening. ",
          "c4 - the English. "
        ];
        commentary += c4Comments[Math.floor(Math.random() * c4Comments.length)];
      }
    } else if (moveIndex < 6) {
      const pieceName = getPieceName(move.piece);
      const openingComments = [
        `${player} plays ${move.san}, developing the ${pieceName}. `,
        `${move.san}. The ${pieceName} enters the game. `,
        `${player} brings out the ${pieceName} with ${move.san}. `,
        `${move.san}. ${player} activates the ${pieceName}. `,
        `${move.san} - developing the ${pieceName}. `,
        `${player} develops with ${move.san}. `
      ];
      commentary = openingComments[Math.floor(Math.random() * openingComments.length)];
      
      // Add specific opening commentary with variations
      if (moveIndex === 1 && move.san === 'e5') {
        const e5Comments = [
          "We're looking at a symmetrical position here. Both sides fighting for central control. ",
          "Symmetrical position. Both sides fighting for the center. ",
          "e5 - mirroring White's central push. "
        ];
        commentary += e5Comments[Math.floor(Math.random() * e5Comments.length)];
      } else if (move.san === 'c5') {
        const c5Comments = [
          "There's the Sicilian Defense. Black refuses to mirror White and creates an asymmetrical fight. ",
          "The Sicilian Defense. Creating an asymmetrical fight. ",
          "c5 - the Sicilian. Black goes for an unbalanced position. "
        ];
        commentary += c5Comments[Math.floor(Math.random() * c5Comments.length)];
      } else if (move.san === 'Bc4') {
        const bc4Comments = [
          "Bishop to c4, eyeing that f7 square - always a sensitive spot in the opening. ",
          "Bc4 - targeting f7, that weak square. ",
          "Bishop to c4. That f7 square is always a target. "
        ];
        commentary += bc4Comments[Math.floor(Math.random() * bc4Comments.length)];
      }
    }
  }
  
  // Tactical commentary - match voice script style with notation and variations
  if (move.san.includes('#')) {
    const checkmatePhrases = [
      `Checkmate! ${move.san}! The queen and bishop combine for a beautiful finish. What a finish!`,
      `Checkmate! ${move.san}! That's the game!`,
      `${move.san}! Checkmate! Game over!`,
      `Checkmate on ${move.san}! What a finish!`,
      `Boom! Checkmate! ${move.san}! `,
      `${move.san}! Checkmate! ${player} delivers the final blow!`,
      `Checkmate! ${move.san}! Beautiful finish!`,
      `${move.san}! That's checkmate! Game over!`
    ];
    return checkmatePhrases[Math.floor(Math.random() * checkmatePhrases.length)];
  }
  
  if (move.captured) {
    const capturedPiece = getPieceName(move.captured);
    const capturePhrases = [
      `${move.san}! ${player} takes the ${capturedPiece}. `,
      `${move.san}. That ${capturedPiece} is gone. `,
      `${player} captures with ${move.san}. `,
      `${move.san} - takes the ${capturedPiece}. `,
      `Oh! ${move.san}! That's a capture. `,
      `${move.san}. Captures the ${capturedPiece}. `,
      `${player} snatches the ${capturedPiece} with ${move.san}. `,
      `${move.san}! Takes the ${capturedPiece} on ${move.to}. `
    ];
    commentary += capturePhrases[Math.floor(Math.random() * capturePhrases.length)];
    
    // Special capture commentary with variations
    if (move.san.includes('xf7') || move.san.includes('xf2')) {
      const sacrificeComments = [
        "That's a sacrifice! Giving up material for a devastating attack. ",
        "Oh! That's a sacrifice! He's giving up the piece for a devastating attack. ",
        "Sacrifice! Trading material for a strong attack. ",
        "Bold sacrifice! Going all-in on the attack. ",
        "Oh! Knight takes on f7! That's a sacrifice! "
      ];
      commentary += sacrificeComments[Math.floor(Math.random() * sacrificeComments.length)];
    } else if (move.captured === 'q') {
      const queenCaptureComments = [
        "That's the queen! Huge trade. ",
        "Takes the queen! That's massive. ",
        "Queen capture! That changes everything. "
      ];
      commentary += queenCaptureComments[Math.floor(Math.random() * queenCaptureComments.length)];
    }
  }
  
  // Detect tactical patterns - forks, pins, discovered attacks (from voice script)
  // Simple pattern matching based on move characteristics
  if (move.piece === 'n' && evaluation.annotation === '!' && evalLoss < 50) {
    // Knight fork potential - good knight move might be a fork
    if (Math.random() < 0.25) { // 25% chance
      const forkComments = [
        `Double attack! The knight forks multiple pieces. Something's gotta give. `,
        `Fork! The knight attacks multiple targets. `,
        `${move.san}! The knight forks the king and another piece. `,
        `Nice fork! The knight is attacking multiple pieces. `
      ];
      commentary += forkComments[Math.floor(Math.random() * forkComments.length)];
    }
  }
  
  // Check for pins (bishop moves to g5/g4 area - common pinning squares)
  if (move.piece === 'b' && (move.san.includes('g5') || move.san.includes('g4') || move.san.includes('Bg5') || move.san.includes('Bg4'))) {
    if (Math.random() < 0.4) { // 40% chance
      const pinComments = [
        `Bishop to ${move.to}, pinning a piece. `,
        `${move.san}! Pinning the knight to the queen. Black can't move that piece without losing material. `,
        `Bishop to ${move.to} - creating a pin. `,
        `Brilliant move! ${move.san} - pinning the knight. `
      ];
      commentary += pinComments[Math.floor(Math.random() * pinComments.length)];
    }
  }
  
  // Check for discovered attacks (piece moves revealing check)
  if ((move.piece === 'b' || move.piece === 'r' || move.piece === 'q') && move.san.includes('+')) {
    if (Math.random() < 0.5) { // 50% chance
      const discoveredComments = [
        `Discovered check! The ${getPieceName(move.piece)} moves and BAM - another piece delivers check. `,
        `Discovered check! ${move.san} opens up a line. `,
        `${move.san}! Discovered check! That's gonna cost material. `
      ];
      commentary += discoveredComments[Math.floor(Math.random() * discoveredComments.length)];
    }
  }
  
  if (move.san.includes('+')) {
    const checkPhrases = [
      `${move.san}! Check! The king is in serious trouble now. `,
      `Check! ${move.san}. Black's king is under attack. `,
      `${move.san}! Check! Things are heating up. `,
      `Check on ${move.san}! `,
      `${move.san}! Check! The king is in danger. `,
      `Check! ${move.san}. The king can't stay there. `,
      `${move.san}! Check! ${player} puts the king in danger! `
    ];
    commentary += checkPhrases[Math.floor(Math.random() * checkPhrases.length)];
  }
  
  // Castling - match voice script with variations
  if (move.san === 'O-O' || move.san === 'O-O-O') {
    const side = move.san === 'O-O' ? 'kingside' : 'queenside';
    const castlingPhrases = [
      `${move.san}. Castle ${side}. The king finds safety and the rooks are connected now. `,
      `${player} castles ${side} with ${move.san}. Essential to get the king safe. `,
      `Castle ${side}. ${move.san}. The king gets cozy. `,
      `${move.san}. Castling ${side} - smart defensive move. `,
      `${move.san}. Castle ${side}. Securing the king and connecting the rooks. `,
      `Castling ${side} with ${move.san}. The king finds safety. `,
      `${move.san} - castle ${side}. King safety and rook activation. `
    ];
    commentary += castlingPhrases[Math.floor(Math.random() * castlingPhrases.length)];
  }
  
  // Analyze the move quality with detailed feedback
  const bestMove = evaluation.bestMove;
  const hasBetterMove = bestMove && 
    typeof bestMove === 'string' && 
    bestMove !== move.san &&
    !/^\d+\.?$/.test(bestMove) &&
    !['1-0', '0-1', '1/2-1/2', '*'].includes(bestMove);
  
  // Move quality commentary - match voice script style with notation
  if (evaluation.annotation === '!!') {
    // Blunder - match voice script phrases
    const blunderPhrases = [
      `Oh no. ${move.san} is a blunder. `,
      `Yikes. ${move.san} - that's a blunder. `,
      `Ouch. ${move.san} - that's going to cost ${player.toLowerCase()} dearly. `,
      `${move.san}. That's a rough one - a critical error. `
    ];
    commentary += blunderPhrases[Math.floor(Math.random() * blunderPhrases.length)];
    
    // Add specific blunder commentary
    if (evalLoss > 500) {
      commentary += "He just hung a piece. Completely undefended. ";
    } else if (evaluation.mate && evaluation.mate < 0) {
      commentary += "Wait, that's checkmate in a few moves. I don't think he saw that coming. ";
    }
    
    if (hasBetterMove) {
      const betterPhrases = [
        `Should've played ${bestMove} instead. `,
        `${bestMove} would have been much better here. `,
        `The engine says ${bestMove} was the move to play. `,
        `${bestMove} would have kept things solid. `
      ];
      commentary += betterPhrases[Math.floor(Math.random() * betterPhrases.length)];
      commentary += explainBestMoveDetailed(bestMove, move, evaluation, prevEval);
    }
  } else if (evaluation.annotation === '!') {
    // This is a mistake (annotation '!' means mistake, not best move)
    // Never give positive feedback on mistakes
    const mistakePhrases = [
      `Mistake! ${move.san} loses material. `,
      `${move.san}. That's a mistake that gives the opponent an advantage. `,
      `Hmm, ${move.san} - that's not ideal. `,
      `${move.san}. That move lets the opponent back in the game. `,
      `Mistake! ${move.san} loses a full piece. `,
      `${move.san}. That's a mistake - should've played something else. `,
      `Not the best. ${move.san} gives the opponent chances. `
    ];
    commentary += mistakePhrases[Math.floor(Math.random() * mistakePhrases.length)];
      if (hasBetterMove) {
      const betterMistakePhrases = [
        `${bestMove} would have been stronger. `,
        `Should've played ${bestMove} instead. `,
        `${bestMove} was the better choice. `
      ];
      commentary += betterMistakePhrases[Math.floor(Math.random() * betterMistakePhrases.length)];
        commentary += explainBestMoveDetailed(bestMove, move, evaluation, prevEval);
    }
  } else if (evaluation.annotation === '?!') {
    // Inaccuracy - match voice script
    const inaccuracyPhrases = [
      `Ooh, ${move.san} - that's an inaccuracy. `,
      `${move.san}. That's okay, but not perfect. `,
      `Hmm, ${move.san} - not sure about that one. `,
      `${move.san}. Decent move, though there was something better. `
    ];
    commentary += inaccuracyPhrases[Math.floor(Math.random() * inaccuracyPhrases.length)];
    
    // Add specific inaccuracy commentary
    if (move.piece === 'n' && (move.to[0] === 'a' || move.to[0] === 'h')) {
      commentary += "Knight on the rim is dim. ";
    }
    
    if (hasBetterMove) {
      commentary += `${bestMove} would have been more precise. `;
      commentary += explainBestMoveDetailed(bestMove, move, evaluation, prevEval);
    }
  } else if (hasBetterMove && evalLoss > 20) {
    // There's a better move - only say "pretty good" if loss is very small
    if (evalLoss < 50) {
      commentary += `${move.san}. Pretty good, though ${bestMove} was slightly better. `;
    } else {
      // Larger loss, should have been caught by annotation
      commentary += `${move.san}. ${bestMove} would have been better. `;
    }
  } else {
    // Good move - only give positive feedback if it's actually the best move or very close
    const isBestMove = bestMove && bestMove === move.san;
    const isVeryClose = bestMove && evalLoss < 10;
    
    if (isBestMove || isVeryClose) {
      // Only give positive feedback on actually good moves
      const naturalPhrases = [
        `${move.san}. `,
        `${move.san}. Nice. `,
        `${move.san}. Solid. `,
        `${move.san}. That's the move. `,
        `${move.san}. Good. `
      ];
      if (!commentary.trim()) {
        commentary = naturalPhrases[Math.floor(Math.random() * naturalPhrases.length)];
      }
    } else {
      // Just state the move without praise
      if (!commentary.trim()) {
        commentary = `${move.san}. `;
      }
    }
  }
  
  // Position assessment - match voice script style with eval numbers and variations
  const cp = evaluation.cp || 0;
  const absCp = Math.abs(cp);
  const evalDisplay = (cp / 100).toFixed(1);
  
  if (absCp > 500) {
    const leading = cp > 0 ? 'White' : 'Black';
    const sign = cp > 0 ? '+' : '';
    const winningPhrases = [
      `The computer says this is ${sign}${evalDisplay} for ${leading}. `,
      `${leading} is absolutely crushing here - ${sign}${evalDisplay}. `,
      `This is ${sign}${evalDisplay} for ${leading}. They're dominating. `,
      `${leading} has this in the bag at ${sign}${evalDisplay}. `,
      `Plus ${evalDisplay} for ${leading}. They're running away with this. `,
      `${sign}${evalDisplay} for ${leading}. This is looking really good. `,
      `The computer says ${sign}${evalDisplay} for ${leading}, but honestly, it's not easy to convert. `
    ];
    commentary += winningPhrases[Math.floor(Math.random() * winningPhrases.length)];
  } else if (absCp > 300) {
    const leading = cp > 0 ? 'White' : 'Black';
    const sign = cp > 0 ? '+' : '';
    const advantagePhrases = [
      `${leading} has a nice advantage here - ${sign}${evalDisplay}. `,
      `The position is ${sign}${evalDisplay} for ${leading}. `,
      `${leading} is in great shape at ${sign}${evalDisplay}. `,
      `Things are looking good for ${leading.toLowerCase()} - ${sign}${evalDisplay}. `,
      `Plus ${evalDisplay} for ${leading}. Nice advantage. `,
      `${sign}${evalDisplay} for ${leading}. They're ahead and pressing. `
    ];
    commentary += advantagePhrases[Math.floor(Math.random() * advantagePhrases.length)];
  } else if (absCp > 150) {
    const leading = cp > 0 ? 'White' : 'Black';
    const sign = cp > 0 ? '+' : '';
    const betterPhrases = [
      `${leading} has a slight edge - ${sign}${evalDisplay}. `,
      `The position is ${sign}${evalDisplay} for ${leading}. `,
      `${leading} is doing a bit better at ${sign}${evalDisplay}. `,
      `Plus ${evalDisplay} for ${leading}. Small advantage. `,
      `${sign}${evalDisplay} for ${leading}. Slight edge. `
    ];
    commentary += betterPhrases[Math.floor(Math.random() * betterPhrases.length)];
  } else if (absCp < 50) {
    // Even positions - match voice script with variations
    const evenPhrases = [
      `Dead equal at 0.0. `,
      `The position is balanced - both sides have chances. `,
      `Things are pretty equal here. `,
      `Both players are holding their own. `,
      `The battle is still wide open! `,
      `It's anyone's game at this point. `,
      `Roughly equal. Both sides have chances. `,
      `The position is pretty balanced. `,
      `Dead equal. Interesting position. `
    ];
    // Only add position assessment if we don't have much commentary yet
    if (commentary.length < 50) {
      commentary += evenPhrases[Math.floor(Math.random() * evenPhrases.length)];
    }
  }
  
  // Add move number context occasionally with variations
  if (moveIndex > 20 && (moveIndex % 10 === 0 || Math.random() < 0.2)) {
    const moveNumberPhrases = [
      `Move ${moveIndex + 1}. `,
      `We're at move ${moveIndex + 1}. `,
      `Move ${moveIndex + 1} now. `,
      `This is move ${moveIndex + 1}. `
    ];
    commentary += moveNumberPhrases[Math.floor(Math.random() * moveNumberPhrases.length)];
  }
  
  // Add natural filler phrases occasionally - match voice script
  if (Math.random() < 0.2 && commentary.length < 80) {
    const fillerPhrases = [
      "Let's see what happens here. ",
      "Now this is where it gets interesting. ",
      "Okay okay okay. ",
      "Here we go. ",
      "And there's the idea. ",
      "Let's see what he does here. ",
      "Alright, so... ",
      "Now this is interesting. ",
      "Here's the idea. ",
      "And there it is. ",
      "Saw that coming. ",
      "Wait, what? ",
      "There it is. "
    ];
    commentary += fillerPhrases[Math.floor(Math.random() * fillerPhrases.length)];
  }
  
  // Add endgame commentary for later moves - match voice script
  if (moveIndex > 40) {
    const endgameComments = [
      "We're down to a rook endgame. This is where technique really matters. ",
      "We're in the endgame now. ",
      "This is the endgame. Technique really matters here. ",
      "Endgame phase. Every move counts. ",
      "Down to the endgame. ",
      "It's a race now. Both sides pushing passed pawns. ",
      "This is a theoretically drawn position, but it's easy to go wrong. "
    ];
    if (Math.random() < 0.15 && commentary.length < 60) {
      commentary += endgameComments[Math.floor(Math.random() * endgameComments.length)];
    }
  }
  
  // Add positional commentary occasionally - match voice script
  if (moveIndex > 15 && Math.random() < 0.1 && commentary.length < 70) {
    const positionalComments = [
      "This is a closed position. Both sides are gonna have to maneuver carefully. ",
      "The position is getting complex. ",
      "Things are getting tactical. ",
      "The position is opening up. ",
      "This is a typical Sicilian structure. White gets kingside chances, Black fights on the queenside. ",
      "White has the bishop pair, but Black's knights are well-placed. "
    ];
    commentary += positionalComments[Math.floor(Math.random() * positionalComments.length)];
  }
  
  // Fallback - natural phrases from script with variations
  if (!commentary.trim()) {
    const fallbackPhrases = [
      `${move.san}. `,
      `${move.san}. Let's see what happens. `,
      `${move.san}. Here we go. `,
      `${move.san}. Now this is where it gets interesting. `,
      `${move.san}. Alright, so... `,
      `${move.san}. Okay. `,
      `${move.san}. And there's the idea. `
    ];
    commentary = fallbackPhrases[Math.floor(Math.random() * fallbackPhrases.length)];
  }
  
  return commentary.trim();
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


function generateGameSummary(mistakes, blunders, inaccuracies, openingMoves, keyMoments = [], analyzedMovesCount = null) {
  const totalErrors = mistakes + blunders + inaccuracies;
  
  // Use analyzed moves count if provided, otherwise fall back to moves.length
  // Convert half-moves to full moves: e4 e5 = 1 full move (not 2)
  // Round up since games can end on either player's turn
  const moveCount = analyzedMovesCount !== null ? analyzedMovesCount : moves.length;
  const fullMoves = Math.ceil(moveCount / 2);
  
  let summary = '';
  
  // Game length context - use full moves for display
  if (fullMoves < 30) {
    summary += `This was a quick ${fullMoves} move game. `;
  } else if (fullMoves > 60) {
    summary += `This was a long battle with ${fullMoves} moves. `;
  } else {
    summary += `This ${fullMoves} move game had some interesting moments. `;
  }
  
  // What went well - brilliant moves
  const brilliantMoves = keyMoments.filter(m => m.type === 'brilliant');
  if (brilliantMoves.length > 0) {
    summary += `You played ${brilliantMoves.length} excellent move${brilliantMoves.length > 1 ? 's' : ''} that the engine really liked. `;
  }
  
  // Opening assessment
  if (openingMoves >= 15 && inaccuracies <= 2) {
    summary += 'You handled the opening well. ';
  } else if (openingMoves < 10) {
    summary += 'The game ended quickly, so the opening phase was brief. ';
  }
  
  // What went wrong - detailed feedback
  if (blunders > 0) {
    const blunderMoments = keyMoments.filter(m => m.type === 'blunder');
    if (blunderMoments.length > 0) {
      const firstBlunder = blunderMoments[0];
      summary += `The biggest issue was around move ${firstBlunder.moveIndex + 1} where ${firstBlunder.player.toLowerCase()} made a critical blunder. `;
      if (firstBlunder.bestMove) {
        summary += `${firstBlunder.bestMove} would have been much better. `;
      }
  } else {
      summary += `You had ${blunders} major blunder${blunders > 1 ? 's' : ''} that really hurt your position. `;
    }
  } else if (mistakes > 0) {
    summary += `You made ${mistakes} mistake${mistakes > 1 ? 's' : ''} that gave your opponent chances. `;
  } else if (inaccuracies > 0) {
    summary += `Just ${inaccuracies} small inaccurac${inaccuracies === 1 ? 'y' : 'ies'} - pretty clean play overall! `;
  } else {
    summary += 'Both players made solid moves throughout! ';
  }
  
  // Turning points
  const turningPoints = keyMoments.filter(m => m.type === 'turning-point');
  if (turningPoints.length > 0) {
    summary += `There ${turningPoints.length === 1 ? 'was' : 'were'} ${turningPoints.length} major turning point${turningPoints.length > 1 ? 's' : ''} where the game shifted. `;
  }
  
  // Overall assessment
  if (totalErrors === 0) {
    summary += 'Excellent game with no major errors! ';
  } else if (totalErrors <= 2 && blunders === 0) {
    summary += 'Overall, this was a strong performance. ';
  } else if (blunders <= 1 && mistakes <= 2) {
    summary += 'With a bit more care, this could have been even better. ';
  } else {
    summary += 'Focus on avoiding those critical mistakes next time. ';
  }
  
  return summary.trim();
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
  
  // Get game URL from Site or GameId header
  let gameUrl = null;
  if (headers.Site) {
    // Extract URL from Site header (e.g., "https://lichess.org/WlCDfwJH")
    const urlMatch = headers.Site.match(/https?:\/\/lichess\.org\/([a-zA-Z0-9]+)/);
    if (urlMatch) {
      gameUrl = urlMatch[0];
    }
  } else if (headers.GameId) {
    // Use GameId to construct URL
    gameUrl = `https://lichess.org/${headers.GameId}`;
  }
  
  // Create the metadata display
  const metaText = metaInfo.join(' • ');
  
  if (gameUrl) {
    // Create a link to the game
    metaEl.innerHTML = `<a href="${gameUrl}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline; cursor: pointer;">${metaText}</a>`;
  } else {
    // No URL available, just show text
    metaEl.textContent = metaText;
  }
}

function resetToStart() {
  currentMoveIndex = -1;
  chess.reset();
  board.position('start');
  updateMoveHighlight();
  clearMoveHighlights();
  updateEvaluation(0);
}

async function goToMove(index, isAutoPlay = false) {
  if (index < -1 || index >= moves.length) return;
  
  // Stop any currently playing audio/speech (unless auto-playing)
  if (!isAutoPlay) {
    stopCurrentAudio();
  } else {
    // For auto-play, just stop current audio but don't pause playback
    stopCurrentAudio();
  }
  
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
    const mate = eval.mate !== undefined ? eval.mate : null;
    // Use the evaluation after this move (which is stored in analysisData[index])
    updateEvaluation(cp, true, mate);
    const evalStr = mate !== null ? `M${mate > 0 ? '+' : ''}${mate}` : `${(cp/100).toFixed(1)}`;
    console.log(`📊 Move ${index + 1}: Updating eval bar to ${evalStr}`);
  } else if (index === -1) {
    // Starting position - equal
    updateEvaluation(0, false);
    // Show game summary when at start
    displayGameSummary();
  } else {
    // Move not analyzed yet
    updateEvaluation(0, false);
  }
  
  // Update move analysis panel
  updateMoveAnalysisPanel(index);
  
  // Speak the move - await if in auto-play mode to ensure speech completes
  if (voiceEnabled && synth) {
    if (isAutoPlay) {
      // In auto-play mode, wait for speech to complete
      await speakMoveWithAnalysis(index);
    } else {
      // In manual mode, don't wait (user can navigate freely)
    speakMoveWithAnalysis(index);
    }
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
      // Scroll within the moves container only, not the whole page
      const movesContainer = document.getElementById('movesList');
      if (movesContainer) {
        const containerTop = movesContainer.scrollTop;
        const containerHeight = movesContainer.clientHeight;
        const cellTop = activeCell.offsetTop - movesContainer.offsetTop;
        const cellHeight = activeCell.offsetHeight;
        // Only scroll if cell is outside visible area of container
        if (cellTop < containerTop) {
          movesContainer.scrollTop = cellTop;
        } else if (cellTop + cellHeight > containerTop + containerHeight) {
          movesContainer.scrollTop = cellTop + cellHeight - containerHeight;
        }
      }
    }
    
    // Update the move analysis panel
    updateMoveAnalysisPanel(currentMoveIndex);
  } else {
    // Reset analysis panel
    resetMoveAnalysisPanel();
  }
}

function updateMoveAnalysisPanel(moveIndex) {
  // Handle start position - show game summary
  if (moveIndex === -1) {
    displayGameSummary();
    return;
  }
  
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
  if (analysis) {
    const mate = analysis.mate !== undefined && analysis.mate !== null ? analysis.mate : null;
    const cp = analysis.cp !== undefined ? analysis.cp : 0;
    
    if (mate !== null) {
      // Mate score
      evalEl.textContent = `M${mate > 0 ? '+' : ''}${mate}`;
      evalEl.className = 'analysis-eval' + (mate > 0 ? ' winning' : ' losing');
    evalEl.style.display = 'block';
      updateEvaluation(cp, true, mate);
    } else if (analysis.cp !== undefined) {
      // CP score
      const displayCp = cp / 100; // Convert to pawns for display
      evalEl.textContent = displayCp > 0 ? `+${displayCp.toFixed(1)}` : displayCp.toFixed(1);
      evalEl.className = 'analysis-eval' + (displayCp > 1 ? ' winning' : displayCp < -1 ? ' losing' : '');
      evalEl.style.display = 'block';
      updateEvaluation(cp, true);
  } else {
    evalEl.style.display = 'none';
      updateEvaluation(0, false);
    }
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

function updateEvaluation(cp, isFromStockfish = true, mate = null) {
  const evalBar = document.getElementById('evalBar');
  const evalText = document.getElementById('evalText');
  
  if (!evalBar || !evalText) {
    console.warn('⚠️ Eval bar elements not found:', { evalBar: !!evalBar, evalText: !!evalText });
    return;
  }
  
  // Handle mate scores - Stockfish reports from White's perspective
  let evalStr;
  if (mate !== null && mate !== undefined) {
    // Mate score: M+5 = White mates in 5, M-5 = Black mates in 5
    evalStr = `M${mate > 0 ? '+' : ''}${mate}`;
  } else {
  // Convert centipawns to display value
    // Stockfish reports from White's perspective: positive = White better
  const displayValue = cp / 100;
    evalStr = displayValue > 0 ? `+${displayValue.toFixed(1)}` : displayValue.toFixed(1);
  }
  
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
  // For mate positions, use extreme values
  let clampedCp = cp;
  if (mate !== null && mate !== undefined) {
    // Mate positions: use extreme CP values for visualization
    clampedCp = mate > 0 ? 1000 : -1000;
  } else {
  // Clamp cp to reasonable range (-1000 to +1000 centipawns)
    clampedCp = Math.max(-1000, Math.min(1000, cp));
  }
  
  // Convert to percentage: +1000cp = 100% white, -1000cp = 0% white (100% black)
  // Stockfish reports from White's perspective, so this is correct
  const whitePercentage = 50 + (clampedCp / 20); // 50% base, ±50% for ±1000cp
  
  // White fills from bottom up
  const clampedPercentage = Math.max(0, Math.min(100, whitePercentage));
  evalBar.style.height = `${clampedPercentage}%`;
  evalBar.style.bottom = '0';
  evalBar.style.top = 'auto';
  evalBar.className = 'eval-fill'; // Keep the CSS class name
  
  // Debug log to verify updates
  console.log(`📊 Eval bar updated: cp=${cp}, mate=${mate}, percentage=${clampedPercentage.toFixed(1)}%`);
}

async function playMoves() {
  if (isPlaying) return;
  
  isPlaying = true;
  updatePlayPauseButton();
  
  // Speak intro summary if starting from beginning
  if (currentMoveIndex === -1 && gameSummary) {
    await speakGameIntro();
    // Wait a bit after intro finishes before starting moves
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Check if still playing after intro
  if (!isPlaying) return;
  
  // Play moves sequentially, waiting for each to complete
  playNextMove();
}

async function playNextMove() {
  // Check if we should continue playing
  if (!isPlaying) return;
  
  // Check if there are more moves
  if (currentMoveIndex >= moves.length - 1) {
      stopMoves();
    return;
  }
  
  // Advance to next move - this will await speech completion in auto-play mode
  const nextIndex = currentMoveIndex + 1;
  await goToMove(nextIndex, true); // true = auto-play mode, await to ensure speech completes
  
  // Small pause after speech before next move
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Continue to next move if still playing
  if (isPlaying) {
    playNextMove();
  }
}

async function waitForSpeechToComplete() {
  // Wait for ElevenLabs speech to complete
  if (currentSpeechPromise) {
    try {
      await currentSpeechPromise;
    } catch (e) {
      // Speech was cancelled or failed, continue anyway
    }
  }
  
  // Wait for Google TTS audio to complete
  if (currentAudio) {
    await new Promise((resolve) => {
      if (currentAudio) {
        currentAudio.onended = resolve;
        currentAudio.onerror = resolve;
        // If already ended, resolve immediately
        if (currentAudio.ended) {
          resolve();
        }
      } else {
        resolve();
      }
    });
  }
  
  // Wait for browser TTS to complete
  if (synth && synth.speaking) {
    await new Promise((resolve) => {
      const checkSpeaking = setInterval(() => {
        if (!synth.speaking) {
          clearInterval(checkSpeaking);
          resolve();
        }
      }, 100);
      
      // Timeout after 10 seconds to prevent infinite waiting
      setTimeout(() => {
        clearInterval(checkSpeaking);
        resolve();
      }, 10000);
    });
  }
}

async function speakGameIntro() {
  if (!gameSummary || !voiceEnabled) return;
  
  // Stop any current audio first
  stopCurrentAudio();
  
  // Create a friendly game intro
  let intro = "Let's review this game! ";
  intro += gameSummary;
  
  // Try ElevenLabs first
  if (typeof window.speakWithElevenLabs === 'function') {
    try {
      const speechPromise = window.speakWithElevenLabs(intro);
      currentSpeechPromise = speechPromise;
      const success = await speechPromise;
      currentSpeechPromise = null;
      
      // Check if we moved away from start position
      if (currentMoveIndex !== -1) {
        console.log('⚠️ Moved away from start during intro');
        return;
      }
      
      if (success) {
        // Wait a bit after speech finishes to ensure it's done
        await new Promise(resolve => setTimeout(resolve, 1000));
        return;
      }
    } catch (e) {
      currentSpeechPromise = null;
      console.log('ElevenLabs intro failed, using fallback');
    }
  }
  
  // Fallback to browser TTS
  if (synth && selectedVoice) {
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(intro);
    utterance.voice = selectedVoice;
    utterance.rate = 1.0;
    
    // Wait for speech to finish
    await new Promise((resolve) => {
      utterance.onend = () => {
        setTimeout(resolve, 500); // Small pause after speech
      };
      utterance.onerror = () => {
        setTimeout(resolve, 500);
      };
      synth.speak(utterance);
    });
  }
}

function pauseMoves() {
  isPlaying = false;
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
  updatePlayPauseButton();
}

function updatePlayPauseButton() {
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  
  if (playBtn && pauseBtn) {
    if (isPlaying) {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-block';
    } else {
      playBtn.style.display = 'inline-block';
      pauseBtn.style.display = 'none';
    }
  }
}

function stopMoves() {
  pauseMoves();
  resetToStart();
  updatePlayPauseButton();
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
  // If playing, just pause and go to next
  // If not playing, just go to next without pausing
  if (isPlaying) {
  pauseMoves();
  }
  if (currentMoveIndex < moves.length - 1) {
    goToMove(currentMoveIndex + 1);
  }
}

// Stop any currently playing audio
function stopCurrentAudio() {
  // Stop ElevenLabs audio if playing
  if (typeof window !== 'undefined' && window.currentElevenLabsAudio) {
    try {
      window.currentElevenLabsAudio.pause();
      window.currentElevenLabsAudio.currentTime = 0;
      if (window.currentElevenLabsAudio.src && window.currentElevenLabsAudio.src.startsWith('blob:')) {
        URL.revokeObjectURL(window.currentElevenLabsAudio.src);
      }
      window.currentElevenLabsAudio = null;
    } catch (e) {
      console.warn('Error stopping ElevenLabs audio:', e);
    }
  }
  
  // Stop Google TTS audio if playing
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      if (currentAudio.src && currentAudio.src.startsWith('blob:')) {
        URL.revokeObjectURL(currentAudio.src);
      }
      currentAudio = null;
    } catch (e) {
      console.warn('Error stopping Google TTS audio:', e);
    }
  }
  
  // Cancel speech synthesis
  if (synth && synth.speaking) {
    synth.cancel();
  }
  
  // Cancel any pending speech promise
  if (currentSpeechPromise) {
    currentSpeechPromise = null;
  }
}

async function speakMoveWithAnalysis(moveIndex) {
  if (moveIndex < 0 || moveIndex >= moves.length) return;
  
  // Stop any previous audio before starting new one
  stopCurrentAudio();
  
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
      console.log('🎙️ Attempting to speak with ElevenLabs...');
      const speechPromise = window.speakWithElevenLabs(text);
      currentSpeechPromise = speechPromise;
      const success = await speechPromise;
      currentSpeechPromise = null;
      
      // Check if we were interrupted
      if (currentMoveIndex !== moveIndex) {
        console.log('⚠️ Move changed during speech, stopping');
        return;
      }
      
      if (success) {
        console.log('✅ Spoke with ElevenLabs (premium voice)');
        return;
      } else {
        console.warn('⚠️ ElevenLabs returned false, trying fallback');
      }
    } catch (error) {
      currentSpeechPromise = null;
      console.error('❌ ElevenLabs error:', error.message);
      console.error('Full error:', error);
      console.log('💡 Falling back to browser TTS');
    }
  } else {
    console.warn('⚠️ speakWithElevenLabs function not available, using fallback');
  }
  
  // Check if we were interrupted before trying fallback
  if (currentMoveIndex !== moveIndex) {
    console.log('⚠️ Move changed, stopping fallback');
    return;
  }
  
  // Fallback to Google TTS
  if (useGoogleTTS) {
    const success = await speakWithGoogleTTS(text);
    
    // Check if we were interrupted
    if (currentMoveIndex !== moveIndex) {
      console.log('⚠️ Move changed during Google TTS');
      return;
    }
    
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
