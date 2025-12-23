// Comprehensive test script for ElevenLabs agent voice
// Copy and paste this entire script into browser console (F12)

(async function testAgentVoice() {
  console.log('🔍 Testing ElevenLabs Agent Voice Setup...\n');
  
  // Step 1: Check Chrome storage
  console.log('1️⃣ Checking Chrome Storage...');
  const storage = await chrome.storage.local.get([
    'elevenlabsApiKey',
    'elevenlabsAgentId',
    'elevenlabsVoiceId',
    'azureProxyUrl'
  ]);
  
  console.log('   API Key:', storage.elevenlabsApiKey ? storage.elevenlabsApiKey.substring(0, 15) + '...' : '❌ NOT SET');
  console.log('   Agent ID:', storage.elevenlabsAgentId || '❌ NOT SET');
  console.log('   Voice ID:', storage.elevenlabsVoiceId || 'Not set (will use agent voice)');
  console.log('   Azure Proxy:', storage.azureProxyUrl || 'Not set');
  console.log('');
  
  if (!storage.elevenlabsApiKey || !storage.elevenlabsAgentId) {
    console.error('❌ Missing credentials! Set them first:');
    console.log(`
chrome.storage.local.set({
  elevenlabsApiKey: 'sk_dbbac21a4dd5ed7f06da1bf260221b0bcfb5d17bba0637d7',
  elevenlabsAgentId: 'agent_1201kd44fpr5ehethh3qchq0hj0a'
});
    `);
    return;
  }
  
  // Step 2: Check if functions are available
  console.log('2️⃣ Checking Functions...');
  console.log('   speakWithElevenLabs:', typeof window.speakWithElevenLabs === 'function' ? '✅' : '❌');
  console.log('   fetchAgentVoiceId:', typeof window.fetchAgentVoiceId === 'function' ? '✅' : '❌');
  console.log('   initializeAgentVoice:', typeof window.initializeAgentVoice === 'function' ? '✅' : '❌');
  console.log('');
  
  if (typeof window.fetchAgentVoiceId !== 'function') {
    console.error('❌ fetchAgentVoiceId function not available! Reload the extension.');
    return;
  }
  
  // Step 3: Test agent API
  console.log('3️⃣ Testing Agent API...');
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
      console.log('   ✅ Agent API working!');
      console.log('   Agent data keys:', Object.keys(agentData));
      console.log('   Full agent data:', JSON.stringify(agentData, null, 2));
      
      // Try to find voice ID
      const voiceId = agentData.voice_id || 
                     agentData.voice?.voice_id ||
                     agentData.voice?.id ||
                     agentData.agent?.voice_id ||
                     agentData.agent?.voice?.voice_id ||
                     agentData.config?.voice_id ||
                     agentData.config?.voice?.voice_id ||
                     agentData.voiceId ||
                     agentData.voice_settings?.voice_id;
      
      if (voiceId) {
        console.log('   ✅ Found voice ID:', voiceId);
      } else {
        console.error('   ❌ Voice ID not found in agent data!');
        console.log('   Check the agent data above to find where voice_id is stored.');
      }
    } else {
      const errorText = await response.text();
      console.error('   ❌ Agent API failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('   ❌ Error testing agent API:', error.message);
  }
  console.log('');
  
  // Step 4: Test voice fetch function
  console.log('4️⃣ Testing Voice Fetch Function...');
  try {
    const voiceId = await window.fetchAgentVoiceId(storage.elevenlabsApiKey, storage.elevenlabsAgentId);
    if (voiceId) {
      console.log('   ✅ Voice ID fetched:', voiceId);
    } else {
      console.error('   ❌ Voice ID fetch returned null/undefined');
    }
  } catch (error) {
    console.error('   ❌ Error fetching voice ID:', error.message);
    console.error('   Full error:', error);
  }
  console.log('');
  
  // Step 5: Test TTS
  console.log('5️⃣ Testing TTS...');
  if (typeof window.speakWithElevenLabs === 'function') {
    console.log('   Testing with sample text...');
    try {
      const result = await window.speakWithElevenLabs('Testing agent voice');
      if (result) {
        console.log('   ✅ TTS working!');
      } else {
        console.error('   ❌ TTS returned false');
      }
    } catch (error) {
      console.error('   ❌ TTS error:', error.message);
    }
  } else {
    console.error('   ❌ speakWithElevenLabs function not available');
  }
  
  console.log('\n✅ Test complete! Check results above.');
})();

