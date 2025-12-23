// Quick script to set your Cloudflare Worker URL
// Run this in Chrome Console

(async function() {
  // Replace with your actual Cloudflare Worker URL
  const workerUrl = 'https://lichess-keyvault-proxy.YOUR_SUBDOMAIN.workers.dev';
  
  console.log('🔧 Setting Cloudflare Worker URL...');
  
  await chrome.storage.local.set({
    cloudflareWorkerUrl: workerUrl
  });
  
  console.log('✅ Set Cloudflare Worker URL to:', workerUrl);
  console.log('');
  console.log('🔄 Now reload the extension to load credentials from Key Vault!');
  console.log('');
  console.log('To test:');
  console.log('  window.loadElevenLabsFromKeyVault().then(() => {');
  console.log('    chrome.storage.local.get(null, console.log);');
  console.log('  });');
})();

