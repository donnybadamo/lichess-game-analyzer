// Initialize script - loads load-libs.js dynamically
(function() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('load-libs.js');
  script.onerror = function() {
    console.error('Failed to load load-libs.js');
    document.body.innerHTML = '<div style="padding: 40px; text-align: center;"><h2>Error</h2><p>Failed to load extension scripts. Please reload the extension.</p></div>';
  };
  document.head.appendChild(script);
})();

