/**
 * Local Voice File Management
 * Allows uploading and using local voice files instead of ElevenLabs API calls
 */

// IndexedDB for storing voice files
const DB_NAME = 'BadamoBlundersVoiceDB';
const DB_VERSION = 1;
const STORE_NAME = 'voiceFiles';

let voiceDB = null;

/**
 * Initialize IndexedDB for voice file storage
 */
async function initVoiceDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('Failed to open voice database');
      reject(request.error);
    };
    
    request.onsuccess = () => {
      voiceDB = request.result;
      console.log('✅ Voice database opened');
      resolve(voiceDB);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'hash' });
        objectStore.createIndex('hash', 'hash', { unique: true });
        console.log('✅ Voice database created');
      }
    };
  });
}

/**
 * Generate hash from text (simple hash function)
 */
function hashText(text) {
  let hash = 0;
  const normalizedText = text.trim().toLowerCase();
  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to positive hex string
  return Math.abs(hash).toString(16);
}

/**
 * Store a voice file in IndexedDB
 * @param {File|Blob} file - Audio file (MP3, WAV, etc.)
 * @param {string} hash - Hash of the commentary text
 */
async function storeVoiceFile(file, hash) {
  if (!voiceDB) {
    await initVoiceDB();
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const transaction = voiceDB.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const voiceData = {
        hash: hash,
        audioBlob: e.target.result,
        mimeType: file.type || 'audio/mpeg',
        timestamp: Date.now()
      };
      
      const request = store.put(voiceData);
      request.onsuccess = () => {
        console.log(`✅ Stored voice file for hash: ${hash}`);
        resolve();
      };
      request.onerror = () => {
        console.error('Failed to store voice file:', request.error);
        reject(request.error);
      };
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Get a voice file from IndexedDB
 * @param {string} hash - Hash of the commentary text
 * @returns {Promise<Blob|null>} Audio blob or null if not found
 */
async function getVoiceFile(hash) {
  if (!voiceDB) {
    await initVoiceDB();
  }
  
  return new Promise((resolve, reject) => {
    const transaction = voiceDB.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(hash);
    
    request.onsuccess = () => {
      if (request.result) {
        const blob = new Blob([request.result.audioBlob], { type: request.result.mimeType });
        console.log(`✅ Found local voice file for hash: ${hash}`);
        resolve(blob);
      } else {
        console.log(`⚠️ No local voice file found for hash: ${hash}`);
        resolve(null);
      }
    };
    
    request.onerror = () => {
      console.error('Failed to get voice file:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Play local voice file if available, otherwise return false
 * @param {string} text - Commentary text to play
 * @returns {Promise<boolean>} True if played, false if not found
 */
async function playLocalVoice(text) {
  if (!text || !text.trim()) return false;
  
  try {
    const hash = hashText(text);
    const audioBlob = await getVoiceFile(hash);
    
    if (!audioBlob) {
      return false;
    }
    
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Store audio globally so it can be stopped
    if (typeof window !== 'undefined') {
      window.currentLocalVoiceAudio = audio;
    }
    
    return new Promise((resolve) => {
      let wasStopped = false;
      
      const checkStopped = () => {
        if (typeof window !== 'undefined' && window.currentLocalVoiceAudio !== audio) {
          wasStopped = true;
          URL.revokeObjectURL(audioUrl);
          resolve(false);
        }
      };
      
      audio.onended = () => {
        if (!wasStopped) {
          URL.revokeObjectURL(audioUrl);
          if (typeof window !== 'undefined' && window.currentLocalVoiceAudio === audio) {
            window.currentLocalVoiceAudio = null;
          }
          resolve(true);
        }
      };
      
      audio.onerror = () => {
        console.error('Error playing local voice file');
        URL.revokeObjectURL(audioUrl);
        if (typeof window !== 'undefined' && window.currentLocalVoiceAudio === audio) {
          window.currentLocalVoiceAudio = null;
        }
        resolve(false);
      };
      
      // Check if stopped before starting
      setTimeout(() => {
        checkStopped();
        if (!wasStopped) {
          audio.play().catch(err => {
            console.error('Error playing audio:', err);
            URL.revokeObjectURL(audioUrl);
            resolve(false);
          });
        }
      }, 10);
    });
  } catch (error) {
    console.error('Error in playLocalVoice:', error);
    return false;
  }
}

/**
 * Get all stored voice file hashes (for management UI)
 */
async function getAllVoiceHashes() {
  if (!voiceDB) {
    await initVoiceDB();
  }
  
  return new Promise((resolve, reject) => {
    const transaction = voiceDB.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result.map(item => ({
        hash: item.hash,
        timestamp: item.timestamp,
        size: item.audioBlob.byteLength
      })));
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Delete a voice file by hash
 */
async function deleteVoiceFile(hash) {
  if (!voiceDB) {
    await initVoiceDB();
  }
  
  return new Promise((resolve, reject) => {
    const transaction = voiceDB.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(hash);
    
    request.onsuccess = () => {
      console.log(`✅ Deleted voice file for hash: ${hash}`);
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
  window.playLocalVoice = playLocalVoice;
  window.storeVoiceFile = storeVoiceFile;
  window.hashText = hashText;
  window.getAllVoiceHashes = getAllVoiceHashes;
  window.deleteVoiceFile = deleteVoiceFile;
}
