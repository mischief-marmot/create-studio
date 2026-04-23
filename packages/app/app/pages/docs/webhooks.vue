<script lang="ts" setup>
useHead({
  title: 'Webhooks — Create Studio Docs',
  meta: [
    {
      name: 'description',
      content: 'Create Studio sends signed webhooks to the Create WordPress plugin. This page documents the request signature, User-Agent, and how to allowlist Studio traffic in Cloudflare or another WAF.',
    },
  ],
})
</script>

<template>
  <NuxtLayout name="main">
    <div class="bg-base-100 min-h-screen">
      <!-- Header -->
      <div class="bg-base-200 sm:py-16 py-12">
        <div class="sm:px-6 lg:px-8 max-w-3xl px-4 mx-auto">
          <p class="text-base-content/70 mb-2 text-sm font-medium tracking-wider uppercase">
            Docs
          </p>
          <h1 class="sm:text-5xl text-base-content mb-4 text-4xl font-bold">
            Webhooks
          </h1>
          <p class="text-base-content/80 text-xl">
            How Create Studio talks to your WordPress site — and how to allowlist it.
          </p>
        </div>
      </div>

      <!-- Content -->
      <div class="sm:px-6 lg:px-8 sm:py-16 max-w-3xl px-4 py-12 mx-auto">
        <div class="prose-zinc max-w-none prose prose-lg">
          <h2>Overview</h2>
          <p>
            Create Studio sends <strong>signed HTTPS webhooks</strong> to the Create WordPress
            plugin on your site. Webhooks power features like the site debug viewer, subscription
            sync, broadcast delivery, and plugin setting updates. Every request is signed with an
            RS256 key Studio controls and verified by the plugin before it does any work.
          </p>

          <h2>Request details</h2>
          <ul>
            <li><strong>Method:</strong> <code>POST</code></li>
            <li>
              <strong>Path:</strong> <code>/wp-json/mv-create/v1/webhooks/studio</code> on your
              site's origin
            </li>
            <li><strong>Content-Type:</strong> <code>application/json</code></li>
            <li>
              <strong>User-Agent:</strong>
              <code>Create-Studio-Webhook/1.0 (+https://create.studio/docs/webhooks)</code>
            </li>
            <li>
              <strong>X-Studio-Signature:</strong> base64-encoded RS256 signature of the raw JSON
              body
            </li>
            <li>
              <strong>X-Studio-Timestamp:</strong> Unix timestamp in seconds; requests older than
              five minutes are rejected
            </li>
            <li><strong>Timeout:</strong> 10 seconds per attempt</li>
          </ul>

          <h2>Source IPs</h2>
          <p>
            Studio runs on <strong>Cloudflare Workers</strong>, so outbound webhook traffic
            originates from Cloudflare's Workers egress ranges (including
            <code>2a06:98c0::/29</code> for IPv6 and Cloudflare's published IPv4 ranges). These
            are shared with other Workers customers, so we recommend allowlisting by
            <em>User-Agent + path</em> rather than by IP.
          </p>

          <h2>Allowlisting in Cloudflare</h2>
          <p>
            If your site is behind Cloudflare and webhooks are failing with <code>403</code>, a
            WAF or Bot Fight Mode rule is probably blocking us. To fix it:
          </p>
          <ol>
            <li>
              Open your Cloudflare dashboard → <strong>Security → Events</strong> and look up the
              Ray ID from the failure (it appears in Studio's webhook retry logs). The rule that
              fired is shown in the event detail.
            </li>
            <li>
              Go to <strong>Security → WAF → Custom Rules</strong> and add a <em>Skip</em> rule:
              <ul>
                <li>
                  <strong>If:</strong> <code>http.request.uri.path contains
                  "/wp-json/mv-create/v1/webhooks/studio"</code>
                  <em>and</em> <code>http.user_agent contains
                  "Create-Studio-Webhook"</code>
                </li>
                <li>
                  <strong>Then:</strong> Skip — all remaining custom rules, all Managed rules,
                  all rate-limiting rules, and Super Bot Fight Mode.
                </li>
              </ul>
            </li>
            <li>
              If you use <strong>Super Bot Fight Mode</strong> with
              "Block definitely automated" enabled, the skip rule above is what turns it off for
              this one path. Do <em>not</em> disable bot protection globally.
            </li>
          </ol>

          <h2>Allowlisting in other WAFs</h2>
          <p>
            Sucuri, Wordfence, SiteGround, and most host firewalls support the same pattern:
            allow <code>POST</code> to <code>/wp-json/mv-create/v1/webhooks/studio</code> when
            the User-Agent contains <code>Create-Studio-Webhook</code>. The request is still
            validated by the plugin's signature check, so allowlisting at the edge does not
            weaken security.
          </p>

          <h2>Security model</h2>
          <p>
            The plugin verifies each request by:
          </p>
          <ul>
            <li>Checking the timestamp is within the last five minutes (replay protection).</li>
            <li>
              Verifying the <code>X-Studio-Signature</code> header against the raw body using
              Studio's public RS256 key, which is pinned in the plugin.
            </li>
          </ul>
          <p>
            Anything that fails either check is rejected with a <code>401</code>. Allowlisting at
            the WAF only changes who <em>reaches</em> the endpoint; only Studio can produce a
            valid signature.
          </p>

          <h2>Retry schedule</h2>
          <p>
            Studio retries failed webhooks with exponential backoff: 1&nbsp;min, 5&nbsp;min,
            30&nbsp;min, 2&nbsp;hr, 6&nbsp;hr, 12&nbsp;hr, then every 24&nbsp;hr up to eight
            attempts before dead-lettering. A 403 from your firewall will burn through retries
            silently, so we recommend allowlisting before turning the plugin on in production.
          </p>

          <div class="mt-16">
            <NuxtLink
              to="/"
              class="text-base-content border-base-300 hover:bg-base-200 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors border rounded-lg shadow-sm no-underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                class="size-4"
              >
                <path
                  fill-rule="evenodd"
                  d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"
                  clip-rule="evenodd"
                />
              </svg>
              Back to Home
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
