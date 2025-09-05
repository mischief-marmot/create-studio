#!/usr/bin/env node

import { watchFile } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const embedPath = join(projectRoot, 'public/embed.js');

console.log('👀 Watching embed.js for changes...');
console.log(`📂 Watching: ${embedPath}`);

// Build initially
runBuild();

// Watch for changes
watchFile(embedPath, (curr, prev) => {
  console.log('\n🔄 embed.js changed, rebuilding...');
  runBuild();
});

function runBuild() {
  const child = spawn('npm', ['run', 'build:embed'], {
    stdio: 'inherit',
    shell: true,
  });
  
  child.on('error', (error) => {
    console.error('❌ Build error:', error);
  });
}