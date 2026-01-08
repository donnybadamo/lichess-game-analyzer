/**
 * ElevenLabs Text-to-Speech Integration (Web Version)
 * Uses localStorage instead of chrome.storage
 */

let agentVoiceIdCache = null;

async function fetchAgentVoiceId(apiKey, agentId) {
  if (agentVoiceIdCache) {
    return agentVoiceIdCache;
  }
  
  const endpoints = [
    `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
    `https://api.elevenlabs.io/v1/convai/agent/${agentId}`,
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'xi-api-key': apiKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const voiceId = data.voice_id || data.voiceId || data.voice?.voice_id;
        if (voiceId) {
          agentVoiceIdCache = voiceId;
          localStorage.setItem('elevenlabsVoiceId', voiceId);
          console.log('✅ Fetched agent voice ID:', voiceId);
          return voiceId;
        }
      }
    } catch (error) {
      console.log(`Trying next endpoint for agent ${agentId}...`);
    }
  }
  
  return null;
}

async function speakWithElevenLabs(text) {
  try {
    // Get credentials from localStorage (web version)
    const apiKey = localStorage.getItem('elevenlabsApiKey');
    const agentId = localStorage.getItem('elevenlabsAgentId');
    let voiceId = localStorage.getItem('elevenlabsVoiceId');
    
    if (!apiKey) {
      console.error('❌ ElevenLabs API key not set!');
      return false;
    }
    
    // Fetch voice ID from agent if we have agentId
    if (agentId && !voiceId) {
      voiceId = await fetchAgentVoiceId(apiKey, agentId);
    }
    
    // Use voice ID directly if set
    if (!voiceId) {
      console.warn('⚠️ No voice ID available');
      return false;
    }
    
    const finalVoiceId = voiceId;
    
    // Use ElevenLabs TTS endpoint
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
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
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
    
    // Store audio globally so it can be stopped
    window.currentElevenLabsAudio = audio;
    
    await new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (window.currentElevenLabsAudio === audio) {
          window.currentElevenLabsAudio = null;
        }
        resolve();
      };
      
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        if (window.currentElevenLabsAudio === audio) {
          window.currentElevenLabsAudio = null;
        }
        reject(e);
      };
      
      audio.play().catch(reject);
    });
    
    return true;
    
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    return false;
  }
}

// Export globally
window.speakWithElevenLabs = speakWithElevenLabs;


