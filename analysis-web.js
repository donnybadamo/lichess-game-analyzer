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

// Password protection for premium voice
const VOICE_PASSWORD = 'badamo';
let premiumVoiceUnlocked = false;
let selectedVoiceType = 'browser'; // 'browser' or 'donny'

// Example game PGN to load on first page visit
const EXAMPLE_GAME_PGN = `[Event "rated blitz game"]
[Site "https://lichess.org/V2Y1nkCJ"]
[Date "2026.01.08"]
[Round "-"]
[White "IIOhManII"]
[Black "zinoukorrichi"]
[Result "1-0"]
[GameId "V2Y1nkCJ"]
[UTCDate "2026.01.08"]
[UTCTime "00:45:25"]
[WhiteElo "1793"]
[BlackElo "1805"]
[WhiteRatingDiff "+6"]
[BlackRatingDiff "-8"]
[Variant "Standard"]
[TimeControl "180+2"]
[ECO "A00"]
[Opening "Polish Opening: Schiffler-Sokolsky Variation"]
[Termination "Normal"]
[Annotator "lichess.org"]

1. b4 { [%eval -0.07] [%clk 0:03:00] } 1... Nf6 { [%eval -0.11] [%clk 0:03:00] } 2. Bb2 { [%eval -0.1] [%clk 0:03:00] } 2... e6 { [%eval -0.03] [%clk 0:03:02] } 3. b5 { [%eval -0.09] [%clk 0:02:59] } 3... d5 { [%eval -0.07] [%clk 0:03:02] } 4. e3 { [%eval -0.03] [%clk 0:03:00] } { A00 Polish Opening: Schiffler-Sokolsky Variation } 4... Bd6 { [%eval 0.0] [%clk 0:03:03] } 5. Nf3 { [%eval -0.04] [%clk 0:03:01] } 5... O-O { [%eval -0.04] [%clk 0:03:04] } 6. c4 { [%eval -0.13] [%clk 0:03:01] } 6... a6 { [%eval -0.15] [%clk 0:03:01] } 7. a4 { [%eval -0.06] [%clk 0:02:59] } 7... c6 { [%eval 0.0] [%clk 0:02:58] } 8. Be2 { [%eval -0.05] [%clk 0:02:55] } 8... cxb5 { [%eval 0.25] [%clk 0:02:58] } 9. cxb5 { [%eval -0.15] [%clk 0:02:56] } 9... axb5 { [%eval -0.17] [%clk 0:02:58] } 10. Bxb5 { [%eval -0.17] [%clk 0:02:58] } 10... Bd7 { [%eval -0.13] [%clk 0:02:56] } 11. Nc3 { [%eval -0.11] [%clk 0:02:58] } 11... Nc6 { [%eval -0.11] [%clk 0:02:53] } 12. O-O { [%eval -0.2] [%clk 0:02:57] } 12... Ne5 { [%eval -0.03] [%clk 0:02:34] } 13. Nxe5 { [%eval 0.0] [%clk 0:02:54] } 13... Bxe5 { [%eval -0.06] [%clk 0:02:34] } 14. f4 { [%eval -0.08] [%clk 0:02:50] } 14... Bxb5 { [%eval -0.09] [%clk 0:02:29] } 15. fxe5?? { (-0.09 → -2.00) Blunder. axb5 was best. } { [%eval -2.0] [%clk 0:02:40] } (15. axb5) 15... Bxf1 { [%eval -2.0] [%clk 0:02:28] } 16. exf6 { [%eval -1.93] [%clk 0:02:41] } 16... Bd3 { [%eval -1.67] [%clk 0:02:19] } 17. fxg7 { [%eval -2.07] [%clk 0:02:41] } 17... Re8 { [%eval -2.04] [%clk 0:02:18] } 18. Qh5 { [%eval -2.48] [%clk 0:02:22] } 18... Qf6 { [%eval -2.14] [%clk 0:02:09] } 19. Ra2?? { (-2.14 → Mate in 1) Checkmate is now unavoidable. h3 was best. } { [%eval #-1] [%clk 0:01:43] } (19. h3 Rac8 20. Qg4 Rc4 21. Qg3 Rb4 22. Ra2 d4 23. exd4 Qxd4+ 24. Kh2 Qf4) 19... Qg6?? { (Mate in 1 → -2.42) Lost forced checkmate sequence. Qf1# was best. } { [%eval -2.42] [%clk 0:02:03] } (19... Qf1#) 20. Qf3 { [%eval -3.09] [%clk 0:01:35] } 20... e5 { [%eval -2.7] [%clk 0:01:33] } 21. Nxd5?! { (-2.70 → -4.07) Inaccuracy. Ra1 was best. } { [%eval -4.07] [%clk 0:01:23] } (21. Ra1 Rad8 22. h4 Qf5 23. Qxf5 Bxf5 24. Nb5 Kxg7 25. Rc1 Kg6 26. d4 f6) 21... Kxg7?? { (-4.07 → 0.34) Blunder. Ra6 was best. } { [%eval 0.34] [%clk 0:01:04] } (21... Ra6 22. Nb4 Rf6 23. Qxf6 Qxf6 24. Nxd3 Qg6 25. Ra3 f6 26. Rc3 Qg4 27. h3) 22. Nf4 { [%eval 0.44] [%clk 0:01:16] } 22... Qc6?? { (0.44 → 4.90) Blunder. Be4 was best. } { [%eval 4.9] [%clk 0:00:31] } (22... Be4) 23. Qxc6 { [%eval 4.82] [%clk 0:01:02] } 23... bxc6 { [%eval 4.69] [%clk 0:00:29] } 24. Nxd3 { [%eval 4.74] [%clk 0:01:03] } 24... Red8 { [%eval 5.09] [%clk 0:00:26] } 25. Nxe5 { [%eval 5.04] [%clk 0:00:59] } 25... Rxd2 { [%eval 4.91] [%clk 0:00:27] } 26. Nc4+ { [%eval 5.08] [%clk 0:01:00] } { Black resigns. } 1-0`;

/**
 * Check if premium voice is unlocked
 * @returns {Promise<boolean>} True if password is correct
 */
