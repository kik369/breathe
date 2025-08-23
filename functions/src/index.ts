// functions/src/index.ts

export interface Env {
  LEMONSQUEEZY_API_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://breathcontrol.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function handleOptions(request: Request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, {
      headers: corsHeaders,
    });
  } else {
    return new Response(null, {
      headers: {
        Allow: 'POST, OPTIONS',
      },
    });
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: {
          'Allow': 'POST, OPTIONS',
        }
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

      return new Response(responseBody, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });

    } catch (error: any) {
      console.error('Error:', error.message);
      const errorResponse = { error: 'Failed to create checkout session.' };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  },
};