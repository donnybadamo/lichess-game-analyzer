// Build script for Cloudflare Pages
// This script prepares web app files for Cloudflare Pages deployment

const fs = require('fs');
const path = require('path');

const outputDir = './cloudflare-dist';

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Copy web app files that don't need changes
const filesToCopy = [
  'index.html',               // Web app entry point
  'analysis-web.js',          // Web version (uses localStorage, not chrome.storage)
  'analysis.css',
  'elevenlabs-tts-web.js',    // Web version of ElevenLabs TTS
  'cloudflare-secrets-web.js' // Secrets helper for web app
];

filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(outputDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file}`);
  }
});

// Copy libs directory
const libsSrc = path.join(__dirname, 'libs');
const libsDest = path.join(outputDir, 'libs');
if (fs.existsSync(libsSrc)) {
  function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  copyRecursive(libsSrc, libsDest);
  console.log('✓ Copied libs/ directory');
}

// Copy icons directory (optional)
const iconsSrc = path.join(__dirname, 'icons');
const iconsDest = path.join(outputDir, 'icons');
if (fs.existsSync(iconsSrc)) {
  function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  copyRecursive(iconsSrc, iconsDest);
  console.log('✓ Copied icons/ directory');
}

console.log('\n✅ Build complete! Output in:', outputDir);
console.log('\nDeploy the contents of cloudflare-dist/ to Cloudflare Pages');

