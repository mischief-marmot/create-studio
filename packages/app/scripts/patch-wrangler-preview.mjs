#!/usr/bin/env node
/**
 * Patches the generated .output/server/wrangler.json with preview environment settings.
 * This is needed because CF Worker Builds auto-deploys using this file,
 * ignoring our wrangler.jsonc and deploy commands.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const wranglerPath = join(process.cwd(), '.output/server/wrangler.json');

// Preview environment configuration
const previewConfig = {
  name: 'create-studio-preview',
  d1_databases: [
    {
      binding: 'DB',
      database_id: 'd0f371df-bcba-4017-a34d-2987d3d408aa',
      migrations_table: '_hub_migrations',
      migrations_dir: '.output/server/db/migrations/'
    }
  ],
  r2_buckets: [
    {
      binding: 'BLOB',
      bucket_name: 'create-studio-preview'
    }
  ],
  kv_namespaces: [
    {
      binding: 'CACHE',
      id: '0224961fc68b48e7bb65cab509fe6c83'
    },
    {
      binding: 'KV',
      id: '9db8b6ec8e6640808667c975f906e232'
    }
  ]
};

try {
  const wrangler = JSON.parse(readFileSync(wranglerPath, 'utf-8'));

  // Patch with preview config
  Object.assign(wrangler, previewConfig);

  writeFileSync(wranglerPath, JSON.stringify(wrangler, null, 2));
  console.log('✅ Patched wrangler.json with preview environment settings');
} catch (error) {
  console.error('❌ Failed to patch wrangler.json:', error.message);
  process.exit(1);
}
