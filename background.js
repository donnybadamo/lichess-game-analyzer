// Background service worker for Chrome extension

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openAnalysis') {
    // Open analysis page in new tab with PGN in URL
    const pgn = request.pgn || '';
    const url = chrome.runtime.getURL('analysis.html') + (pgn ? `?pgn=${encodeURIComponent(pgn)}` : '');
    chrome.tabs.create({
      url: url
    });
    sendResponse({ success: true });
  }
  return true;
});

