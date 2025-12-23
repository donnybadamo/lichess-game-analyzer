/**
 * Test Cloudflare Worker Script
 * Run this in browser console to diagnose 405 errors
 */

async function testCloudflareWorker(workerUrl) {
  console.log('🧪 Testing Cloudflare Worker:', workerUrl);
  console.log('---');
  
  // Test 1: Health check (GET)
  console.log('Test 1: Health check (GET)');
  try {
    const healthResponse = await fetch(`${workerUrl}/health`, {
      method: 'GET'
    });
    console.log('  Status:', healthResponse.status);
    console.log('  Response:', await healthResponse.text());
  } catch (error) {
    console.error('  ❌ Error:', error.message);
  }
  console.log('');
  
  // Test 2: POST to /get-secret (correct)
  console.log('Test 2: POST to /get-secret (correct method)');
  try {
    const postResponse = await fetch(`${workerUrl}/get-secret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretName: 'ELEVENLABS_API_KEY' })
    });
    console.log('  Status:', postResponse.status);
    const text = await postResponse.text();
    console.log('  Response:', text);
    
    if (postResponse.status === 405) {
      console.error('  ❌ 405 Error! Worker is rejecting POST requests');
      console.log('  💡 Possible causes:');
      console.log('     1. Worker not deployed correctly');
      console.log('     2. Worker code has wrong export format');
      console.log('     3. Route handler is missing');
    } else if (postResponse.ok) {
      console.log('  ✅ Success! Worker is working correctly');
    }
  } catch (error) {
    console.error('  ❌ Error:', error.message);
  }
  console.log('');
  
  // Test 3: GET to /get-secret (wrong method - should return 405)
  console.log('Test 3: GET to /get-secret (wrong method - should return 405)');
  try {
    const getResponse = await fetch(`${workerUrl}/get-secret`, {
      method: 'GET'
    });
    console.log('  Status:', getResponse.status);
    console.log('  Response:', await getResponse.text());
    if (getResponse.status === 405) {
      console.log('  ✅ Correctly rejecting GET requests');
    }
  } catch (error) {
    console.error('  ❌ Error:', error.message);
  }
  console.log('');
  
  // Test 4: Check CORS
  console.log('Test 4: CORS preflight (OPTIONS)');
  try {
    const optionsResponse = await fetch(`${workerUrl}/get-secret`, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('  Status:', optionsResponse.status);
    console.log('  CORS Headers:');
    console.log('    Allow-Origin:', optionsResponse.headers.get('Access-Control-Allow-Origin'));
    console.log('    Allow-Methods:', optionsResponse.headers.get('Access-Control-Allow-Methods'));
    console.log('    Allow-Headers:', optionsResponse.headers.get('Access-Control-Allow-Headers'));
  } catch (error) {
    console.error('  ❌ Error:', error.message);
  }
  console.log('');
  
  console.log('✅ Testing complete!');
}

// Usage:
// 1. Get your Worker URL from Chrome storage:
chrome.storage.local.get(['cloudflareWorkerUrl'], (result) => {
  if (result.cloudflareWorkerUrl) {
    console.log('Found Worker URL:', result.cloudflareWorkerUrl);
    testCloudflareWorker(result.cloudflareWorkerUrl);
  } else {
    console.error('❌ No Worker URL found in Chrome storage');
    console.log('💡 Set it first:');
    console.log('   chrome.storage.local.set({ cloudflareWorkerUrl: "https://your-worker.workers.dev" })');
  }
});

// Or test directly:
// testCloudflareWorker('https://your-worker.workers.dev');

