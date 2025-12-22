#!/usr/bin/env node
// Setup script to load .env values into Chrome extension storage
// Run this once after adding your API key to .env

const fs = require('fs');
const path = require('path');

// Simple .env parser
function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('Please create .env file with:');
  console.log('  ELEVENLABS_API_KEY=your_key');
  console.log('  ELEVENLABS_AGENT_ID=your_agent_id');
  process.exit(1);
}

const env = parseEnv(envPath);

if (!env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY === 'your_api_key_here') {
  console.error('❌ ELEVENLABS_API_KEY not set in .env file!');
  process.exit(1);
}

console.log('📝 Found ElevenLabs credentials in .env');
console.log('   API Key:', env.ELEVENLABS_API_KEY.substring(0, 10) + '...');
console.log('   Agent ID:', env.ELEVENLABS_AGENT_ID || 'Not set (will use voice)');
console.log('');
console.log('⚠️  Chrome extensions cannot directly read .env files.');
console.log('   You need to manually set these in Chrome storage:');
console.log('');
console.log('1. Open your extension\'s analysis page');
console.log('2. Press F12 to open DevTools');
console.log('3. Go to Console tab');
console.log('4. Run this command:');
console.log('');
console.log('chrome.storage.local.set({');
console.log(`  elevenlabsApiKey: '${env.ELEVENLABS_API_KEY}',`);
if (env.ELEVENLABS_AGENT_ID && env.ELEVENLABS_AGENT_ID !== 'your_agent_id_here') {
  console.log(`  elevenlabsAgentId: '${env.ELEVENLABS_AGENT_ID}',`);
}
if (env.ELEVENLABS_VOICE_ID && env.ELEVENLABS_VOICE_ID !== 'pNInz6obpgDQGcFmaJgB') {
  console.log(`  elevenlabsVoiceId: '${env.ELEVENLABS_VOICE_ID}',`);
}
console.log('}, () => console.log("✓ ElevenLabs credentials saved!"));');
console.log('');

