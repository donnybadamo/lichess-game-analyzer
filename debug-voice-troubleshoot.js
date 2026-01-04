// Voice Troubleshooting Script
// Run this in the browser console (F12) on the analysis page

async function troubleshootVoice() {
  console.log('🔍 Voice Troubleshooting Started...\n');
  
  // Step 1: Check Cloudflare Worker URL
  console.log('1️⃣ Checking Cloudflare Worker URL...');
  const workerUrl = await chrome.storage.local.get(['cloudflareWorkerUrl']);
  if (workerUrl.cloudflareWorkerUrl) {
    console.log('✅ Worker URL set:', workerUrl.cloudflareWorkerUrl);
    
    // Test Worker
    try {
      const testResponse = await fetch(`${workerUrl.cloudflareWorkerUrl}/get-secret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretName: 'ELEVENLABS_AGENT_ID' })
      });
      if (testResponse.ok) {
        const data = await testResponse.json();
        console.log('✅ Worker is accessible, Agent ID:', data.secretValue ? 'Found' : 'Not found');
      } else {
        console.error('❌ Worker returned error:', testResponse.status);
      }
    } catch (e) {
      console.error('❌ Worker test failed:', e.message);
    }
  } else {
    console.error('❌ Worker URL not set!');
    console.log('💡 Set it: chrome.storage.local.set({ cloudflareWorkerUrl: "https://your-worker.workers.dev" })');
  }
  
  // Step 2: Check credentials in storage
  console.log('\n2️⃣ Checking credentials in Chrome storage...');
  const credentials = await chrome.storage.local.get(['elevenlabsApiKey', 'elevenlabsAgentId', 'elevenlabsVoiceId']);
  console.log('API Key:', credentials.elevenlabsApiKey ? `${credentials.elevenlabsApiKey.substring(0, 15)}...` : '❌ Not set');
  console.log('Agent ID:', credentials.elevenlabsAgentId || '❌ Not set');
  console.log('Voice ID:', credentials.elevenlabsVoiceId || '❌ Not set (will fetch from agent)');
  
  // Step 3: Check if functions are loaded
  console.log('\n3️⃣ Checking if voice functions are loaded...');
  console.log('speakWithElevenLabs:', typeof window.speakWithElevenLabs);
  console.log('initializeAgentVoice:', typeof window.initializeAgentVoice);
  console.log('loadElevenLabsCredentials:', typeof window.loadElevenLabsCredentials);
  
  // Step 4: Try to load credentials
  if (typeof window.loadElevenLabsCredentials === 'function') {
    console.log('\n4️⃣ Attempting to load credentials from Cloudflare Worker...');
    try {
      const loaded = await window.loadElevenLabsCredentials();
      if (loaded) {
        console.log('✅ Credentials loaded successfully!');
        // Re-check storage
        const newCreds = await chrome.storage.local.get(['elevenlabsApiKey', 'elevenlabsAgentId']);
        console.log('Updated API Key:', newCreds.elevenlabsApiKey ? 'Set' : 'Still missing');
        console.log('Updated Agent ID:', newCreds.elevenlabsAgentId || 'Still missing');
      } else {
        console.error('❌ Failed to load credentials');
      }
    } catch (e) {
      console.error('❌ Error loading credentials:', e.message);
    }
  }
  
  // Step 5: Test voice function
  if (typeof window.speakWithElevenLabs === 'function') {
    console.log('\n5️⃣ Testing voice function with sample text...');
    try {
      const result = await window.speakWithElevenLabs('Testing voice system');
      if (result) {
        console.log('✅ Voice test successful!');
      } else {
        console.error('❌ Voice test returned false');
      }
    } catch (e) {
      console.error('❌ Voice test error:', e.message);
      console.error('Full error:', e);
    }
  } else {
    console.error('❌ speakWithElevenLabs function not available');
  }
  
  // Step 6: Check browser TTS fallback
  console.log('\n6️⃣ Checking browser TTS fallback...');
  if (window.speechSynthesis) {
    const voices = window.speechSynthesis.getVoices();
    console.log('✅ Browser TTS available,', voices.length, 'voices found');
    const selectedVoice = voices.find(v => v.name.includes('Daniel') || v.name.includes('David'));
    console.log('Selected voice:', selectedVoice ? selectedVoice.name : 'None');
  } else {
    console.error('❌ Browser TTS not available');
  }
  
  console.log('\n✅ Troubleshooting complete!');
  console.log('💡 Check the errors above to identify the issue.');
}

// Run it
troubleshootVoice();

