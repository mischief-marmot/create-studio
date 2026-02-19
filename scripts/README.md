# Scripts

## Webhook Key Generation

### generate-webhook-keys.js

Generates RS256 key pairs for webhook signing.

**Usage:**
```bash
npm run generate:webhook-keys
```

**What it does:**
1. Generates a 2048-bit RSA key pair
2. Saves `webhook-private.pem` (private key - keep secret!)
3. Saves `webhook-public.pem` (public key - shared with WordPress)

**Setup:**
1. Run the script to generate keys
2. Copy the contents of both .pem files
3. Add to your `.env` file:
   ```env
   NUXT_WEBHOOK_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
   ...your private key content...
   -----END PRIVATE KEY-----"

   NUXT_PUBLIC_WEBHOOK_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
   ...your public key content...
   -----END PUBLIC KEY-----"
   ```

**Security Notes:**
- The private key MUST remain secret - never commit it or share it
- The public key is safe to share and is served at `/api/v2/webhooks/public-key`
- Both `.pem` files are gitignored automatically
- Generate new keys for each environment (development, staging, production)

**How it works:**
- Studio signs webhooks with the **private key** using RS256
- WordPress verifies signatures using the **public key**
- This ensures webhooks are authentic and haven't been tampered with
