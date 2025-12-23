/**
 * Helper script to fetch all ElevenLabs voices and find your voice ID
 * 
 * Usage:
 * 1. Open Chrome DevTools Console (F12)
 * 2. Copy and paste this entire script
 * 3. Replace YOUR_API_KEY with your actual API key
 * 4. Run it
 * 
 * This will show all your voices and their IDs
 */

(async function fetchVoices() {
  // Get API key from Chrome storage or use manual
  const storage = await chrome.storage.local.get(['elevenlabsApiKey']);
  const apiKey = storage.elevenlabsApiKey || 'YOUR_API_KEY_HERE';
  
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    console.error('❌ API key not found!');
    console.log('💡 Set it first: chrome.storage.local.set({ elevenlabsApiKey: "sk_..." })');
    console.log('💡 Or replace YOUR_API_KEY_HERE in this script');
    return;
  }
  
  console.log('🔍 Fetching voices from ElevenLabs...');
  console.log('📡 API Key:', apiKey.substring(0, 15) + '...');
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching voices:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    const voices = data.voices || [];
    
    console.log(`\n✅ Found ${voices.length} voices:\n`);
    console.log('='.repeat(80));
    
    voices.forEach((voice, index) => {
      console.log(`\n${index + 1}. ${voice.name || 'Unnamed'}`);
      console.log(`   Voice ID: ${voice.voice_id}`);
      console.log(`   Category: ${voice.category || 'N/A'}`);
      console.log(`   Description: ${voice.description || 'N/A'}`);
      if (voice.labels) {
        console.log(`   Labels:`, voice.labels);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 To use a voice, copy its Voice ID and run:');
    console.log('   chrome.storage.local.set({ elevenlabsVoiceId: "VOICE_ID_HERE" })');
    console.log('\n💡 Or add it to Cloudflare Worker secret: ELEVENLABS_VOICE_ID');
    
    // If agent ID is set, try to find matching voice
    const agentStorage = await chrome.storage.local.get(['elevenlabsAgentId']);
    if (agentStorage.elevenlabsAgentId) {
      console.log(`\n🔍 Looking for voice matching agent: ${agentStorage.elevenlabsAgentId}`);
      // Note: Agent ID won't match voice ID, but we can show all voices
      console.log('   (Agent IDs and Voice IDs are different - check voice names/descriptions)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();

