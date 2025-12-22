#!/usr/bin/env node

/**
 * Lichess Game Analyzer - Installation Script (Node.js version)
 * Generates icons and verifies extension setup
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const ICONS_DIR = path.join(SCRIPT_DIR, 'icons');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateIcons() {
  try {
    // Try to use canvas if available
    const { createCanvas } = require('canvas');
    
    log('🎨 Generating extension icons using canvas...', 'cyan');
    
    if (!fs.existsSync(ICONS_DIR)) {
      fs.mkdirSync(ICONS_DIR, { recursive: true });
    }
    
    [16, 48, 128].forEach(size => {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Draw chess board pattern
      const squareSize = size / 8;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863';
          ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
        }
      }
      
      // Draw "LA" text
      ctx.fillStyle = '#333';
      ctx.font = `bold ${Math.floor(size * 0.4)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LA', size / 2, size / 2);
      
      const buffer = canvas.toBuffer('image/png');
      const iconPath = path.join(ICONS_DIR, `icon${size}.png`);
      fs.writeFileSync(iconPath, buffer);
      log(`  ✓ Generated icon${size}.png`, 'green');
    });
    
    return true;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      log('⚠ Canvas module not available', 'yellow');
      log('  Install it with: npm install canvas', 'yellow');
      return false;
    }
    throw error;
  }
}

function generateSimpleIcons() {
  // Generate simple colored square icons as fallback
  log('🎨 Generating simple placeholder icons...', 'cyan');
  
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
  }
  
  // Create a simple SVG-based approach or use a basic method
  // For now, we'll create a note that icons need to be generated
  const readmePath = path.join(ICONS_DIR, 'README.txt');
  fs.writeFileSync(readmePath, 
    'Icons need to be generated.\n' +
    'Open create-icons.html in your browser to generate them.\n' +
    'Or create PNG files: icon16.png, icon48.png, icon128.png\n'
  );
  
  log('  ⚠ Icons not generated. Please use create-icons.html', 'yellow');
  return false;
}

function verifyFiles() {
  log('\n🔍 Verifying extension files...', 'cyan');
  
  const requiredFiles = [
    'manifest.json',
    'content.js',
    'background.js',
    'analysis.html',
    'analysis.js',
    'analysis.css',
    'popup.html',
    'popup.js'
  ];
  
  let allPresent = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(SCRIPT_DIR, file);
    if (fs.existsSync(filePath)) {
      log(`  ✓ ${file}`, 'green');
    } else {
      log(`  ✗ ${file} (MISSING)`, 'red');
      allPresent = false;
    }
  });
  
  return allPresent;
}

function getInstallInstructions() {
  const os = process.platform;
  let instructions = '';
  
  if (os === 'darwin') {
    instructions = `
📱 macOS Installation:
1. Open Google Chrome
2. Navigate to: chrome://extensions/
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select this folder: ${SCRIPT_DIR}
`;
  } else if (os === 'linux') {
    instructions = `
📱 Linux Installation:
1. Open Google Chrome
2. Navigate to: chrome://extensions/
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select this folder: ${SCRIPT_DIR}
`;
  } else if (os === 'win32') {
    instructions = `
📱 Windows Installation:
1. Open Google Chrome
2. Navigate to: chrome://extensions/
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select this folder: ${SCRIPT_DIR}
`;
  } else {
    instructions = `
📱 Installation:
1. Open Google Chrome
2. Navigate to: chrome://extensions/
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select this folder: ${SCRIPT_DIR}
`;
  }
  
  return instructions;
}

function main() {
  log('\n🎯 Lichess Game Analyzer - Installation Script', 'cyan');
  log('================================================\n', 'cyan');
  
  log(`📁 Working directory: ${SCRIPT_DIR}\n`, 'cyan');
  
  // Check/generate icons
  const iconsExist = fs.existsSync(path.join(ICONS_DIR, 'icon16.png')) &&
                     fs.existsSync(path.join(ICONS_DIR, 'icon48.png')) &&
                     fs.existsSync(path.join(ICONS_DIR, 'icon128.png'));
  
  if (!iconsExist) {
    if (!generateIcons()) {
      generateSimpleIcons();
    }
  } else {
    log('✓ Icons already exist', 'green');
  }
  
  // Verify files
  const filesOk = verifyFiles();
  
  if (!filesOk) {
    log('\n❌ Error: Missing required files!', 'red');
    process.exit(1);
  }
  
  log('\n✅ All files verified!', 'green');
  
  // Show installation instructions
  log(getInstallInstructions(), 'cyan');
  
  log('\n🎮 Usage:', 'cyan');
  log('1. Play a game on lichess.org');
  log('2. When the game finishes, a new tab will automatically open with analysis');
  log('3. Or click the extension icon and click "Analyze Current Game"');
  
  log('\n✨ Installation script complete!\n', 'green');
}

// Run the script
main();

