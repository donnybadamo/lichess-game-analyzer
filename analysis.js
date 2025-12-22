// Analysis page script

let chess = null;
let board = null;
let stockfish = null;
let moves = [];
let currentMoveIndex = -1;
let analysisData = [];
let moveCommentary = []; // Store commentary for each move
let gameSummary = null;
let isPlaying = false;
let playInterval = null;
let voiceEnabled = true;
let synth = window.speechSynthesis;
let selectedVoice = null;
let useGoogleTTS = false;
let googleTTSApiKey = null;

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
  
  // Show PGN input section
  const pgnInputSection = document.getElementById('pgnInputSection');
  if (pgnInputSection) {
    pgnInputSection.style.display = 'block';
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
          // Hide PGN input section after successful analysis
          const pgnInputSection = document.getElementById('pgnInputSection');
          if (pgnInputSection) {
            pgnInputSection.style.display = 'none';
          }
        } else {
          // Show PGN input section instead of error
          const pgnInputSection = document.getElementById('pgnInputSection');
          if (pgnInputSection) {
            pgnInputSection.style.display = 'block';
            console.log('Showing PGN input section (no PGN found)');
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
    
    // Hide PGN input section if we got PGN from URL
    const pgnInputSection = document.getElementById('pgnInputSection');
    if (pgnInputSection) {
      pgnInputSection.style.display = 'none';
      console.log('Hiding PGN input section (PGN from URL)');
    }
  } else {
    // Show PGN input section if no PGN provided
    const pgnInputSection = document.getElementById('pgnInputSection');
    if (pgnInputSection) {
      pgnInputSection.style.display = 'block';
      console.log('Showing PGN input section (no PGN in URL)');
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
        return chrome.runtime.getURL(`libs/pieces/${pieceName}.png`);
      };
      
      board = window.Chessboard('board', {
        position: 'start',
        draggable: false,
        pieceTheme: pieceTheme
      });
      
      console.log('Chessboard initialized with Cloudflare CDN pieces:', pieceTheme);
      
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
    const voiceToggle = document.getElementById('voiceToggle');
    
    if (playBtn) playBtn.addEventListener('click', playMoves);
    if (pauseBtn) pauseBtn.addEventListener('click', pauseMoves);
    if (stopBtn) stopBtn.addEventListener('click', stopMoves);
    if (prevBtn) prevBtn.addEventListener('click', previousMove);
    if (nextBtn) nextBtn.addEventListener('click', nextMove);
    if (voiceToggle) {
      voiceToggle.addEventListener('change', (e) => {
        voiceEnabled = e.target.checked;
      });
    }
    
    // PGN input handler
    const analyzePgnBtn = document.getElementById('analyzePgnBtn');
    const pgnInput = document.getElementById('pgnInput');
    const pgnInputSection = document.getElementById('pgnInputSection');
    
    console.log('PGN input elements:', {
      analyzePgnBtn: !!analyzePgnBtn,
      pgnInput: !!pgnInput,
      pgnInputSection: !!pgnInputSection,
      sectionDisplay: pgnInputSection ? window.getComputedStyle(pgnInputSection).display : 'N/A'
    });
    
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
          
          // Hide input section after successful analysis
          if (pgnInputSection) {
            pgnInputSection.style.display = 'none';
          }
        } catch (error) {
          console.error('Error analyzing PGN:', error);
          alert('Error analyzing PGN: ' + error.message);
          analyzePgnBtn.disabled = false;
          analyzePgnBtn.textContent = 'Analyze PGN';
        }
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

function resetGameState() {
  // Reset all game state variables
  chess = null;
  board = null;
  moves = [];
  currentMoveIndex = -1;
  analysisData = [];
  moveCommentary = [];
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
      // Load Stockfish as a Web Worker (use local file)
      const stockfishUrl = chrome.runtime.getURL('libs/stockfish.js');
      stockfish = new Worker(stockfishUrl);
      
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
      
      // Timeout fallback
      setTimeout(() => {
        if (!ready) {
          console.warn('Stockfish initialization timeout, continuing anyway');
          resolve();
        }
      }, 5000);
    } catch (e) {
      console.error('Could not initialize Stockfish:', e);
      // Continue without Stockfish - analysis will be limited
      resolve();
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
    
    // Container for move number, text, and annotation
    const moveRow = document.createElement('div');
    moveRow.style.display = 'flex';
    moveRow.style.alignItems = 'center';
    moveRow.style.gap = '10px';
    moveRow.style.width = '100%';
    
    const moveNumberSpan = document.createElement('span');
    moveNumberSpan.className = 'move-number';
    moveNumberSpan.textContent = isWhite ? `${moveNumber}.` : '';
    
    const moveTextSpan = document.createElement('span');
    moveTextSpan.className = 'move-text';
    moveTextSpan.textContent = move.san;
    
    const annotationSpan = document.createElement('span');
    annotationSpan.className = 'move-annotation';
    annotationSpan.id = `annotation-${i}`;
    annotationSpan.style.marginLeft = 'auto';
    
    moveRow.appendChild(moveNumberSpan);
    moveRow.appendChild(moveTextSpan);
    moveRow.appendChild(annotationSpan);
    
    // Add commentary container
    const commentaryDiv = document.createElement('div');
    commentaryDiv.className = 'move-commentary';
    commentaryDiv.id = `commentary-${i}`;
    commentaryDiv.style.display = 'none';
    
    moveItem.appendChild(moveRow);
    moveItem.appendChild(commentaryDiv);
    
    moveItem.addEventListener('click', () => {
      goToMove(i);
    });
    
    movesList.appendChild(moveItem);
  }
}

