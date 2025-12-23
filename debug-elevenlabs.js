// Debug script - Run this in browser console to check ElevenLabs setup
// Copy and paste this entire script into your browser console (F12)

(async function debugElevenLabs() {
  console.log('🔍 Debugging ElevenLabs Setup...\n');
  
  // Check Chrome storage
  const storage = await chrome.storage.local.get([
    'elevenlabsApiKey',
    'elevenlabsAgentId',
    'elevenlabsVoiceId',
    'azureProxyUrl'
  ]);
  
  console.log('📦 Chrome Storage:');
  console.log('  API Key:', storage.elevenlabsApiKey ? storage.elevenlabsApiKey.substring(0, 10) + '...' : '❌ NOT SET');
  console.log('  Agent ID:', storage.elevenlabsAgentId || '❌ NOT SET');
  console.log('  Voice ID:', storage.elevenlabsVoiceId || '❌ NOT SET');
  console.log('  Azure Proxy URL:', storage.azureProxyUrl || '❌ NOT SET');
  console.log('');
  
  // Check if Key Vault function is available
  if (typeof window.loadElevenLabsFromKeyVault === 'function') {
    console.log('🔐 Testing Key Vault...');
    const loaded = await window.loadElevenLabsFromKeyVault();
    console.log('  Key Vault load result:', loaded ? '✅ Success' : '❌ Failed');
    console.log('');
  } else {
    console.log('⚠️ Key Vault function not available');
    console.log('');
  }
  
  // Test agent API if we have credentials
  if (storage.elevenlabsApiKey && storage.elevenlabsAgentId) {
    console.log('🧪 Testing Agent API...');
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/agent/${storage.elevenlabsAgentId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': storage.elevenlabsApiKey
        }
      });
      
      if (response.ok) {
        const agentData = await response.json();
        console.log('✅ Agent API working!');
        console.log('  Agent data:', agentData);
        console.log('  Available keys:', Object.keys(agentData));
        
        // Try to find voice ID
        const voiceId = agentData.voice_id || 
                       agentData.voice?.voice_id ||
                       agentData.voice?.id ||
                       agentData.agent?.voice_id;
        if (voiceId) {
          console.log('  ✅ Found voice ID:', voiceId);
        } else {
          console.log('  ⚠️ Voice ID not found in response');
        }
      } else {
        const errorText = await response.text();
        console.log('❌ Agent API failed:', response.status, errorText);
      }
    } catch (error) {
      console.log('❌ Error testing agent API:', error.message);
    }
  } else {
    console.log('⚠️ Cannot test Agent API - missing credentials');
  }
  
  console.log('\n✅ Debug complete!');
})();