async function checkVoicePassword() {
  // Check if already unlocked in this session
  if (premiumVoiceUnlocked) return true;
  
  // Check sessionStorage (survives page refresh but clears on tab close)
  const stored = sessionStorage.getItem('premiumVoiceUnlocked');
  if (stored === 'true') {
    premiumVoiceUnlocked = true;
    return true;
  }
  
  // Prompt for password
  const password = prompt('🔐 Enter password to use premium voice (ElevenLabs/Google TTS):');
  
  if (password === VOICE_PASSWORD) {
    premiumVoiceUnlocked = true;
    sessionStorage.setItem('premiumVoiceUnlocked', 'true');
    console.log('✅ Premium voice unlocked');
    return true;
  } else if (password !== null) {
    // User entered password but it was wrong
    alert('❌ Incorrect password. Using browser voice instead.');
    console.log('❌ Incorrect password, using browser voice');
    return false;
  } else {
    // User cancelled prompt
    console.log('ℹ️ Password prompt cancelled, using browser voice');
    return false;
  }
}

/**
 * Wrapper to check password before using premium voice
 * @param {Function} premiumVoiceFn - Function that returns a Promise<boolean>
 * @returns {Promise<boolean>} True if premium voice was used successfully
 */
async function usePremiumVoiceIfUnlocked(premiumVoiceFn) {
  const unlocked = await checkVoicePassword();
  if (!unlocked) {
    return false; // Will fall back to browser voice
  }
  
  // Password is correct, try premium voice
  try {
    return await premiumVoiceFn();
  } catch (error) {
    console.error('Premium voice error:', error);
    return false; // Fall back to browser voice on error
  }
}

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
  
  // Hide PGN modal on initialization
  const pgnModal = document.getElementById('pgnModal');
  if (pgnModal) {
    pgnModal.style.display = 'none';
  }
  
  initializeVoice();
  
  await waitForLibraries();
  console.log('Libraries ready, setting up event listeners...');
  
  // Setup event listeners first
  setupEventListeners();
  
  // Initialize board on page load (show starting position)
  await initializeBoardWithStartingPosition();
  
  // Show welcome page by default
  updateAnalysisPanelWithIntro();
  
  // Get PGN from URL parameters - only load if explicitly provided in URL
  const urlParams = new URLSearchParams(window.location.search);
  let pgn = urlParams.get('pgn');
  console.log('PGN from URL:', pgn ? 'Found (' + pgn.substring(0, 50) + '...)' : 'Not found');
  
  // Only load game if PGN is explicitly provided in URL
  // Don't auto-load from localStorage or show example game
  // User must click demo button or paste PGN to load a game
  if (pgn) {
    pgn = decodeURIComponent(pgn);
    await initializeGame(pgn);
    
    // Hide PGN modal if we got PGN from URL
    const pgnModal = document.getElementById('pgnModal');
    if (pgnModal) {
      pgnModal.style.display = 'none';
    }
  } else {
    // Show welcome page - user can choose to load demo or paste PGN
    console.log('No PGN in URL - showing welcome page');
    // Welcome page is already shown by updateAnalysisPanelWithIntro() above
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
    
    // Reuse existing board if already initialized, otherwise initialize new one
    if (!board) {
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
        orientation: 'white', // White on bottom (standard orientation)
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
      });
      
      // Ensure white is on bottom
      if (board) {
        board.orientation('white');
        boardOrientation = 'white';
      }
      
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
    } else {
      // Board already exists, just update position
      console.log('Reusing existing board');
      board.position(chess.fen());
    }

    // Initialize Stockfish
    console.log('Initializing Stockfish...');
    await initializeStockfish();
    
    // Update analysis panel (but keep it visible)
    const analysisMove = document.getElementById('analysisMove');
    const analysisText = document.getElementById('analysisText');
    if (analysisMove) {
      analysisMove.textContent = 'Analyzing game...';
    }
    if (analysisText) {
      analysisText.textContent = 'Loading move-by-move analysis...';
    }
    
    // Display moves
    displayMoves();
    displayGameInfo(cleanPgn);
    
    // Analyze game
    console.log('Starting game analysis...');
    await analyzeGame();
    
    // Refresh moves display to show best move suggestions after analysis
    displayMoves();
    
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
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const endBtn = document.getElementById('endBtn');
    const voiceToggle = document.getElementById('voiceToggle');
    const flipBtn = document.getElementById('flipBtn');
    
    // Single play/pause button that toggles
    if (playPauseBtn) {
      // Initialize button state
      playPauseBtn.textContent = '▶';
      playPauseBtn.title = 'Play (Space)';
      
      playPauseBtn.addEventListener('click', () => {
        if (isPlaying) {
          pauseMoves();
        } else {
          playMoves();
        }
      });
    }
    
    if (stopBtn) stopBtn.addEventListener('click', stopMoves);
    if (prevBtn) prevBtn.addEventListener('click', previousMove);
    if (nextBtn) nextBtn.addEventListener('click', nextMove);
    if (endBtn) endBtn.addEventListener('click', goToEnd);
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
        case 'Home':
          e.preventDefault();
          stopMoves(); // Go to start
          break;
        case 'End':
          e.preventDefault();
          goToEnd(); // Go to end
          break;
        case 'ArrowUp':
          e.preventDefault();
          stopMoves(); // Go to start (also works)
          break;
        case 'ArrowDown':
          e.preventDefault();
          goToEnd(); // Go to end (also works)
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
        case 's':
        case 'S':
          e.preventDefault();
          // Toggle voice on/off
          if (voiceToggle) {
            voiceToggle.checked = !voiceToggle.checked;
            voiceEnabled = voiceToggle.checked;
            voiceToggle.dispatchEvent(new Event('change'));
          }
          break;
      }
    });
    
    // Voice dropdown setup
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceDropdown = document.querySelector('.voice-dropdown');
    const voiceDropdownMenu = document.getElementById('voiceDropdownMenu');
    const donnyVoiceOption = document.getElementById('donnyVoiceOption');
    const voiceOptions = document.querySelectorAll('.voice-option');
    
    if (voiceBtn && voiceDropdown) {
      // Toggle dropdown on click
      voiceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        voiceDropdown.classList.toggle('open');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!voiceDropdown.contains(e.target)) {
          voiceDropdown.classList.remove('open');
        }
      });
      
      // Handle voice option selection
      voiceOptions.forEach(option => {
        option.addEventListener('click', async (e) => {
          e.stopPropagation();
          const voiceType = option.dataset.voice;
          
          if (voiceType === 'mute') {
            // Mute option - disable voice
            voiceOptions.forEach(opt => {
              opt.classList.remove('active');
              const existingCheck = opt.querySelector('.voice-option-check');
              if (existingCheck) {
                existingCheck.remove();
              }
            });
            option.classList.add('active');
            if (!option.querySelector('.voice-option-check')) {
              option.insertAdjacentHTML('beforeend', '<span class="voice-option-check">✓</span>');
            }
            
            voiceEnabled = false;
            if (voiceToggle) {
              voiceToggle.checked = false;
            }
            
            // Stop any currently playing speech
            if (synth && synth.speaking) {
              synth.cancel();
            }
            
            // Save to sessionStorage
            sessionStorage.setItem('voiceEnabled', 'false');
            sessionStorage.removeItem('selectedVoiceType');
            
            voiceDropdown.classList.remove('open');
            console.log('Voice muted');
            return;
          }
          
          if (voiceType === 'donny') {
            // Check if unlocked
            if (!donnyVoiceOption.classList.contains('unlocked')) {
              // Show custom password dialog
              showPasswordDialog((success) => {
                if (success) {
                  premiumVoiceUnlocked = true;
                  sessionStorage.setItem('premiumVoiceUnlocked', 'true');
                  donnyVoiceOption.classList.add('unlocked');
                  donnyVoiceOption.classList.remove('locked');
                  const lockEl = donnyVoiceOption.querySelector('.voice-option-lock');
                  if (lockEl) lockEl.innerHTML = '';
                  showToast('success', 'Donny Voice unlocked! Welcome to premium voice narration.');
                  // Continue with selection
                  voiceOptions.forEach(opt => {
                    opt.classList.remove('active');
                    const existingCheck = opt.querySelector('.voice-option-check');
                    if (existingCheck) {
                      existingCheck.remove();
                    }
                  });
                  option.classList.add('active');
                  selectedVoiceType = 'donny';
                  if (!option.querySelector('.voice-option-check')) {
                    option.insertAdjacentHTML('beforeend', '<span class="voice-option-check">✓</span>');
                  }
                  if (voiceToggle) {
                    voiceToggle.checked = true;
                    voiceEnabled = true;
                  }
                  sessionStorage.setItem('selectedVoiceType', selectedVoiceType);
                  sessionStorage.setItem('voiceEnabled', 'true');
                  voiceDropdown.classList.remove('open');
                  console.log('Voice type selected:', selectedVoiceType);
                } else {
                  voiceDropdown.classList.remove('open');
                }
              });
              return; // Don't proceed with selection yet
            }
          }
          
          // Update selection
          voiceOptions.forEach(opt => {
            opt.classList.remove('active');
            const existingCheck = opt.querySelector('.voice-option-check');
            if (existingCheck && opt !== option) {
              existingCheck.remove();
            }
          });
          option.classList.add('active');
          selectedVoiceType = voiceType;
          
          // Add checkmark if not present
          if (!option.querySelector('.voice-option-check')) {
            option.insertAdjacentHTML('beforeend', '<span class="voice-option-check">✓</span>');
          }
          
          // Update voice toggle state (enable when a voice is selected)
          if (voiceToggle) {
            voiceToggle.checked = true;
            voiceEnabled = true;
          }
          
          // Save selection to sessionStorage
          sessionStorage.setItem('selectedVoiceType', selectedVoiceType);
          sessionStorage.setItem('voiceEnabled', 'true');
          
          voiceDropdown.classList.remove('open');
          console.log('Voice type selected:', selectedVoiceType);
        });
      });
      
      // Initialize voice type from sessionStorage
      const storedVoiceType = sessionStorage.getItem('selectedVoiceType');
      const storedUnlocked = sessionStorage.getItem('premiumVoiceUnlocked');
      const storedVoiceEnabled = sessionStorage.getItem('voiceEnabled');
      
      if (storedUnlocked === 'true') {
        premiumVoiceUnlocked = true;
        if (donnyVoiceOption) {
          donnyVoiceOption.classList.add('unlocked');
          donnyVoiceOption.classList.remove('locked');
          const lockEl = donnyVoiceOption.querySelector('.voice-option-lock');
          if (lockEl) lockEl.textContent = '';
        }
      }
      
      // Check if voice is muted
      if (storedVoiceEnabled === 'false') {
        voiceEnabled = false;
        if (voiceToggle) {
          voiceToggle.checked = false;
        }
        // Set mute as active
        voiceOptions.forEach(opt => {
          opt.classList.remove('active');
          if (opt.dataset.voice === 'mute') {
            opt.classList.add('active');
            if (!opt.querySelector('.voice-option-check')) {
              opt.insertAdjacentHTML('beforeend', '<span class="voice-option-check">✓</span>');
            }
          }
        });
      } else if (storedVoiceType === 'donny' && premiumVoiceUnlocked) {
        selectedVoiceType = 'donny';
        voiceEnabled = true;
        if (voiceToggle) {
          voiceToggle.checked = true;
        }
        voiceOptions.forEach(opt => {
          opt.classList.remove('active');
          if (opt.dataset.voice === 'donny') {
            opt.classList.add('active');
            if (!opt.querySelector('.voice-option-check')) {
              opt.insertAdjacentHTML('beforeend', '<span class="voice-option-check">✓</span>');
            }
          }
        });
      } else {
        // Default to browser voice
        selectedVoiceType = 'browser';
        voiceEnabled = true;
        if (voiceToggle) {
          voiceToggle.checked = true;
        }
        voiceOptions.forEach(opt => {
          opt.classList.remove('active');
          if (opt.dataset.voice === 'browser') {
            opt.classList.add('active');
            if (!opt.querySelector('.voice-option-check')) {
              opt.insertAdjacentHTML('beforeend', '<span class="voice-option-check">✓</span>');
            }
          }
        });
      }
    }
    
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
    
    // PGN Upload button setup
    const pgnUploadBtn = document.getElementById('pgnUploadBtn');
    const pgnFileInput = document.getElementById('pgnFileInput');
    
    if (pgnUploadBtn && pgnFileInput) {
      // Click upload button to trigger file input
      pgnUploadBtn.addEventListener('click', () => {
        pgnFileInput.click();
      });
      
      // Handle file selection
      pgnFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file extension
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.pgn') && !fileName.endsWith('.txt')) {
          alert('Please select a .pgn or .txt file');
          pgnFileInput.value = ''; // Reset input
          return;
        }
        
        try {
          // Read file as text
          const reader = new FileReader();
          reader.onload = async (event) => {
            const pgnContent = event.target.result;
            
            if (!pgnContent || pgnContent.trim().length === 0) {
              alert('The selected file is empty');
              pgnFileInput.value = '';
              return;
            }
            
            // Initialize game with uploaded PGN
            await initializeGame(pgnContent);
            
            // Save to localStorage for persistence
            try {
              localStorage.setItem('currentGamePGN', pgnContent);
            } catch (err) {
              console.warn('Could not save PGN to localStorage:', err);
            }
            
            // Hide PGN modal if open
            const pgnModal = document.getElementById('pgnModal');
            if (pgnModal) {
              pgnModal.style.display = 'none';
            }
            
            // Reset file input
            pgnFileInput.value = '';
          };
          
          reader.onerror = () => {
            alert('Error reading file. Please try again.');
            pgnFileInput.value = '';
          };
          
          reader.readAsText(file);
        } catch (error) {
          console.error('Error loading PGN file:', error);
          alert('Error loading PGN file: ' + error.message);
          pgnFileInput.value = '';
        }
      });
    } else {
      console.warn('PGN upload button or file input not found!');
    }
    
    // Demo button handler
    const demoBtn = document.getElementById('demoBtn');
    if (demoBtn) {
      demoBtn.addEventListener('click', async () => {
        console.log('Loading demo game...');
        await initializeGame(EXAMPLE_GAME_PGN);
        // Save demo game to localStorage
        try {
          localStorage.setItem('currentGamePGN', EXAMPLE_GAME_PGN);
        } catch (err) {
          console.warn('Could not save demo game to localStorage:', err);
        }
        // Hide PGN modal if open
        const pgnModal = document.getElementById('pgnModal');
        if (pgnModal) {
          pgnModal.style.display = 'none';
        }
      });
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
      closePgnModal.addEventListener('click', (e) => {
        e.stopPropagation();
        pgnModal.style.display = 'none';
      });
    }
    
    // Close modal when clicking outside (on the backdrop)
    if (pgnModal) {
      pgnModal.addEventListener('click', (e) => {
        if (e.target === pgnModal) {
          pgnModal.style.display = 'none';
        }
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
        
        // Close modal immediately when analyze is clicked
        if (pgnModal) {
          pgnModal.style.display = 'none';
        }
        
        analyzePgnBtn.disabled = true;
        analyzePgnBtn.textContent = 'Analyzing...';
        
        try {
          // Reset game state
          resetGameState();
          
          // Initialize with pasted PGN
          await initializeGame(pgn);
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

async function initializeBoardWithStartingPosition() {
  // Initialize board with starting position on page load
  if (board) {
    // Board already initialized, just reset to start
    board.position('start');
    return;
  }
  
  if (typeof window.Chessboard === 'undefined' || typeof window.$ === 'undefined') {
    console.warn('Board libraries not ready yet');
    return;
  }
  
  try {
    const boardElement = document.getElementById('board');
    if (!boardElement) {
      console.warn('Board element not found');
      return;
    }
    
    // Create a simple chess instance for the starting position
    if (!chess) {
      chess = new window.Chess();
    }
    
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
      orientation: 'white', // White on bottom (standard orientation)
      onDragStart: onDragStart,
      onDrop: onDrop,
      onSnapEnd: onSnapEnd
    });
    
    if (board) {
      // Ensure white is on bottom
      board.orientation('white');
      boardOrientation = 'white';
      console.log('✅ Board initialized with starting position (white on bottom)');
    }
  } catch (err) {
    console.error('Error initializing board:', err);
  }
}

function updateAnalysisPanelWithIntro() {
  // Update the analysis panel with intro information
  const analysisMove = document.getElementById('analysisMove');
  const analysisText = document.getElementById('analysisText');
  const analysisIcon = document.getElementById('analysisIcon');
  const keyMomentsSection = document.getElementById('keyMomentsSection');
  const movesSection = document.getElementById('movesSection');
  const demoSection = document.getElementById('demoSection');
  
  // Hide game sections, show demo section
  if (keyMomentsSection) keyMomentsSection.style.display = 'none';
  if (movesSection) movesSection.style.display = 'none';
  if (demoSection) demoSection.style.display = 'flex';
  
  if (analysisMove) {
    analysisMove.textContent = 'Chess Game Analyzer';
  }
  
  if (analysisText) {
    analysisText.innerHTML = `
      <div style="margin-bottom: 16px;">
        <strong>Welcome to Chess Game Analyzer!</strong>
      </div>
      <div style="font-size: 13px; line-height: 1.8; color: var(--muted-foreground);">
        <p style="margin-bottom: 12px;">Get deep insights into your chess games with AI-powered analysis. This tool helps you understand your games better by identifying key moments, suggesting better moves, and providing detailed commentary.</p>
        
        <p style="margin-bottom: 12px;"><strong>How to use:</strong></p>
        <ul style="margin-left: 20px; margin-bottom: 16px; padding: 0;">
          <li><strong>Upload or paste</strong> a PGN file from your games</li>
          <li><strong>Try the demo</strong> to see how it works</li>
          <li><strong>Navigate</strong> through moves with the controls below</li>
          <li><strong>Listen</strong> to voice commentary (click the sound icon)</li>
        </ul>
        
        <p style="margin-bottom: 12px;"><strong>Features:</strong></p>
        <ul style="margin-left: 20px; margin-bottom: 12px; padding: 0;">
          <li><strong>Stockfish 16</strong> engine analysis</li>
          <li><strong>Move-by-move</strong> commentary</li>
          <li><strong>Key moments</strong> detection (blunders, mistakes, brilliant moves)</li>
          <li><strong>Voice narration</strong> with Donny's voice or your browser's voice</li>
          <li>📊 <strong>Evaluation graph</strong> and visual analysis</li>
        </ul>
        <p style="margin-top: 16px; margin-bottom: 0;">
          <button id="startAnalysisBtn" class="btn-analyze" style="width: 100%; padding: 12px; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="font-size: 20px;">📋</span>
            <span style="font-size: 13px;">Paste PGN to Start Analysis</span>
          </button>
        </p>
      </div>
    `;
    
    // Add click handler for the start button
    setTimeout(() => {
      const startBtn = document.getElementById('startAnalysisBtn');
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          const pgnModal = document.getElementById('pgnModal');
          if (pgnModal) {
            pgnModal.style.display = 'flex';
          }
        });
      }
    }, 100);
  }
  
  if (analysisIcon) {
    analysisIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>';
  }
  
  // Clear eval
  updateEvaluation(0);
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
  
  // Reset button states: show play, hide pause
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  if (playBtn) playBtn.style.display = 'flex';
  if (pauseBtn) pauseBtn.style.display = 'none';
  
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
  
  // Restore intro in right panel
  const analysisMove = document.getElementById('analysisMove');
  const analysisText = document.getElementById('analysisText');
  if (analysisMove) {
    analysisMove.textContent = 'Chess Game Analyzer';
  }
  if (analysisText) {
    analysisText.innerHTML = `
      <div style="margin-bottom: 16px;">
        <strong>Analyze your chess games with AI-powered insights!</strong>
      </div>
      <div style="font-size: 13px; line-height: 1.8; color: var(--muted-foreground);">
        <p style="margin-bottom: 12px;"><strong>Features:</strong></p>
        <ul style="margin-left: 20px; margin-bottom: 12px; padding: 0;">
          <li><strong>Stockfish 16</strong> engine analysis</li>
          <li><strong>Move-by-move</strong> commentary</li>
          <li><strong>Key moments</strong> detection (blunders, mistakes, brilliant moves)</li>
          <li><strong>Voice narration</strong> with Donny's voice or your browser's voice</li>
          <li>📊 <strong>Evaluation graph</strong> and visual analysis</li>
        </ul>
        <p style="margin-top: 16px; margin-bottom: 0;">
          <button id="startAnalysisBtn" class="btn-analyze" style="width: 100%; padding: 12px; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span style="font-size: 20px;">📋</span>
            <span style="font-size: 13px;">Paste PGN to Start Analysis</span>
          </button>
        </p>
      </div>
    `;
  }
  
  // Clear game summary
  const gameSummary = document.getElementById('gameSummary');
  if (gameSummary) {
    gameSummary.innerHTML = '';
  }
  
  // Clear key moments
  const keyMomentsList = document.getElementById('keyMomentsList');
  if (keyMomentsList) {
    keyMomentsList.innerHTML = '';
  }
  
  // Reset evaluation
  updateEvaluation(0);
}