async function analyzeGame() {
  if (!stockfish) {
    console.log('Stockfish not available, skipping detailed analysis');
    // Still show basic info
    for (let i = 0; i < moves.length; i++) {
      analysisData[i] = { cp: 0, depth: 0, bestMove: null };
      moveCommentary[i] = 'Analysis unavailable';
    }
    return;
  }
  
  const ChessClass = window.Chess;
  const tempChess = new ChessClass();
  
  // Show loading indicator
  const movesList = document.getElementById('movesList');
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'analysis-loading';
  loadingDiv.style.cssText = 'padding: 20px; text-align: center; color: #ff6b35;';
  loadingDiv.textContent = 'Analyzing game... This may take a minute.';
  movesList.parentElement.insertBefore(loadingDiv, movesList);
  
  let totalMistakes = 0;
  let totalBlunders = 0;
  let totalInaccuracies = 0;
  let openingPhase = true;
  let openingMoves = 0;
  
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    tempChess.move(move);
    
    // Analyze position
    const evaluation = await getPositionEvaluation(tempChess.fen(), i);
    analysisData[i] = evaluation;
    
    // Generate commentary for this move
    const commentary = generateMoveCommentary(i, move, evaluation, tempChess);
    moveCommentary[i] = commentary;
    
    // Update annotation and commentary display
    updateMoveAnnotation(i, evaluation);
    updateMoveCommentary(i, commentary);
    
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
  
  // Remove loading indicator
  loadingDiv.remove();
}

