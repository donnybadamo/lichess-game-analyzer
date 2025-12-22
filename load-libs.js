// Load libraries using extension URLs for CSP compliance
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(src);
    script.onload = resolve;
    script.onerror = () => {
      console.error('Failed to load:', src);
      reject(new Error(`Failed to load ${src}`));
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

