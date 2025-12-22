// ElevenLabs Text-to-Speech with Conversational AI Agent support

// Cache for agent voice ID
let agentVoiceIdCache = null;

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
      console.log('Using ElevenLabs Agent:', agentId);
      
      // Fetch agent details to get its voice ID
      if (!agentVoiceIdCache) {
        try {
          const agentResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agent/${agentId}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'xi-api-key': apiKey
            }
          });
          
          if (agentResponse.ok) {
            const agentData = await agentResponse.json();
            // Try different possible locations for voice ID
            agentVoiceIdCache = agentData.voice_id || 
                               agentData.voice?.voice_id || 
                               agentData.voice_id ||
                               agentData.agent?.voice_id ||
                               agentData.config?.voice_id;
            
            if (agentVoiceIdCache) {
              console.log('✓ Found agent voice ID:', agentVoiceIdCache);
            } else {
              console.log('⚠ Agent voice ID not found in response, using configured voice');
              console.log('Agent data structure:', Object.keys(agentData));
            }
          } else {
            const errorText = await agentResponse.text();
            console.log('⚠ Could not fetch agent details:', agentResponse.status, errorText);
          }
        } catch (error) {
          console.log('⚠ Error fetching agent details:', error.message);
        }
      }
      
      finalVoiceId = agentVoiceIdCache || voiceId || 'pNInz6obpgDQGcFmaJgB';
      console.log('Speaking with Agent voice ID:', finalVoiceId);
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

// Make function globally available
window.speakWithElevenLabs = speakWithElevenLabs;

