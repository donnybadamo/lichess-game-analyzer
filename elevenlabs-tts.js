/**
 * ElevenLabs Text-to-Speech Integration
 * Supports Conversational AI Agents and direct voice IDs
 */

// Cache for agent voice ID to avoid repeated API calls
let agentVoiceIdCache = null;
let agentVoiceFetchPromise = null; // Prevent multiple simultaneous fetches

/**
 * Pre-fetch agent voice ID when page loads
 * This improves performance by caching the voice ID early
 */
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
    console.error('❌ Error initializing agent voice:', error);
  }
}

/**
 * Fetches the voice ID associated with an ElevenLabs Conversational AI Agent
 * @param {string} apiKey - ElevenLabs API key
 * @param {string} agentId - Agent ID
 * @returns {Promise<string>} Voice ID
 */
async function fetchAgentVoiceId(apiKey, agentId) {
  // Return cached value if available
  if (agentVoiceIdCache) {
    return agentVoiceIdCache;
  }
  
  // Return existing promise if fetch is in progress (prevents duplicate requests)
  if (agentVoiceFetchPromise) {
    return agentVoiceFetchPromise;
  }
  
  // Start fetch
  agentVoiceFetchPromise = (async () => {
    try {
      // Try multiple possible endpoints for Conversational AI agents
      // Note: Requires API key with 'convai_read' permission
      const endpoints = [
        `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,     // Plural "agents" (most common)
        `https://api.elevenlabs.io/v1/convai/agent/${agentId}`,      // Singular "agent"
        `https://api.elevenlabs.io/v1/convai/${agentId}`,            // Direct
        `https://api.elevenlabs.io/v1/convai/conversations/${agentId}`, // Conversations endpoint
      ];
      
      let agentData = null;
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log('📡 Trying endpoint:', endpoint);
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'xi-api-key': apiKey
            }
          });
          
          if (response.ok) {
            agentData = await response.json();
            console.log('✅ Agent data received from:', endpoint);
            break;
          } else {
            const errorText = await response.text();
            let errorData = null;
            try {
              errorData = JSON.parse(errorText);
            } catch (e) {
              errorData = { detail: errorText };
            }
            
            // Check for missing permissions (401)
            if (response.status === 401 && errorData.detail?.status === 'missing_permissions') {
              console.warn('⚠️ API key missing convai_read permission - cannot fetch agent voice');
              console.log('💡 Solution: Set elevenlabsVoiceId manually in Chrome storage');
              throw new Error('MISSING_PERMISSIONS: API key lacks convai_read permission');
            }
            
            console.log(`⚠️ Endpoint ${endpoint} failed:`, response.status, errorText);
            lastError = { status: response.status, text: errorText };
          }
        } catch (err) {
          console.log(`⚠️ Error with endpoint ${endpoint}:`, err.message);
          lastError = err;
        }
      }
      
      if (!agentData) {
        // Check if it's a permissions error
        if (lastError?.text && lastError.text.includes('missing_permissions')) {
          throw new Error('MISSING_PERMISSIONS: API key lacks convai_read permission');
        }
        
        console.error('❌ All agent API endpoints failed');
        if (lastError) {
          throw new Error(`Agent API failed: ${lastError.status || 'Network error'} - ${lastError.text || lastError.message}`);
        }
        throw new Error('Agent API failed: All endpoints returned errors');
      }
      
      // Try to find voice ID in various locations
      const voiceId = agentData.conversation_config?.tts?.voice_id ||  // Most common location
                     agentData.voice_id || 
                     agentData.voice?.voice_id ||
                     agentData.voice?.id ||
                     agentData.agent?.voice_id ||
                     agentData.agent?.voice?.voice_id ||
                     agentData.config?.voice_id ||
                     agentData.config?.voice?.voice_id ||
                     agentData.config?.tts?.voice_id ||
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
    let apiKey = storage.elevenlabsApiKey;
    const agentId = storage.elevenlabsAgentId;
    const voiceId = storage.elevenlabsVoiceId;
    
    if (!apiKey) {
      console.error('❌ ElevenLabs API key not set!');
      console.log('💡 Set your API key in the extension popup');
      console.log('💡 Or set manually: chrome.storage.local.set({ elevenlabsApiKey: "sk_..." })');
      console.log('💡 Also set: elevenlabsAgentId (optional) and elevenlabsVoiceId (optional)');
      return false;
    }
    
    // Verify API key format (some API keys may not start with sk_)
    if (!apiKey.startsWith('sk_') && apiKey.length < 20) {
      console.warn('⚠️ API key format looks unusual (most ElevenLabs keys start with "sk_")');
    }
    
    // ONLY use agent API to fetch voice ID (no manual override)
    let finalVoiceId = null;
    
    if (agentId) {
      console.log('🎙️ Using ElevenLabs Agent:', agentId);
      console.log('🔍 Fetching agent voice ID from API...');
      
      // Always fetch agent voice ID if not cached
      if (!agentVoiceIdCache) {
        try {
          await fetchAgentVoiceId(apiKey, agentId);
        } catch (error) {
          if (error.message && error.message.includes('MISSING_PERMISSIONS')) {
            console.error('❌ API key missing convai_read permission');
            console.log('💡 SOLUTION: Enable convai_read permission on your API key');
            console.log('   1. Go to: https://elevenlabs.io/app/settings/api-keys');
            console.log('   2. Find your API key');
            console.log('   3. Enable "Conversational AI Read" permission');
            console.log('   4. Update the key in Cloudflare Worker secret: ELEVENLABS_API_KEY');
            throw new Error('MISSING_PERMISSIONS: Enable convai_read on API key');
          } else {
            console.error('❌ Failed to fetch agent voice ID:', error.message);
            console.log('💡 Check:');
            console.log('   1. Agent ID is correct:', agentId);
            console.log('   2. API key has convai_read permission');
            console.log('   3. Agent exists in your ElevenLabs account');
            throw error;
          }
        }
      }
      
      // Use agent's voice ID (required - no fallback)
      if (agentVoiceIdCache) {
        finalVoiceId = agentVoiceIdCache;
        console.log('✅ Using agent voice ID:', finalVoiceId);
      } else {
        console.error('❌ Agent voice ID not found');
        throw new Error('Agent voice ID not available');
      }
    } else {
      console.error('❌ No agent ID configured');
      console.log('💡 Set agent ID in Cloudflare Worker secret: ELEVENLABS_AGENT_ID');
      throw new Error('Agent ID required');
    }
    
    // Final fallback
    if (!finalVoiceId) {
      finalVoiceId = 'pNInz6obpgDQGcFmaJgB';
      console.warn('⚠️ Using default fallback voice ID:', finalVoiceId);
    }
    
    console.log('🎯 FINAL VOICE ID BEING USED:', finalVoiceId);
    
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
    
    // Store audio globally so it can be stopped if needed
    if (typeof window !== 'undefined') {
      window.currentElevenLabsAudio = audio;
    }
    
    return new Promise((resolve) => {
      // Check if audio was stopped externally
      let wasStopped = false;
      
      const checkStopped = () => {
        if (typeof window !== 'undefined' && window.currentElevenLabsAudio !== audio) {
          wasStopped = true;
          URL.revokeObjectURL(audioUrl);
          resolve(false);
        }
      };
      
      audio.onended = () => {
        if (!wasStopped) {
          URL.revokeObjectURL(audioUrl);
          if (typeof window !== 'undefined' && window.currentElevenLabsAudio === audio) {
            window.currentElevenLabsAudio = null;
          }
          resolve(true);
        }
      };
      audio.onerror = (error) => {
        if (!wasStopped) {
          console.error('Audio error:', error);
          URL.revokeObjectURL(audioUrl);
          if (typeof window !== 'undefined' && window.currentElevenLabsAudio === audio) {
            window.currentElevenLabsAudio = null;
          }
          resolve(false);
        }
      };
      audio.onpause = () => {
        // If paused externally (not by user), it was stopped
        if (audio.currentTime === 0 && !wasStopped) {
          wasStopped = true;
          URL.revokeObjectURL(audioUrl);
          if (typeof window !== 'undefined' && window.currentElevenLabsAudio === audio) {
            window.currentElevenLabsAudio = null;
          }
          resolve(false);
        }
      };
      audio.play().catch(err => {
        if (!wasStopped) {
          console.error('Play error:', err);
          URL.revokeObjectURL(audioUrl);
          if (typeof window !== 'undefined' && window.currentElevenLabsAudio === audio) {
            window.currentElevenLabsAudio = null;
          }
          resolve(false);
        }
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

