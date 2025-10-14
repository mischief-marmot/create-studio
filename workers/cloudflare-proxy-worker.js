/**
 * Cloudflare Worker to proxy API requests to create.studio
 * Deploy this to a worker route like api.create.studio/v1/*
 *
 * This allows create-api.mediavine.com to forward to api.create.studio
 * which then proxies to create.studio without redirects (fixing CORS)
 */

export default {
  async fetch(request, env, ctx) {
    // Get the URL from the request
    const url = new URL(request.url);

    // Build the target URL (replace worker domain with create.studio)
    const targetUrl = `https://create.studio${url.pathname}${url.search}`;

    // Clone the request but with the new URL
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    });

    // Fetch from the actual API
    const response = await fetch(modifiedRequest);

    // Clone the response so we can modify headers
    const modifiedResponse = new Response(response.body, response);

    // Add CORS headers (belt and suspenders approach)
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    modifiedResponse.headers.set('Access-Control-Max-Age', '86400');

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    return modifiedResponse;
  }
};
