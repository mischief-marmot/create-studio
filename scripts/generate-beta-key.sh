#!/bin/bash
# Generate a beta upload API key, store it in Wrangler, and copy to clipboard

KEY=$(openssl rand -hex 32)

echo "Generated BETA_UPLOAD_API_KEY: $KEY"
echo ""

# Copy to clipboard
echo -n "$KEY" | pbcopy
echo "Copied to clipboard — paste it into GitHub repo secrets as BETA_UPLOAD_API_KEY"
echo ""

# Upload to Wrangler
echo "Uploading to Wrangler..."
echo "$KEY" | npx wrangler secret put NUXT_BETA_UPLOAD_API_KEY --config packages/app/wrangler.jsonc
