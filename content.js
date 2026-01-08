// Content script that runs on Lichess pages
// Detects when a game ends and extracts game data
// Also works on game review/analysis pages

(function() {
  'use strict';

  let gameEndDetected = false;
  let lastGameId = null;
  let analysisButtonAdded = false;
  let userDismissedOverlay = false; // Prevents auto-open after user closes

  // Function to extract game data from Lichess page
  function extractGameData() {
    try {
      // Try to get PGN from the page (multiple selectors)
      const pgnSelectors = [
        '.pgn',
        '.moves',
        '[data-pgn]',
        '.game-pgn',
        'textarea.pgn',
        'pre.pgn',
        '.pgn-text',
        '[class*="pgn"]'
      ];
      
      for (const selector of pgnSelectors) {
        const pgnElements = document.querySelectorAll(selector);
        for (const pgnElement of pgnElements) {
          const pgn = pgnElement.textContent || pgnElement.value || pgnElement.getAttribute('data-pgn');
          if (pgn && pgn.trim().length > 10 && pgn.includes('1.')) {
            return { pgn: pgn.trim(), source: 'pgn' };
          }
        }
      }

      // Try to get game ID from URL (multiple patterns)
      const gameIdPatterns = [
        /\/game\/([a-zA-Z0-9]{8})/,
        /\/analysis\/([a-zA-Z0-9]{8})/,
        /\/review\/([a-zA-Z0-9]{8})/,
        /\/embed\/([a-zA-Z0-9]{8})/,
        /\/([a-zA-Z0-9]{8})(?:\/|$)/  // Generic 8-char ID
      ];

      for (const pattern of gameIdPatterns) {
        const match = window.location.pathname.match(pattern);
        if (match && match[1]) {
          return { gameId: match[1], source: 'api' };
        }
      }

      // Try to get game ID from data attributes
      const gameIdSelectors = [
        '[data-game-id]',
        '[data-live-game-id]',
        '[data-id]',
        '.game[data-id]'
      ];

      for (const selector of gameIdSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const gameId = el.getAttribute('data-game-id') || 
                        el.getAttribute('data-live-game-id') ||
                        el.getAttribute('data-id');
          if (gameId && gameId.length === 8) {
            return { gameId, source: 'api' };
          }
        }
      }

      // Try to extract from Lichess's embedded data
      const lichessData = window.lichess || window.Lichess;
      if (lichessData && lichessData.data) {
        if (lichessData.data.game && lichessData.data.game.id) {
          return { gameId: lichessData.data.game.id, source: 'api' };
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting game data:', error);
      return null;
    }
  }

  // Check if extension context is still valid
  function isExtensionValid() {
    try {
      // Attempt to access a chrome.runtime property to check if context is valid
      chrome.runtime.getURL('dummy.html');
      return true;
    } catch (e) {
      return false;
    }
  }

  // Function to check if we're on an analysis page (with /white or /black in URL)
  function isAnalysisPage() {
    const pathname = window.location.pathname;
    // Check if URL ends with /white or /black (analysis pages)
    return /\/[a-zA-Z0-9]{8}\/(white|black)$/.test(pathname) ||
           /\/analysis\/[a-zA-Z0-9]{8}/.test(pathname) ||
           /\/review\/[a-zA-Z0-9]{8}/.test(pathname);
  }

  // Function to check if we're on a game page (finished or review)
  function isGamePage() {
    // Check URL patterns for game pages
    const gameUrlPatterns = [
      /\/game\/[a-zA-Z0-9]{8}/,     // Game page: /game/abc12345
      /\/[a-zA-Z0-9]{8}$/,           // Game ID in URL: /abc12345
      /\/[a-zA-Z0-9]{8}\/black$/,    // Black's perspective
      /\/[a-zA-Z0-9]{8}\/white$/,    // White's perspective
      /\/analysis\/[a-zA-Z0-9]{8}/, // Analysis page
      /\/review\/[a-zA-Z0-9]{8}/,   // Review page
      /\/embed\/[a-zA-Z0-9]{8}/     // Embedded game
    ];

    const isGameURL = gameUrlPatterns.some(pattern => pattern.test(window.location.pathname));

    // Check for game board or game-related elements
    const gameElements = [
      '.cg-wrap',
      '.lichess_board_wrap',
      '.round',
      '.game',
      '[data-live-game-id]',
      '.moves',
      '.pgn'
    ];

    const hasGameElements = gameElements.some(selector => document.querySelector(selector) !== null);

    // Check for game end indicators (finished games)
    const gameEndSelectors = [
      '.game-result',
      '.result',
      '[data-result]',
      '.status',
      '.game-over',
      '.result-wrap',
      '.game-status',
      '[class*="result"]',
      '[class*="finished"]'
    ];

    const hasEnded = gameEndSelectors.some(selector => {
      const el = document.querySelector(selector);
      return el !== null && el.textContent.trim().length > 0;
    });

    return isGameURL || (hasGameElements && hasEnded);
  }

  // Function to get PGN from Lichess API
  async function getPGNFromAPI(gameId) {
    try {
      // Try multiple API endpoints
      const endpoints = [
        `https://lichess.org/game/export/${gameId}?pgn=1`,
        `https://lichess.org/game/export/${gameId}.pgn`,
        `https://lichess.org/api/game/${gameId}?pgn=1`,
        `https://lichess.org/api/game/${gameId}?literate=1&pgn=1`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Accept': 'text/plain, application/x-chess-pgn'
            }
          });
          if (response.ok) {
            const pgn = await response.text();
            if (pgn && pgn.trim().length > 10 && (pgn.includes('1.') || pgn.includes('[Event'))) {
              return pgn.trim();
            }
          }
        } catch (e) {
          console.log('Failed endpoint:', endpoint, e);
          continue;
        }
      }
    } catch (error) {
      console.error('Error fetching PGN from API:', error);
    }
    return null;
  }

  // Function to open analysis page as overlay
  async function openAnalysisPage(gameData, force = false) {
    // Allow forced analysis (for manual triggers)
    // Skip auto-open if user already dismissed or already detected
    if (!force && (gameEndDetected || userDismissedOverlay)) return;
    gameEndDetected = true;

    let pgn = null;

    // Try to get PGN
    if (gameData.pgn) {
      pgn = gameData.pgn;
    } else if (gameData.gameId) {
      console.log('Fetching PGN for game:', gameData.gameId);
      pgn = await getPGNFromAPI(gameData.gameId);
    }

    if (!pgn && gameData.moves) {
      // Convert moves array to PGN format (simplified)
      pgn = gameData.moves.join(' ');
    }

    if (!pgn) {
      console.error('Could not extract game data');
      alert('Could not extract game data. Make sure you are on a finished game page.');
      return;
    }

    // Store game data (with error handling for extension context invalidation)
    try {
      if (!isExtensionValid()) {
        console.error('Extension context invalidated. Please reload the page.');
        alert('Extension context invalidated. Please reload the page and try again.');
        return;
      }

      chrome.storage.local.set({ 
        currentGamePGN: pgn,
        gameUrl: window.location.href
      }, () => {
        try {
          // Check for errors
          if (chrome.runtime.lastError) {
            console.error('Storage error:', chrome.runtime.lastError);
            // Still try to show overlay even if storage fails
          }
          // Show as overlay popup instead of new tab
          showAnalysisOverlay(pgn);
        } catch (e) {
          console.error('Error in storage callback:', e);
          // Still try to show overlay
          showAnalysisOverlay(pgn);
        }
      });
    } catch (e) {
      console.error('Error storing game data:', e);
      // Still try to show overlay even if storage fails
      showAnalysisOverlay(pgn);
    }
  }

  // Create and show the analysis overlay
  function showAnalysisOverlay(pgn) {
    // Remove existing overlay if present
    const existingOverlay = document.getElementById('lichess-analyzer-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'lichess-analyzer-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      z-index: 999999;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(4px);
    `;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      background: #e67a28;
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      z-index: 1000001;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.2s, background 0.2s;
    `;
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.transform = 'scale(1.1)';
      closeBtn.style.background = '#ff8c3a';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.transform = 'scale(1)';
      closeBtn.style.background = '#e67a28';
    });
    closeBtn.addEventListener('click', () => {
      overlay.remove();
      userDismissedOverlay = true; // Prevent auto-reopening
    });

    // Create iframe to load analysis page
    const iframe = document.createElement('iframe');
    let analysisUrl;
    try {
      if (!isExtensionValid()) {
        console.error('Extension context invalidated. Cannot load analysis page.');
        alert('Extension context invalidated. Please reload the page and try again.');
        return;
      }
      try {
        analysisUrl = chrome.runtime.getURL('analysis.html') + `?pgn=${encodeURIComponent(pgn)}`;
      } catch (urlError) {
        console.error('Error getting analysis URL:', urlError);
        alert('Extension context invalidated. Please reload the page and try again.');
        return;
      }
    } catch (e) {
      console.error('Error in showAnalysisOverlay:', e);
      alert('Extension context invalidated. Please reload the page and try again.');
      return;
    }
    iframe.src = analysisUrl;
    iframe.style.cssText = `
      width: 95%;
      height: 92%;
      max-width: 1200px;
      max-height: 800px;
      border: none;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    `;

    overlay.appendChild(closeBtn);
    overlay.appendChild(iframe);

    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        userDismissedOverlay = true; // Prevent auto-reopening
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Close on overlay background click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        userDismissedOverlay = true; // Prevent auto-reopening
      }
    });

    document.body.appendChild(overlay);
  }

  // Function to close overlay (for external calls)
  window.closeAnalysisOverlay = function() {
    const overlay = document.getElementById('lichess-analyzer-overlay');
    if (overlay) {
      overlay.remove();
      userDismissedOverlay = true; // Prevent auto-reopening
    }
  };

  // Add analysis button to game pages
  function addAnalysisButton() {
    if (analysisButtonAdded) return;
    
    // Find a good place to add the button (near game controls)
    const buttonContainers = [
      '.round__actions',
      '.game__actions',
      '.analyse__tools',
      '.moves',
      '.underboard',
      '.game-controls',
      'header',
      '.round__app'
    ];

    let container = null;
    for (const selector of buttonContainers) {
      container = document.querySelector(selector);
      if (container) break;
    }

    // Fallback: create container at top of page
    if (!container) {
      container = document.body;
    }

    // Check if button already exists
    if (document.getElementById('lichess-analyzer-btns') || document.getElementById('lichess-analyzer-btn')) {
      analysisButtonAdded = true;
      return;
    }

    // Button container for both buttons
    const btnContainer = document.createElement('div');
    btnContainer.id = 'lichess-analyzer-btns';
    btnContainer.style.cssText = `
      display: flex;
      gap: 8px;
      margin: 10px;
      align-items: center;
    `;

    // Main analyze button (overlay)
    const analyzeBtn = document.createElement('button');
    analyzeBtn.id = 'lichess-analyzer-btn';
    analyzeBtn.innerHTML = '☘️ Analyze';
    analyzeBtn.title = 'Open analysis overlay (ESC to close)';
    analyzeBtn.style.cssText = `
      background: linear-gradient(135deg, #324639 0%, #1a4d3a 100%);
      color: #f0e6d6;
      border: none;
      padding: 10px 18px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: transform 0.2s, box-shadow 0.2s;
    `;
    
    analyzeBtn.addEventListener('mouseenter', () => {
      analyzeBtn.style.transform = 'translateY(-2px)';
      analyzeBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });
    
    analyzeBtn.addEventListener('mouseleave', () => {
      analyzeBtn.style.transform = 'translateY(0)';
      analyzeBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    });

    analyzeBtn.addEventListener('click', async () => {
      try {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = '⏳ Loading...';
        
        const gameData = extractGameData();
        if (gameData) {
          try {
            await openAnalysisPage(gameData, true);
          } catch (e) {
            console.error('Error opening analysis page:', e);
            alert('Error opening analysis page. Please try again or reload the page.');
          }
        } else {
          alert('Could not find game data. Please make sure you are on a finished game page.');
        }
      } catch (e) {
        console.error('Error in analyze button click:', e);
        alert('An error occurred. Please try again or reload the page.');
      } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '☘️ Analyze';
      }
    });

    // New tab button (smaller, secondary)
    const newTabBtn = document.createElement('button');
    newTabBtn.innerHTML = '↗';
    newTabBtn.title = 'Open in new tab';
    newTabBtn.style.cssText = `
      background: #425249;
      color: #f0e6d6;
      border: none;
      padding: 10px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: transform 0.2s, background 0.2s;
    `;
    
    newTabBtn.addEventListener('mouseenter', () => {
      newTabBtn.style.transform = 'translateY(-2px)';
      newTabBtn.style.background = '#4a6252';
    });
    
    newTabBtn.addEventListener('mouseleave', () => {
      newTabBtn.style.transform = 'translateY(0)';
      newTabBtn.style.background = '#425249';
    });

    newTabBtn.addEventListener('click', async () => {
      try {
        newTabBtn.disabled = true;
        
        const gameData = extractGameData();
        if (gameData) {
          let pgn = gameData.pgn;
          if (!pgn && gameData.gameId) {
            try {
              pgn = await getPGNFromAPI(gameData.gameId);
            } catch (e) {
              console.error('Error fetching PGN:', e);
              alert('Error fetching game data. Please try again.');
              return;
            }
          }
          if (pgn) {
            try {
              if (!isExtensionValid()) {
                console.error('Extension context invalidated. Please reload the page.');
                alert('Extension context invalidated. Please reload the page and try again.');
                return;
              }
              
              chrome.storage.local.set({ currentGamePGN: pgn, gameUrl: window.location.href }, () => {
                try {
                  if (chrome.runtime.lastError) {
                    console.error('Storage error:', chrome.runtime.lastError);
                  }
                  try {
                    if (!isExtensionValid()) {
                      console.error('Extension context invalidated before sending message.');
                      return;
                    }
                    chrome.runtime.sendMessage({ action: 'openAnalysis', pgn: pgn }, (response) => {
                      if (chrome.runtime.lastError) {
                        console.error('Message error:', chrome.runtime.lastError);
                      }
                    });
                  } catch (e) {
                    console.error('Error sending message:', e);
                  }
                } catch (e) {
                  console.error('Error in storage callback:', e);
                }
              });
            } catch (e) {
              console.error('Error storing game data:', e);
              alert('Extension context invalidated. Please reload the page and try again.');
            }
          } else {
            alert('Could not extract game data. Please make sure you are on a finished game page.');
          }
        } else {
          alert('Could not find game data. Please make sure you are on a finished game page.');
        }
      } catch (e) {
        console.error('Error in new tab button click:', e);
        alert('An error occurred. Please try again or reload the page.');
      } finally {
        newTabBtn.disabled = false;
      }
    });

    btnContainer.appendChild(analyzeBtn);
    btnContainer.appendChild(newTabBtn);

    // Insert button container
    if (container === document.body) {
      container.insertBefore(btnContainer, container.firstChild);
    } else {
      container.appendChild(btnContainer);
    }

    analysisButtonAdded = true;
  }

  // Monitor for analysis pages and add analysis button
  function monitorGamePage() {
    if (isAnalysisPage()) {
      // Add analysis button only on analysis pages (/white or /black URLs)
      setTimeout(() => {
        addAnalysisButton();
      }, 1000);

      // Don't auto-analyze - only manual via button
    }
  }

  // Check if game has ended
  function checkGameEnded() {
    // Check for game end indicators
    const gameEndSelectors = [
      '.game-result',
      '.result',
      '[data-result]',
      '.status',
      '.game-over',
      '.result-wrap',
      '.game-status',
      '.round__result',
      '.result',
      '[class*="result"]',
      '[class*="finished"]'
    ];

    const hasEnded = gameEndSelectors.some(selector => {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent.trim().toLowerCase();
        return text.length > 0 && (
          text.includes('win') || 
          text.includes('draw') || 
          text.includes('resign') ||
          text.includes('checkmate') ||
          text.includes('time') ||
          text.includes('1-0') ||
          text.includes('0-1') ||
          text.includes('½-½')
        );
      }
      return false;
    });

    // Also check if we're on a finished game URL (not live)
    const isFinishedURL = window.location.pathname.match(/\/[a-zA-Z0-9]{8}(?:\/black|\/white)?$/) &&
                         !window.location.pathname.includes('/live/');

    return hasEnded || isFinishedURL;
  }

  // Listen for messages from background script
  try {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try {
        if (request.action === 'analyzeCurrentGame') {
          if (!isExtensionValid()) {
            sendResponse({ success: false, error: 'Extension context invalidated' });
            return true;
          }
          try {
            const gameData = extractGameData();
            if (gameData) {
              openAnalysisPage(gameData, true).catch(err => {
                console.error('Error opening analysis page:', err);
              });
              sendResponse({ success: true });
            } else {
              sendResponse({ success: false, error: 'No game data found' });
            }
          } catch (e) {
            console.error('Error in analyzeCurrentGame handler:', e);
            sendResponse({ success: false, error: 'Error: ' + e.message });
          }
        }
        return true;
      } catch (e) {
        console.error('Error in message listener:', e);
        try {
          sendResponse({ success: false, error: 'Extension context invalidated' });
        } catch (sendErr) {
          // Ignore errors when sending response fails
        }
        return true;
      }
    });
  } catch (e) {
    console.error('Error setting up message listener:', e);
  }

  // Check periodically for game pages (more frequently)
  setInterval(monitorGamePage, 1000);

  // Also check on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(monitorGamePage, 500);
    });
  } else {
    setTimeout(monitorGamePage, 500);
  }

  // Watch for URL changes (SPA navigation)
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      gameEndDetected = false; // Reset for new game
      userDismissedOverlay = false; // Reset dismiss flag for new game
      analysisButtonAdded = false; // Reset button flag
      console.log('URL changed, monitoring game page...');
      setTimeout(monitorGamePage, 500);
    }
  });
  
  urlObserver.observe(document, { subtree: true, childList: true });

  // Watch for DOM changes (only to add button on analysis pages, never auto-open)
  const domObserver = new MutationObserver(() => {
    if (isAnalysisPage()) {
      if (!analysisButtonAdded) {
        setTimeout(addAnalysisButton, 500);
      }
      // No auto-open - user must click button to analyze
    }
  });
  
  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-result']
  });

  // Initial check
  console.log('Badamo Blunders extension loaded');

})();

