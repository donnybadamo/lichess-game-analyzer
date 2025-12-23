// Debug script to check why agent voice isn't working
// Run this in the browser console on the analysis page

(async function debugVoice() {
  console.log('🔍 DEBUGGING ELEVENLABS VOICE ISSUE');
  console.log('=====================================\n');
  
  // 1. Check Chrome storage
  console.log('1️⃣ Checking Chrome Storage...');
  const storage = await chrome.storage.local.get([
    'elevenlabsApiKey',
    'elevenlabsAgentId',
    'elevenlabsVoiceId',
    'azureProxyUrl'
  ]);
  
  console.log('  API Key:', storage.elevenlabsApiKey ? storage.elevenlabsApiKey.substring(0, 20) + '...' : '❌ NOT SET');
  console.log('  Agent ID:', storage.elevenlabsAgentId || '❌ NOT SET');
  console.log('  Voice ID:', storage.elevenlabsVoiceId || '❌ NOT SET');
  console.log('  Azure Proxy:', storage.azureProxyUrl || '❌ NOT SET');
  console.log('');
  
  if (!storage.elevenlabsApiKey) {
    console.error('❌ API KEY MISSING! Set it with:');
    console.log('chrome.storage.local.set({ elevenlabsApiKey: "sk_..." });');
    return;
  }
  
  if (!storage.elevenlabsAgentId) {
    console.error('❌ AGENT ID MISSING! Set it with:');
    console.log('chrome.storage.local.set({ elevenlabsAgentId: "agent_..." });');
    return;
  }
  
  // 2. Check if functions are available
  console.log('2️⃣ Checking function availability...');
  console.log('  speakWithElevenLabs:', typeof window.speakWithElevenLabs);
  console.log('  fetchAgentVoiceId:', typeof window.fetchAgentVoiceId);
  console.log('  initializeAgentVoice:', typeof window.initializeAgentVoice);
  console.log('');
  
  // 3. Try to fetch agent voice ID
  console.log('3️⃣ Fetching agent voice ID...');
  try {
    const voiceId = await window.fetchAgentVoiceId(
      storage.elevenlabsApiKey,
      storage.elevenlabsAgentId
    );
    console.log('  ✅ Agent voice ID:', voiceId);
  } catch (error) {
    console.error('  ❌ Failed to fetch agent voice ID:', error);
    console.log('  Error details:', error.message);
  }
  console.log('');
  
  // 4. Check agent API directly
  console.log('4️⃣ Testing Agent API directly...');
  const endpoints = [
    `https://api.elevenlabs.io/v1/convai/agents/${storage.elevenlabsAgentId}`,
    `https://api.elevenlabs.io/v1/convai/agent/${storage.elevenlabsAgentId}`,
    `https://api.elevenlabs.io/v1/convai/${storage.elevenlabsAgentId}`,
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`  Testing: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': storage.elevenlabsApiKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('  ✅ SUCCESS! Response:', JSON.stringify(data, null, 2));
        
        // Try to find voice ID
        const voiceId = data.voice_id || 
                       data.voice?.voice_id ||
                       data.voice?.id ||
                       data.agent?.voice_id ||
                       data.agent?.voice?.voice_id ||
                       data.config?.voice_id ||
                       data.config?.voice?.voice_id ||
                       data.voiceId ||
                       data.voice_settings?.voice_id;
        
        if (voiceId) {
          console.log('  🎤 Found voice ID:', voiceId);
        } else {
          console.log('  ⚠️ Voice ID not found in response');
          console.log('  Available keys:', Object.keys(data));
        }
        break;
      } else {
        const errorText = await response.text();
        console.log(`  ❌ Failed: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
    }
  }
  console.log('');
  
  // 5. Test TTS with current voice ID
  console.log('5️⃣ Testing TTS call...');
  if (window.speakWithElevenLabs) {
    console.log('  Calling speakWithElevenLabs("Test voice")...');
    const result = await window.speakWithElevenLabs('Test voice');
    console.log('  Result:', result ? '✅ Success' : '❌ Failed');
  } else {
    console.log('  ❌ speakWithElevenLabs not available');
  }
  console.log('');
  
  // 6. Check what voice ID is actually being used
  console.log('6️⃣ Checking cached voice ID...');
  console.log('  agentVoiceIdCache:', window.agentVoiceIdCache || 'null');
  console.log('');
  
  console.log('✅ Debug complete!');
  console.log('\n💡 If agent voice ID is found but wrong voice plays:');
  console.log('   - The agent might be configured with a different voice');
  console.log('   - Check your ElevenLabs dashboard for the agent\'s voice settings');
  console.log('   - Or manually set elevenlabsVoiceId to your desired voice ID');
})();

