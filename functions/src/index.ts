// functions/src/index.ts

export interface Env {
  LEMONSQUEEZY_API_KEY: string;
}

// Define the CORS headers that your worker will use
const corsHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': 'https://breathcontrol.app', // IMPORTANT: Changed from '*'
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle the browser's preflight request.
    // This is sent before the actual POST request to check for permissions.
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      });
    }

    // We only want to handle POST requests for the actual logic
    if (request.method !== 'POST') {
      return new Response('Please use a POST request.', {
        status: 405,
        headers: corsHeaders, // Include CORS headers on error responses too
      });
    }

    try {
      const apiKey = env.LEMONSQUEEZY_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found.');
      }

      console.log('Successfully accessed API Key (placeholder).');
      const mockCheckoutUrl = 'https://lemonsqueezy.com/checkout/buy/mock-checkout-id-for-testing';
      
      const responseBody = JSON.stringify({
        checkout_url: mockCheckoutUrl,
      });

      // Send the successful response with the correct headers
      return new Response(responseBody, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });

    } catch (error: any) {
      console.error('Error:', error.message);
      return new Response(JSON.stringify({ error: 'Failed to create checkout session.' }), {
        status: 500,
        headers: corsHeaders, // Also include CORS headers here
      });
    }
  },
};