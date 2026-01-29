#!/usr/bin/env node
/**
 * Generate RS256 key pair for webhook signing.
 *
 * This script generates:
 * - webhook-private.pem (private key - keep secret, server-side only)
 * - webhook-public.pem (public key - shared with WordPress for verification)
 *
 * Usage:
 *   node scripts/generate-webhook-keys.js
 *   npm run generate:webhook-keys
 */

import { generateKeyPair } from 'crypto';
import { writeFileSync } from 'fs';
import { join } from 'path';

const outputDir = process.cwd();
const privateKeyPath = join(outputDir, 'webhook-private.pem');
const publicKeyPath = join(outputDir, 'webhook-public.pem');

console.log('Generating RS256 key pair for webhook signing...\n');

generateKeyPair('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
}, (err, publicKey, privateKey) => {
  if (err) {
    console.error('Error generating keys:', err);
    process.exit(1);
  }

  // Write keys to files
  writeFileSync(privateKeyPath, privateKey);
  writeFileSync(publicKeyPath, publicKey);

  console.log('✓ Keys generated successfully!\n');
  console.log(`Private key: ${privateKeyPath}`);
  console.log(`Public key:  ${publicKeyPath}\n`);
  console.log('Next steps:');
  console.log('1. Add the keys to your .env file:');
  console.log('   NUXT_WEBHOOK_PRIVATE_KEY="<paste contents of webhook-private.pem>"');
  console.log('   NUXT_PUBLIC_WEBHOOK_PUBLIC_KEY="<paste contents of webhook-public.pem>"\n');
  console.log('2. NEVER commit the .pem files or share the private key');
  console.log('3. The public key will be served at /api/v2/webhooks/public-key for WordPress\n');
  console.log('Note: For multi-line PEM keys in .env, you can use escaped newlines (\\n)');
  console.log('or use the literal file contents as shown above.\n');
});