async function initializeStockfish() {
  return new Promise((resolve) => {
    try {
      // Load Stockfish as a Web Worker
      // Handle both extension and web contexts
      let stockfishUrl;
      
      // Try to determine the correct URL for Stockfish worker
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
        // Extension context - use chrome.runtime.getURL
        stockfishUrl = chrome.runtime.getURL('libs/stockfish.js');
      } else {
        // Web context - construct absolute URL from current page location
        // Get the base path (directory containing the current HTML file)
        const currentPath = window.location.pathname;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        // Construct absolute URL
        stockfishUrl = new URL(basePath + '/libs/stockfish.js', window.location.origin).href;
      }
      
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

/**
 * Update the sexy progress bar during analysis
 */
function updateAnalysisProgress(current, total, percent) {
  const progressBar = document.getElementById('analysis-progress-bar');
  const progressPercent = document.getElementById('analysis-progress-percent');
  const loadingMoves = document.getElementById('analysis-loading-moves');
  
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
  }
  
  if (progressPercent) {
    progressPercent.textContent = `${percent}%`;
  }
  
  if (loadingMoves) {
    loadingMoves.textContent = `Analyzing move ${current} of ${total}`;
  }
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

// Helper function to check if current game matches the example game
function isExampleGame() {
  if (!window.EXAMPLE_GAME_COMMENTARY || !moves || moves.length === 0) return false;
  
  // Check if we can get data for the first move
  if (window.getMoveByPly) {
    const firstMoveData = window.getMoveByPly(0);
    if (firstMoveData && firstMoveData.san === moves[0]?.san) {
      // Check a few more moves to confirm
      let matches = 0;
      const checkCount = Math.min(6, moves.length);
      for (let i = 0; i < checkCount; i++) {
        const moveData = window.getMoveByPly(i);
        if (moveData && moveData.san === moves[i]?.san) {
          matches++;
        }
      }
      // Require at least 4 matches or all checked moves match
      return matches >= Math.min(4, checkCount) || matches === checkCount;
    }
  }
  
  return false;
}

// Helper function to get best move suggestion data for a move
function getBestMoveSuggestion(moveIndex) {
  // First check if we have example game commentary data and it matches
  if (typeof window !== 'undefined' && window.EXAMPLE_GAME_COMMENTARY && window.getMoveByPly && isExampleGame()) {
    const moveData = window.getMoveByPly(moveIndex);
    if (moveData && moveData.bestMove && moveData.bestMove !== moves[moveIndex]?.san) {
      // Check if there's a sizeable eval change or if it's marked as important
      const prevMoveData = moveIndex > 0 ? window.getMoveByPly(moveIndex - 1) : null;
      const prevEval = prevMoveData?.eval;
      const currentEval = moveData.eval;
      
      // Handle string evals (like "#-1" for mate)
      const prevEvalNum = typeof prevEval === 'string' ? 0 : (prevEval || 0);
      const currentEvalNum = typeof currentEval === 'string' ? 0 : (currentEval || 0);
      const evalChange = Math.abs(currentEvalNum - prevEvalNum);
      
      // Show suggestion if eval change is significant (>0.3) or if it's a marked key moment
      if (evalChange > 0.3 || moveData.isKeyMoment || moveData.annotation) {
        return {
          bestMove: moveData.bestMove,
          comment: moveData.suggestionComment || '',
          evalChange: evalChange
        };
      }
    }
  }
  
  // Otherwise check Stockfish analysis data
  if (analysisData[moveIndex] && analysisData[moveIndex].bestMove) {
    const playedMove = moves[moveIndex]?.san;
    const bestMove = analysisData[moveIndex].bestMove;
    
    // Only show if best move differs from played move
    if (bestMove && bestMove !== playedMove) {
      const currentEval = analysisData[moveIndex].cp / 100 || 0;
      const prevEval = moveIndex > 0 ? (analysisData[moveIndex - 1]?.cp / 100 || 0) : 0;
      const evalChange = Math.abs(currentEval - prevEval);
      
      // Show suggestion if eval change is significant (>0.3) or if there's an annotation
      if (evalChange > 0.3 || analysisData[moveIndex].annotation) {
        return {
          bestMove: bestMove,
          comment: '',
          evalChange: evalChange
        };
      }
    }
  }
  
  return null;
}

function displayMoves() {
  const movesList = document.getElementById('movesList');
  const movesSection = document.getElementById('movesSection');
  const keyMomentsSection = document.getElementById('keyMomentsSection');
  const demoSection = document.getElementById('demoSection');
  
  if (!movesList) return;
  
  // Show sections when game is loaded, hide demo
  if (movesSection) movesSection.style.display = 'flex';
  if (keyMomentsSection) keyMomentsSection.style.display = 'flex';
  if (demoSection) demoSection.style.display = 'none';
  
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
    
    // Check for best move suggestion
    const whiteSuggestion = getBestMoveSuggestion(i);
    let whiteSuggestionHTML = '';
    if (whiteSuggestion) {
      whiteSuggestionHTML = `<span class="move-suggestion" title="${whiteSuggestion.comment || `${whiteSuggestion.bestMove} was better`}">
        <span class="suggestion-label">→</span>
        <span class="suggestion-move">${whiteSuggestion.bestMove}</span>
      </span>`;
    }
    
    whiteCell.innerHTML = `<span class="piece-dot white-dot"></span><span class="move-san">${whiteMove.san}</span><span class="move-icon"></span>${whiteSuggestionHTML}`;
    whiteCell.addEventListener('click', () => goToMove(i));
    whiteCell.addEventListener('mouseenter', () => previewMove(i));
    whiteCell.addEventListener('mouseleave', () => clearPreview());
    movesList.appendChild(whiteCell);
    
    // Black's move (if exists)
    if (i + 1 < moves.length) {
      const blackMove = moves[i + 1];
      const blackCell = document.createElement('div');
      blackCell.className = 'move-cell black-move';
      blackCell.dataset.moveIndex = i + 1;
      blackCell.id = `move-${i + 1}`;
      
      // Check for best move suggestion
      const blackSuggestion = getBestMoveSuggestion(i + 1);
      let blackSuggestionHTML = '';
      if (blackSuggestion) {
        blackSuggestionHTML = `<span class="move-suggestion" title="${blackSuggestion.comment || `${blackSuggestion.bestMove} was better`}">
          <span class="suggestion-label">→</span>
          <span class="suggestion-move">${blackSuggestion.bestMove}</span>
        </span>`;
      }
      
      blackCell.innerHTML = `<span class="piece-dot black-dot"></span><span class="move-san">${blackMove.san}</span><span class="move-icon"></span>${blackSuggestionHTML}`;
      blackCell.addEventListener('click', () => goToMove(i + 1));
      blackCell.addEventListener('mouseenter', () => previewMove(i + 1));
      blackCell.addEventListener('mouseleave', () => clearPreview());
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
  
  // Show sexy loading indicator with progress bar
  const movesList = document.getElementById('movesList');
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'analysis-loading';
  loadingDiv.className = 'analysis-loading-container';
  loadingDiv.innerHTML = `
    <div class="analysis-loading-header">
      <div class="analysis-loading-title">
        <span class="analysis-loading-icon">🔬</span>
        <span>Stockfish Analysis</span>
      </div>
      <div class="analysis-loading-percent" id="analysis-progress-percent">0%</div>
    </div>
    <div class="analysis-progress-wrapper">
      <div class="analysis-progress-bar" id="analysis-progress-bar" style="width: 0%;"></div>
    </div>
    <div class="analysis-loading-details">
      <span class="analysis-loading-moves" id="analysis-loading-moves">Initializing engine...</span>
      <div class="analysis-loading-status">
        <span class="analysis-loading-dot"></span>
        <span class="analysis-loading-dot"></span>
        <span class="analysis-loading-dot"></span>
      </div>
    </div>
  `;
  movesList.parentElement.insertBefore(loadingDiv, movesList);
  
  // Initialize progress bar
  updateAnalysisProgress(0, moves.length, 0);
  
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
        // Create a temporary chess instance at the position Stockfish analyzed
        // This MUST be the position BEFORE the move was made
        const tempChessForConversion = new window.Chess();
        
        // Ensure we load the full FEN with all fields
        const fenParts = positionBeforeMove.split(' ');
        let fullFen = positionBeforeMove;
        if (fenParts.length < 6) {
          // Reconstruct full FEN
          const position = fenParts[0];
          const activeColor = fenParts[1] || 'w';
          const castling = fenParts[2] || '-';
          const enPassant = fenParts[3] || '-';
          const halfmove = fenParts[4] || '0';
          const fullmove = fenParts[5] || '1';
          fullFen = `${position} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
        }
        
        tempChessForConversion.load(fullFen);
        
        // Verify the active color matches what we expect
        const isWhiteMove = i % 2 === 0;
        const expectedColor = isWhiteMove ? 'w' : 'b';
        const actualColor = tempChessForConversion.turn();
        if (actualColor !== expectedColor) {
          console.error(`❌ Color mismatch at move ${i + 1}: expected ${expectedColor}, got ${actualColor}. FEN: ${fullFen}`);
        }
        
        const uciMove = evaluationBefore.bestMove;
        // UCI format: "e2e4" or "e7e8q" (with promotion)
        if (uciMove && uciMove.length >= 4) {
          const from = uciMove.substring(0, 2);
          const to = uciMove.substring(2, 4);
          const promotion = uciMove.length > 4 ? uciMove[4].toLowerCase() : null;
          
          // Verify the move is legal for the current position
          const legalMoves = tempChessForConversion.moves({ verbose: true });
          const isLegal = legalMoves.some(m => 
            m.from === from && 
            m.to === to && 
            (!promotion || m.promotion === promotion)
          );
          
          if (!isLegal) {
            console.error(`❌ Illegal move suggested by Stockfish at move ${i + 1}: ${uciMove} for ${actualColor} to move. Legal moves: ${legalMoves.slice(0, 5).map(m => m.from + m.to).join(', ')}...`);
            // Skip this best move - it's invalid
            bestMoveSAN = null;
          } else {
            const moveObj = tempChessForConversion.move({
              from: from,
              to: to,
              promotion: promotion || undefined
            });
            
            if (moveObj) {
              bestMoveSAN = moveObj.san;
            } else {
              console.warn(`⚠️ Move object is null for ${uciMove} at move ${i + 1}`);
            }
          }
        }
      } catch (e) {
        console.error(`❌ Could not convert best move to SAN at move ${i + 1}:`, e, {
          bestMove: evaluationBefore.bestMove,
          position: positionBeforeMove,
          moveIndex: i
        });
        bestMoveSAN = null; // Don't use invalid moves
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
    
    // Update sexy progress bar
    const progress = Math.round(((i + 1) / moves.length) * 100);
    updateAnalysisProgress(i + 1, moves.length, progress);
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
    
    // Update progress (smooth updates every move)
    updateAnalysisProgress(i + 1, moves.length, Math.round(((i + 1) / moves.length) * 100));
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
  const keyMomentsSection = document.getElementById('keyMomentsSection');
  const movesSection = document.getElementById('movesSection');
  const demoSection = document.getElementById('demoSection');
  
  if (!keyMomentsList) return;
  
  // Show sections when game is loaded, hide demo
  if (keyMomentsSection) keyMomentsSection.style.display = 'flex';
  if (movesSection) movesSection.style.display = 'flex';
  if (demoSection) demoSection.style.display = 'none';
  
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
    
    const moveNum = Math.floor(moment.moveIndex / 2) + 1;
    
    chip.innerHTML = `
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
      
      // Ensure we have a valid evaluation
      let finalCp = 0;
      let finalMate = null;
      
      if (evaluation) {
        if (evaluation.mate !== undefined && evaluation.mate !== null) {
          finalMate = evaluation.mate;
        } else if (evaluation.cp !== undefined && evaluation.cp !== null) {
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
      
      // Compare with previous move to determine annotation
      if (moveIndex > 0 && analysisData[moveIndex - 1]) {
        result.annotation = determineAnnotation(analysisData[moveIndex - 1], result, moveIndex);
      }
      
      console.log(`📊 Move ${moveIndex + 1} (${reason}): eval=${result.cp !== undefined ? (result.cp / 100).toFixed(2) : 'M' + result.mate} depth=${bestDepth} best=${bestMove || 'none'}`);
      resolve(result);
    };
    
    const timeout = setTimeout(() => {
      // If we have an evaluation, use it even on timeout
      if (evaluation) {
        finishAnalysis('timeout (with eval)');
      } else {
        console.warn(`⚠️ No evaluation received for move ${moveIndex + 1} before timeout`);
        finishAnalysis('timeout (no eval)');
      }
    }, 5000); // 5 second timeout per position
    
    // Create message handler for this analysis
    const handler = (event) => {
      const message = event.data || event;
      
      if (typeof message === 'string') {
        // Debug: log info messages with scores for troubleshooting
        if (message.startsWith('info')) {
          // Parse evaluation from info string
          // Stockfish format: "info depth X score cp/mate Y ..."
          const evalMatch = message.match(/score (cp|mate) (-?\d+)/);
          const depthMatch = message.match(/depth (\d+)/);
          const pvMatch = message.match(/ pv (.+)/);
          
          if (depthMatch) {
            const newDepth = parseInt(depthMatch[1]);
            depth = newDepth;
            if (newDepth > bestDepth) bestDepth = newDepth;
          }
          
          if (evalMatch) {
            const score = parseInt(evalMatch[2]);
            evaluation = evalMatch[1] === 'mate' ? { mate: score } : { cp: score };
            // Log evaluation updates for debugging
            if (depth >= 5) {
              console.log(`📊 Eval update: depth=${depth} eval=${evalMatch[1] === 'mate' ? 'M' + score : (score/100).toFixed(1)}`);
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
          
          // Stop when we have enough depth and an evaluation
          const requiredDepth = quickEval ? 8 : 12;
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
          // If we have an evaluation, use it; otherwise finishAnalysis will use the last one
          finishAnalysis('bestmove');
        }
      }
    };
    
    // Stop any previous analysis first
    stockfish.postMessage('stop');
    
    // Set the handler BEFORE sending new commands
    stockfish.onmessage = handler;
    
    // Small delay to ensure stop is processed
    setTimeout(() => {
      // Validate FEN format - must include all 6 fields
      const fenParts = fen.split(' ');
      if (fenParts.length < 2) {
        console.error(`❌ Invalid FEN (missing active color): ${fen}`);
        finishAnalysis('invalid fen');
        return;
      }
      
      // Ensure FEN has all required fields (position, active color, castling, en passant, halfmove, fullmove)
      let fullFen = fen;
      if (fenParts.length < 6) {
        // Reconstruct full FEN with defaults
        const position = fenParts[0];
        const activeColor = fenParts[1] || 'w'; // Default to white if missing
        const castling = fenParts[2] || '-';
        const enPassant = fenParts[3] || '-';
        const halfmove = fenParts[4] || '0';
        const fullmove = fenParts[5] || '1';
        fullFen = `${position} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
        console.warn(`⚠️ Incomplete FEN, reconstructed: ${fullFen}`);
      }
      
      // Log the active color for debugging
      const activeColor = fenParts[1];
      console.log(`🔍 Starting analysis: move ${moveIndex + 1}, depth ${targetDepth}, active: ${activeColor}, fen: ${fullFen.split(' ')[0]}`);
      
      // Start new analysis with full FEN
      stockfish.postMessage(`position fen ${fullFen}`);
      stockfish.postMessage(`go depth ${targetDepth}`);
    }, 100); // Increased delay to ensure stop is processed
    
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
    
    if (analysisMove) analysisMove.textContent = 'Game Overview';
    if (analysisText) analysisText.textContent = gameSummary;
    if (analysisIcon) analysisIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
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
  
  // Clear any preview state
  clearPreview();
  
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

let previewState = null; // Store current state when previewing

function previewMove(index) {
  if (index < 0 || index >= moves.length) return;
  
  // Save current state if not already saved
  if (previewState === null) {
    previewState = {
      position: chess.fen(),
      moveIndex: currentMoveIndex
    };
  }
  
  // Create temporary chess instance to show the position at this move
  const ChessClass = window.Chess;
  const tempChess = new ChessClass();
  
  for (let i = 0; i <= index; i++) {
    tempChess.move(moves[i]);
  }
  
  // Show the position
  board.position(tempChess.fen());
  
  // Highlight the move
  if (moves[index]) {
    highlightMove(moves[index]);
  }
}

function clearPreview() {
  if (previewState !== null) {
    // Restore previous position
    chess.load(previewState.position);
    board.position(previewState.position);
    
    // Restore move highlights
    if (previewState.moveIndex >= 0 && previewState.moveIndex < moves.length) {
      highlightMove(moves[previewState.moveIndex]);
    } else {
      clearMoveHighlights();
    }
    
    previewState = null;
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
  
  // Set icon based on annotation (using SVG icons)
  const chartIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>';
  const checkIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  
  if (analysis) {
    if (analysis.annotation === '!!') {
      iconEl.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>';
    } else if (analysis.annotation === '!') {
      iconEl.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    } else if (analysis.annotation === '?!') {
      iconEl.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    } else {
      iconEl.innerHTML = checkIcon;
    }
  } else {
    iconEl.innerHTML = chartIcon;
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
  
  if (iconEl) iconEl.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>';
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
  evalBar.className = 'eval-fill'; // Keep the CSS class name
}

function playMoves() {
  if (isPlaying) return;
  
  isPlaying = true;
  
  // Update play/pause button to show pause icon
  const playPauseBtn = document.getElementById('playPauseBtn');
  if (playPauseBtn) {
    playPauseBtn.textContent = '⏸';
    playPauseBtn.title = 'Pause (Space)';
  }
  
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
  
  // Use Donny Voice if selected and unlocked
  if (selectedVoiceType === 'donny' && premiumVoiceUnlocked && typeof window.speakWithElevenLabs === 'function') {
    const success = await window.speakWithElevenLabs(intro);
    if (success) return;
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
  
  // Update play/pause button to show play icon
  const playPauseBtn = document.getElementById('playPauseBtn');
  if (playPauseBtn) {
    playPauseBtn.textContent = '▶';
    playPauseBtn.title = 'Play (Space)';
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
  
  // Use Donny Voice if selected and unlocked
  if (selectedVoiceType === 'donny' && premiumVoiceUnlocked && typeof window.speakWithElevenLabs === 'function') {
    const success = await window.speakWithElevenLabs(text);
    if (success) {
      console.log('✓ Spoke with Donny Voice (ElevenLabs)');
      return;
    }
  }
  
  // Fallback to Web Speech API (browser TTS)
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

// Password Dialog Functions
function showPasswordDialog(callback) {
  const passwordModal = document.getElementById('passwordModal');
  const passwordInput = document.getElementById('passwordInput');
  const passwordHint = document.getElementById('passwordHint');
  const passwordSubmitBtn = document.getElementById('passwordSubmitBtn');
  const passwordCancelBtn = document.getElementById('passwordCancelBtn');
  const passwordModalContent = passwordModal?.querySelector('.password-modal-content');
  
  if (!passwordModal || !passwordInput) {
    console.warn('Password modal elements not found');
    callback(false);
    return;
  }
  
  // Reset state
  passwordInput.value = '';
  passwordHint.textContent = '';
  passwordHint.classList.remove('show');
  passwordModal.style.display = 'flex';
  setTimeout(() => passwordInput.focus(), 100);
  
  // Handle submit
  const handleSubmit = () => {
    const password = passwordInput.value.trim();
    
    if (password === VOICE_PASSWORD) {
      passwordModal.style.display = 'none';
      callback(true);
    } else if (password) {
      // Wrong password
      passwordHint.textContent = 'Incorrect password. Try again!';
      passwordHint.classList.add('show');
      passwordInput.value = '';
      passwordInput.focus();
      // Shake animation
      if (passwordModalContent) {
        passwordModalContent.classList.add('shake');
        setTimeout(() => {
          passwordModalContent.classList.remove('shake');
        }, 500);
      }
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    passwordModal.style.display = 'none';
    callback(false);
  };
  
  // Handle submit button click
  passwordSubmitBtn.onclick = (e) => {
    e.preventDefault();
    handleSubmit();
  };
  
  // Handle cancel button click
  passwordCancelBtn.onclick = () => {
    handleCancel();
  };
  
  // Handle Enter/Escape keys
  passwordInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };
  
  // Click backdrop to close
  const backdrop = passwordModal.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.onclick = handleCancel;
  }
}

function showToast(type, message) {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');
  
  if (!toast || !toastIcon || !toastMessage) return;
  
  // Set icon based on type
  if (type === 'success') {
    toast.className = 'toast success';
    toastIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'error') {
    toast.className = 'toast error';
    toastIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  }
  
  toastMessage.textContent = message;
  toast.style.display = 'flex';
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// Make functions globally available
if (typeof window !== 'undefined') {
  window.showPasswordDialog = showPasswordDialog;
  window.showToast = showToast;
}
