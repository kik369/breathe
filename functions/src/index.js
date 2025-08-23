// functions/src/index.js

export default {
  async fetch(request, env, ctx) {
    // CORS headers to allow requests from your web app
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*', // In production, restrict this to your actual domain
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // Handle preflight CORS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    
    // Check if it's a POST request
    if (request.method !== 'POST') {
        return new Response('Please use a POST request.', { status: 405, headers });
    }

    try {
      // Securely access the secret API key
      const apiKey = env.LEMONSQUEEZY_API_KEY;

      if (!apiKey) {
        throw new Error('API key not found.');
      }

      // --- Placeholder Logic ---
      // In the future, this is where you would make a `fetch` request
      // to the real Lemon Squeezy API using the `apiKey`.
      // For now, we will just simulate a successful response.

      console.log('Successfully accessed API Key (placeholder).');

      const mockCheckoutUrl = 'https://lemonsqueezy.com/checkout/buy/mock-checkout-id-for-testing';

      const responseBody = JSON.stringify({
        checkout_url: mockCheckoutUrl,
      });

      return new Response(responseBody, {
        status: 200,
        headers: { ...headers.entries(), 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Error:', error.message);
      return new Response(JSON.stringify({ error: 'Failed to create checkout session.' }), {
        status: 500,
        headers,
      });
    }
  },
};
