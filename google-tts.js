// Google Cloud Text-to-Speech integration
// Requires API key in extension storage

let googleTTSApiKey = null;
let useGoogleTTS = false;

// Initialize Google TTS
async function initGoogleTTS() {
  try {
    // Get API key from storage
    const result = await chrome.storage.local.get(['googleTTSApiKey']);
    if (result.googleTTSApiKey) {
      googleTTSApiKey = result.googleTTSApiKey;
      useGoogleTTS = true;
      console.log('Google TTS initialized with API key');
      return true;
    } else {
      console.log('Google TTS API key not found, using Web Speech API');
      return false;
    }
  } catch (e) {
    console.error('Error initializing Google TTS:', e);
    return false;
  }
}

// Speak using Google Cloud TTS with masculine voice
async function speakWithGoogleTTS(text) {
  if (!useGoogleTTS || !googleTTSApiKey) {
    return false; // Fallback to Web Speech API
  }
  
  try {
    // Use Google Cloud TTS API
    // Voice options: en-US-Standard-D (masculine), en-US-Wavenet-D (premium masculine)
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTTSApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Wavenet-D', // Masculine, natural-sounding voice
            ssmlGender: 'MALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0.0, // Natural pitch
            volumeGainDb: 0.0
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Google TTS API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Play the audio
    const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
    audio.play();
    
    return true;
  } catch (error) {
    console.error('Google TTS error:', error);
    return false; // Fallback to Web Speech API
  }
}

// Set API key (can be called from popup/settings)
function setGoogleTTSApiKey(apiKey) {
  chrome.storage.local.set({ googleTTSApiKey: apiKey }, () => {
    googleTTSApiKey = apiKey;
    useGoogleTTS = true;
    console.log('Google TTS API key saved');
  });
}

