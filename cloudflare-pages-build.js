// Build script for Cloudflare Pages
// This script updates chrome.runtime.getURL() to use relative paths for Cloudflare

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'load-libs.js',
  'init.js',
  'analysis.js'
];

const outputDir = './cloudflare-dist';

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Copy files that don't need changes
const filesToCopy = [
  'analysis.html',
  'analysis.css',
  'elevenlabs-tts.js',
  'azure-keyvault.js',
  'init.js'  // Needed for loading libraries
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
  // Copy recursively
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

// Update files that use chrome.runtime.getURL()
filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace chrome.runtime.getURL() with relative paths
  content = content.replace(
    /chrome\.runtime\.getURL\(['"]([^'"]+)['"]\)/g,
    (match, url) => {
      // Remove leading slash if present
      const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
      return `'${cleanUrl}'`;
    }
  );
  
  // Write updated file
  const destPath = path.join(outputDir, file);
  fs.writeFileSync(destPath, content, 'utf-8');
  console.log(`✓ Updated ${file}`);
});

console.log('\n✅ Build complete! Output in:', outputDir);
console.log('\nDeploy the contents of cloudflare-dist/ to Cloudflare Pages');

