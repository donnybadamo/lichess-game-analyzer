// Load libraries using extension URLs for CSP compliance
const loadScript = (src, optional = false) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(src);
    script.onload = resolve;
    script.onerror = () => {
      if (optional) {
        console.log(`Optional script not found: ${src}`);
        resolve(); // Resolve instead of reject for optional scripts
      } else {
        console.error('Failed to load:', src);
        reject(new Error(`Failed to load ${src}`));
      }
    };
    document.head.appendChild(script);
  });
};

const loadCSS = (href) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL(href);
  document.head.appendChild(link);
};

// Load CSS
loadCSS('libs/chessboard.css');

// Load scripts in order
console.log('Loading libraries...');

// Load jQuery first and wait for it to be fully available
loadScript('libs/jquery.min.js').then(() => {
  console.log('✓ jQuery script loaded');
  
  // Wait for jQuery to be available globally with proper prototype
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // 500ms max wait
    
    const checkJQuery = () => {
      attempts++;
      
      // Check if jQuery is fully initialized with fn property
      if (typeof window.$ !== 'undefined' && 
          typeof window.jQuery !== 'undefined' && 
          window.$.fn && 
          typeof window.$.fn === 'object') {
        console.log('✓ jQuery fully initialized ($, jQuery, and $.fn available)');
        console.log('✓ jQuery version check:', window.$.fn.jquery || 'unknown');
        resolve();
      } else if (attempts >= maxAttempts) {
        console.error('jQuery check failed:', {
          $: typeof window.$,
          jQuery: typeof window.jQuery,
          $fn: typeof window.$?.fn,
          jQueryFn: typeof window.jQuery?.fn
        });
        reject(new Error('jQuery failed to initialize properly'));
      } else {
        setTimeout(checkJQuery, 10);
      }
    };
    
    // Start checking after a small delay to let jQuery initialize
    setTimeout(checkJQuery, 50);
  });
}).then(() => {
  // Now load Chess.js and Chessboard.js in parallel
  return Promise.all([
    // Load chess.js as ESM module
    import(chrome.runtime.getURL('libs/chess-esm.js')).then(chessModule => {
      console.log('✓ Chess.js ESM loaded', chessModule);
      window.Chess = chessModule.Chess;
      // Also set global Chess for compatibility
      if (typeof window !== 'undefined') {
        window.Chess = chessModule.Chess;
      }
      return Promise.resolve();
    }).catch(err => {
      console.error('Failed to load chess-esm.js:', err);
      throw err;
    }),
    // Load Chessboard.js after jQuery is ready
    loadScript('libs/chessboard.min.js').then(() => {
      console.log('✓ Chessboard.js loaded');
      // Verify Chessboard is available
      if (typeof window.Chessboard === 'undefined') {
        throw new Error('Chessboard not available after loading');
      }
      return Promise.resolve();
    })
  ]);
}).then(() => {
  console.log('All libraries loaded, verifying...');
  
  // Verify jQuery is available
  if (typeof window.$ === 'undefined' || typeof window.jQuery === 'undefined') {
    console.error('jQuery not found on window object');
    throw new Error('jQuery library not loaded - $ and jQuery are undefined');
  }
  console.log('✓ jQuery verified: $ and jQuery available');
  
  // Verify Chess is available
  if (typeof window.Chess === 'undefined') {
    console.error('Chess not found on window object');
    throw new Error('Chess library not loaded - window.Chess is undefined');
  }
  console.log('✓ Chess verified:', typeof window.Chess);
  
  // Verify Chessboard is available
  if (typeof window.Chessboard === 'undefined') {
    console.error('Chessboard not found on window object');
    throw new Error('Chessboard library not loaded - window.Chessboard is undefined');
  }
  console.log('✓ Chessboard verified:', typeof window.Chessboard);
  
  // Load secrets from file (secrets.js) if it exists (optional)
  return loadScript('secrets.js', true).then(() => {
    // If secrets.js was loaded, store them in Chrome storage
    if (typeof window.ELEVENLABS_SECRETS !== 'undefined' && window.ELEVENLABS_SECRETS) {
      const secrets = window.ELEVENLABS_SECRETS;
      if (secrets.apiKey && secrets.apiKey !== 'sk_your_api_key_here') {
        console.log('🔐 Loading secrets from secrets.js file...');
        const credentials = { elevenlabsApiKey: secrets.apiKey };
        if (secrets.agentId && secrets.agentId !== 'your_agent_id_here') {
          credentials.elevenlabsAgentId = secrets.agentId;
        }
        if (secrets.voiceId && secrets.voiceId !== 'your_voice_id_here') {
          credentials.elevenlabsVoiceId = secrets.voiceId;
        }
        chrome.storage.local.set(credentials).then(() => {
          console.log('✅ Secrets loaded from secrets.js and stored in Chrome storage');
        });
      } else {
        console.log('💡 secrets.js found but contains placeholder values - using Chrome storage');
      }
    }
    
    // Load Cloudflare secrets integration (optional - only if Worker URL is set)
    return chrome.storage.local.get(['cloudflareWorkerUrl']).then(storage => {
      if (storage.cloudflareWorkerUrl) {
        console.log('Loading Cloudflare secrets integration (optional)...');
        return loadScript('cloudflare-secrets.js').then(() => {
          console.log('✓ Cloudflare secrets integration loaded');
          // Try to load credentials from Cloudflare Worker (non-blocking)
          if (typeof window.loadElevenLabsCredentials === 'function') {
            window.loadElevenLabsCredentials().catch(err => {
              console.warn('⚠️ Cloudflare Worker not available:', err.message);
              console.log('💡 Using local credentials from Chrome storage instead');
            });
          }
        }).catch(err => {
          console.warn('⚠️ Could not load Cloudflare secrets integration:', err.message);
          console.log('💡 Extension will use local credentials from Chrome storage');
        });
      } else {
        console.log('💡 Using local credentials from Chrome storage or secrets.js');
      }
    });
  });
}).then(() => {
  
  // Load local voice system first (for uploaded voice files)
  console.log('Loading local voice system...');
  return loadScript('local-voice.js', true).then(() => {
    console.log('✓ Local voice system loaded');
    // Initialize voice DB
    if (typeof window.initVoiceDB === 'function') {
      window.initVoiceDB().catch(err => {
        console.warn('⚠️ Failed to initialize voice DB:', err.message);
      });
    }
  });
}).then(() => {
  
  // Load ElevenLabs TTS script
  console.log('Loading ElevenLabs TTS...');
  return loadScript('elevenlabs-tts.js');
}).then(() => {
  console.log('✓ ElevenLabs TTS loaded');
  
  // Initialize agent voice after a short delay to ensure storage is ready
  setTimeout(() => {
    if (typeof window.initializeAgentVoice === 'function') {
      window.initializeAgentVoice();
    }
  }, 500);
  
  // Load analysis script after libraries
  console.log('Loading analysis.js...');
  return loadScript('analysis.js');
}).then(() => {
  console.log('✓ All scripts loaded successfully');
}).catch(err => {
  console.error('Error loading libraries:', err);
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'padding: 40px; text-align: center;';
  errorDiv.innerHTML = '<h2>Error Loading Extension</h2><p>Could not load required libraries. Please reload the extension.</p><p style="color: red;">' + err.message + '</p><p>Check browser console (F12) for details.</p>';
  document.body.appendChild(errorDiv);
});

