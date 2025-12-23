// ElevenLabs Text-to-Speech with Conversational AI Agent support

// Cache for agent voice ID
let agentVoiceIdCache = null;
let agentVoiceFetchPromise = null; // Prevent multiple simultaneous fetches

// Pre-fetch agent voice ID when page loads
async function initializeAgentVoice() {
  try {
    const storage = await chrome.storage.local.get(['elevenlabsApiKey', 'elevenlabsAgentId']);
    const apiKey = storage.elevenlabsApiKey;
    const agentId = storage.elevenlabsAgentId;
    
    if (!apiKey || !agentId) {
      console.log('⚠️ Agent voice initialization skipped - missing credentials');
      return;
    }
    
    console.log('🔍 Initializing agent voice for:', agentId);
    await fetchAgentVoiceId(apiKey, agentId);
  } catch (error) {
    console.error('Error initializing agent voice:', error);
  }
}

// Fetch agent voice ID
async function fetchAgentVoiceId(apiKey, agentId) {
  // Return cached if available
  if (agentVoiceIdCache) {
    return agentVoiceIdCache;
  }
  
  // Return existing promise if fetch is in progress
  if (agentVoiceFetchPromise) {
    return agentVoiceFetchPromise;
  }
  
  // Start fetch
  agentVoiceFetchPromise = (async () => {
    try {
      // Try the correct endpoint for Conversational AI agents
      const endpoint = `https://api.elevenlabs.io/v1/convai/agent/${agentId}`;
      console.log('📡 Fetching agent from:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': apiKey
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Agent API failed:', response.status, errorText);
        throw new Error(`Agent API failed: ${response.status}`);
      }
      
      const agentData = await response.json();
      console.log('📦 Agent data received:', agentData);
      
      // Try to find voice ID in various locations
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
        agentVoiceIdCache = voiceId;
        console.log('✅ Agent voice ID found:', voiceId);
        return voiceId;
      } else {
        console.error('❌ Voice ID not found in agent data');
        console.log('Full agent structure:', JSON.stringify(agentData, null, 2));
        console.log('Available keys:', Object.keys(agentData));
        throw new Error('Voice ID not found in agent data');
      }
    } catch (error) {
      console.error('❌ Error fetching agent voice:', error);
      throw error;
    } finally {
      agentVoiceFetchPromise = null;
    }
  })();
  
  return agentVoiceFetchPromise;
}

async function speakWithElevenLabs(text) {
  try {
    const storage = await chrome.storage.local.get(['elevenlabsApiKey', 'elevenlabsAgentId', 'elevenlabsVoiceId']);
    const apiKey = storage.elevenlabsApiKey;
    const agentId = storage.elevenlabsAgentId;
    const voiceId = storage.elevenlabsVoiceId;
    
    if (!apiKey) {
      console.log('ElevenLabs API key not set. Using fallback voice.');
      return false;
    }
    
    // Get agent's voice ID if agent is configured
    let finalVoiceId = voiceId;
    
    if (agentId) {
      console.log('🎙️ Using ElevenLabs Agent:', agentId);
      
      // Fetch agent voice ID if not cached
      if (!agentVoiceIdCache) {
        try {
          await fetchAgentVoiceId(apiKey, agentId);
        } catch (error) {
          console.error('⚠ Failed to fetch agent voice ID:', error);
        }
      }
      
      // Use agent's voice ID, fallback to configured voice, then default
      finalVoiceId = agentVoiceIdCache || voiceId || 'pNInz6obpgDQGcFmaJgB';
      
      if (agentVoiceIdCache) {
        console.log('🎤 Using agent voice ID:', finalVoiceId);
      } else {
        console.warn('⚠️ Using fallback voice ID:', finalVoiceId, '(agent voice not found)');
      }
    } else {
      finalVoiceId = voiceId || 'pNInz6obpgDQGcFmaJgB';
      console.log('Speaking with ElevenLabs voice:', finalVoiceId);
    }
    
    // Use ElevenLabs TTS endpoint with smooth jazz announcer settings
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.65,        // Smooth, consistent (jazz announcer vibe)
          similarity_boost: 0.75,  // Natural sounding
          style: 0.25,            // Subtle expressiveness (not too crazy)
          use_speaker_boost: true // Enhanced clarity
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs TTS error:', response.status, errorText);
      return false;
    }
    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve(true);
      };
      audio.onerror = (error) => {
        console.error('Audio error:', error);
        URL.revokeObjectURL(audioUrl);
        resolve(false);
      };
      audio.play().catch(err => {
        console.error('Play error:', err);
        resolve(false);
      });
    });
    
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    return false;
  }
}

// Make functions globally available
window.speakWithElevenLabs = speakWithElevenLabs;
window.initializeAgentVoice = initializeAgentVoice;
window.fetchAgentVoiceId = fetchAgentVoiceId;

// Initialize agent voice when script loads
if (typeof chrome !== 'undefined' && chrome.storage) {
  initializeAgentVoice();
}

