// Debug script for Key Vault integration
// Run this in Chrome Console on the analysis page

(async function debugKeyVault() {
  console.log('🔍 DEBUGGING KEY VAULT INTEGRATION');
  console.log('==================================\n');
  
  // 1. Check if Cloudflare Worker URL is set
  console.log('1️⃣ Checking Cloudflare Worker URL...');
  const storage = await chrome.storage.local.get(['cloudflareWorkerUrl', 'azureProxyUrl']);
  const workerUrl = storage.cloudflareWorkerUrl || storage.azureProxyUrl;
  
  if (!workerUrl) {
    console.error('❌ Cloudflare Worker URL NOT SET!');
    console.log('');
    console.log('💡 Set it with:');
    console.log('   chrome.storage.local.set({ cloudflareWorkerUrl: "https://your-worker.workers.dev" });');
    console.log('');
    console.log('   Or if using Azure Function:');
    console.log('   chrome.storage.local.set({ azureProxyUrl: "https://your-function.azurewebsites.net" });');
    return;
  }
  
  console.log('✅ Worker URL:', workerUrl);
  console.log('');
  
  // 2. Test fetching a secret
  console.log('2️⃣ Testing secret fetch...');
  
  if (typeof window.getSecretFromKeyVault !== 'function') {
    console.error('❌ getSecretFromKeyVault function not available!');
    console.log('   Make sure azure-keyvault.js is loaded');
    return;
  }
  
  // Try different secret name variations
  const secretNames = [
    'elevenlabs-api-key',
    'elevenlabsApiKey',
    'ELEVENLABS_API_KEY'
  ];
  
  for (const secretName of secretNames) {
    console.log(`   Trying secret: "${secretName}"...`);
    try {
      const secret = await window.getSecretFromKeyVault(secretName);
      if (secret) {
        console.log(`   ✅ Found! Value: ${secret.substring(0, 15)}...`);
        break;
      } else {
        console.log(`   ❌ Not found`);
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
    }
  }
  console.log('');
  
  // 3. Test the Worker endpoint directly
  console.log('3️⃣ Testing Worker endpoint directly...');
  const endpoint = workerUrl.endsWith('/get-secret') 
    ? workerUrl 
    : `${workerUrl.replace(/\/$/, '')}/get-secret`;
  
  console.log('   Endpoint:', endpoint);
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secretName: 'elevenlabs-api-key'
      })
    });
    
    console.log('   Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Success! Response:', data);
      if (data.secretValue || data.value || data.secret) {
        console.log('   Secret value:', (data.secretValue || data.value || data.secret).substring(0, 15) + '...');
      }
    } else {
      const errorText = await response.text();
      console.error('   ❌ Error response:', errorText);
    }
  } catch (error) {
    console.error('   ❌ Fetch error:', error.message);
  }
  console.log('');
  
  // 4. Try loading credentials
  console.log('4️⃣ Testing loadElevenLabsFromKeyVault()...');
  if (typeof window.loadElevenLabsFromKeyVault === 'function') {
    try {
      const result = await window.loadElevenLabsFromKeyVault();
      console.log('   Result:', result ? '✅ Success' : '❌ Failed');
      
      if (result) {
        const creds = await chrome.storage.local.get([
          'elevenlabsApiKey',
          'elevenlabsAgentId',
          'elevenlabsVoiceId'
        ]);
        console.log('   Loaded credentials:');
        console.log('     API Key:', creds.elevenlabsApiKey ? creds.elevenlabsApiKey.substring(0, 15) + '...' : 'Not set');
        console.log('     Agent ID:', creds.elevenlabsAgentId || 'Not set');
        console.log('     Voice ID:', creds.elevenlabsVoiceId || 'Not set');
      }
    } catch (error) {
      console.error('   ❌ Error:', error.message);
    }
  } else {
    console.error('   ❌ loadElevenLabsFromKeyVault function not available!');
  }
  console.log('');
  
  console.log('✅ Debug complete!');
  console.log('');
  console.log('💡 Common issues:');
  console.log('   1. Worker URL not set → Set cloudflareWorkerUrl');
  console.log('   2. Secret name wrong → Check Azure Key Vault secret names');
  console.log('   3. Worker not deployed → Deploy Cloudflare Worker');
  console.log('   4. Worker secrets not set → Add secrets in Worker settings');
})();