async function getPositionEvaluation(fen, moveIndex) {
  if (!stockfish) {
    return { cp: 0, depth: 0, bestMove: null, annotation: '', moveIndex: moveIndex };
  }

  return new Promise((resolve) => {
    let bestMove = null;
    let evaluation = null;
    let depth = 0;
    let bestDepth = 0;
    let pv = [];
    let handler = null;
    
    const timeout = setTimeout(() => {
      if (handler && stockfish.removeEventListener) {
        stockfish.removeEventListener('message', handler);
      }
      const result = { 
        cp: evaluation?.cp || 0, 
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
      
      resolve(result);
    }, 2000); // 2 second timeout per position
    
    handler = (event) => {
      const message = event.data || event;
      
      if (typeof message === 'string') {
        // Parse evaluation
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
        
        if (pvMatch) {
          pv = pvMatch[1].split(' ');
          if (!bestMove) bestMove = pv[0];
        }
        
        // Stop when we have enough depth
        if (depth >= 12 && evaluation) {
          clearTimeout(timeout);
          if (stockfish.removeEventListener) {
            stockfish.removeEventListener('message', handler);
          }
          
          const result = { 
            ...evaluation, 
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
          
          resolve(result);
        }
      }
    };
    
    // Store original handler
    const originalHandler = stockfish.onmessage;
    stockfish.onmessage = handler;
    
    stockfish.postMessage(`position fen ${fen}`);
    stockfish.postMessage('go depth 15');
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
  
  // Opening phase commentary
  if (moveIndex < 10) {
    const piece = move.piece.toUpperCase();
    const to = move.to;
    
    if (moveIndex === 0) {
      commentary = `${player} opens with ${move.san}. `;
    } else if (moveIndex < 6) {
      commentary = `${player} plays ${move.san}, developing the ${piece === 'N' ? 'knight' : piece === 'B' ? 'bishop' : piece.toLowerCase()}. `;
    }
  }
  
  // Analyze the move quality
  if (evaluation.annotation === '!!') {
    commentary += `This is a blunder! ${player} loses significant advantage. `;
    if (evaluation.bestMove && evaluation.bestMove !== move.san) {
      commentary += `The best move was ${evaluation.bestMove}. `;
    }
  } else if (evaluation.annotation === '!') {
    if (prevEval && Math.abs((evaluation.cp || 0) - (prevEval.cp || 0)) > 100) {
      commentary += `Mistake by ${player}. `;
    } else {
      commentary += `Excellent move! ${player} finds a strong continuation. `;
    }
  } else if (evaluation.annotation === '?!') {
    commentary += `Inaccuracy. ${player} could have played more precisely. `;
  }
  
  // Tactical commentary
  if (move.captured) {
    commentary += `${player} captures the ${move.captured.toUpperCase()} on ${move.to}. `;
  }
  
  if (move.san.includes('+')) {
    commentary += `${player} delivers a check! `;
  }
  
  if (move.san.includes('#')) {
    commentary += `Checkmate! ${player} wins the game! `;
  }
  
  // Positional commentary
  const fen = chessInstance.fen();
  if (evaluation.bestMove && evaluation.bestMove !== move.san) {
    // Try to explain why the best move is better
    const bestMoveCommentary = explainBestMove(evaluation.bestMove, move.san, chessInstance);
    if (bestMoveCommentary) {
      commentary += bestMoveCommentary;
    }
  }
  
  // Strategic commentary based on evaluation
  const cp = evaluation.cp || 0;
  if (Math.abs(cp) > 200) {
    const leading = cp > 0 ? 'White' : 'Black';
    commentary += `${leading} has a significant advantage in this position. `;
  }
  
  return commentary.trim() || `${player} plays ${move.san}.`;
}

function explainBestMove(bestMove, playedMove, chessInstance) {
  // Simple explanation based on move patterns
  if (bestMove.includes('x') && !playedMove.includes('x')) {
    return `The best move was to capture with ${bestMove}, creating a tactical opportunity. `;
  }
  
  if (bestMove.includes('+') && !playedMove.includes('+')) {
    return `The best move was ${bestMove}, giving check and maintaining the initiative. `;
  }
  
  if (bestMove.length > playedMove.length) {
    return `The best move ${bestMove} was more precise, improving the position. `;
  }
  
  return `The best move was ${bestMove}. `;
}

function generateGameSummary(mistakes, blunders, inaccuracies, openingMoves) {
  const totalErrors = mistakes + blunders + inaccuracies;
  const accuracy = moves.length > 0 ? Math.max(0, 100 - (totalErrors / moves.length * 100)) : 0;
  
  let summary = '';
  
  // Opening assessment
  if (openingMoves >= 10) {
    summary += 'You played a solid opening, developing your pieces well. ';
  } else {
    summary += 'The opening phase was brief. ';
  }
  
  // Middle game assessment
  const middleGameMoves = Math.floor(moves.length / 3);
  if (middleGameMoves > 0) {
    if (blunders === 0 && mistakes <= 2) {
      summary += 'Your middle game was strong, with few tactical errors. ';
    } else if (blunders > 0) {
      summary += `The middle game had ${blunders} critical blunder${blunders > 1 ? 's' : ''} that changed the course of the game. `;
    }
  }
  
  // Overall assessment
  if (accuracy >= 85) {
    summary += 'Overall, this was an excellent game with high accuracy. ';
  } else if (accuracy >= 70) {
    summary += 'This was a good game with room for improvement. ';
  } else {
    summary += 'This game had several mistakes that could be improved. ';
  }
  
  // Key moments
  if (blunders > 0) {
    summary += `Watch out for blunders - you had ${blunders} critical mistake${blunders > 1 ? 's' : ''}. `;
  }
  
  return summary;
}

function updateMoveAnnotation(moveIndex, evaluation) {
  const annotationEl = document.getElementById(`annotation-${moveIndex}`);
  if (!annotationEl || !evaluation) return;
  
  annotationEl.innerHTML = '';
  
  if (evaluation.annotation) {
    const icon = document.createElement('span');
    icon.className = `annotation-icon ${getAnnotationClass(evaluation.annotation)}`;
    icon.textContent = evaluation.annotation;
    icon.title = getAnnotationTitle(evaluation.annotation);
    annotationEl.appendChild(icon);
  }
  
  // Show evaluation if available
  if (evaluation.cp !== undefined && evaluation.cp !== 0) {
    const evalSpan = document.createElement('span');
    evalSpan.className = 'move-eval';
    const cp = evaluation.cp / 100;
    evalSpan.textContent = cp > 0 ? `+${cp.toFixed(1)}` : cp.toFixed(1);
    annotationEl.appendChild(evalSpan);
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
  const commentaryEl = document.getElementById(`commentary-${moveIndex}`);
  if (commentaryEl && commentary) {
    commentaryEl.textContent = commentary;
    commentaryEl.style.display = 'block';
  }
}

function displayGameSummary() {
  const gameInfo = document.getElementById('gameInfo');
  if (gameSummary) {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'game-summary';
    summaryDiv.innerHTML = `<h3>Game Summary</h3><p>${gameSummary}</p>`;
    gameInfo.appendChild(summaryDiv);
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
  
  currentMoveIndex = index;
  chess.reset();
  
  for (let i = 0; i <= index; i++) {
    chess.move(moves[i]);
  }
  
  const position = chess.fen();
  board.position(position);
  
  updateMoveHighlight();
  
  if (index >= 0 && analysisData[index]) {
    const eval = analysisData[index];
    const cp = eval.cp || 0;
    updateEvaluation(cp);
  } else {
    updateEvaluation(0);
  }
  
  // Speak the move
  if (voiceEnabled && synth) {
    speakMoveWithAnalysis(index);
  }
}

function updateMoveHighlight() {
  document.querySelectorAll('.move-item').forEach(item => {
    item.classList.remove('active');
  });
  
  if (currentMoveIndex >= 0) {
    const activeItem = document.querySelector(`[data-move-index="${currentMoveIndex}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

function updateEvaluation(cp) {
  const evalBar = document.getElementById('evalBar');
  const evalText = document.getElementById('evalText');
  
  if (!evalBar || !evalText) return;
  
  // Convert centipawns to display value
  const displayValue = cp / 100;
  evalText.textContent = displayValue > 0 ? `+${displayValue.toFixed(1)}` : displayValue.toFixed(1);
  
  // Update bar (vertical bar, 50% is equal, 0% = black winning, 100% = white winning)
  // Clamp cp to reasonable range (-1000 to +1000 centipawns)
  const clampedCp = Math.max(-1000, Math.min(1000, cp));
  const percentage = 50 + (clampedCp / 20); // 50% base, ±50% for ±1000cp
  
  if (cp > 0) {
    // White advantage - bar from bottom
    evalBar.style.bottom = '0';
    evalBar.style.top = 'auto';
    evalBar.style.height = `${Math.max(0, Math.min(100, percentage))}%`;
    evalBar.className = 'eval-fill';
  } else {
    // Black advantage - bar from top
    evalBar.style.top = '0';
    evalBar.style.bottom = 'auto';
    evalBar.style.height = `${Math.max(0, Math.min(100, 100 - percentage))}%`;
    evalBar.className = 'eval-fill black-leading';
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
  
  // Play first move if at start
  if (currentMoveIndex === -1) {
    nextMove();
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
