// Quick script to use your agent ID directly as voice ID
// Run this in Chrome Console

(async function() {
  const agentId = 'agent_1201kd44fpr5ehethh3qchq0hj0a';
  
  console.log('🔧 Setting up agent as voice ID...');
  
  // Option 1: Try using agent ID directly as voice ID
  await chrome.storage.local.set({
    elevenlabsVoiceId: agentId
  });
  
  console.log('✅ Set voice ID to:', agentId);
  console.log('');
  console.log('🔄 Now reload the extension and test!');
  console.log('');
  console.log('If this doesn\'t work, you need to find the actual voice ID:');
  console.log('1. Go to ElevenLabs dashboard');
  console.log('2. Find your agent');
  console.log('3. Check what voice it\'s configured with');
  console.log('4. Get that voice\'s ID from https://elevenlabs.io/app/voices');
  console.log('5. Set it with: chrome.storage.local.set({ elevenlabsVoiceId: "VOICE_ID" })');
})();

