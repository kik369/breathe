// functions/src/index.ts

export interface Env {
  LEMONSQUEEZY_API_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://breathcontrol.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function handleOptions(request: Request) {
  // Make sure the necessary headers are present
  // for this to be a valid pre-flight request
  let headers = request.headers;
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS pre-flight request.
    // If you want to check the requested method + headers
    // you can do that here.
    let respHeaders = {
      ...corsHeaders,
      'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers')!,
      'Access-Control-Max-Age': '86400',
    };
    return new Response(null, {
      headers: respHeaders,
    });
  } else {
    // Handle standard OPTIONS request.
    // If you want to allow other HTTP Methods, you can add them here
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

      let response = new Response(responseBody, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });

      return response;

    } catch (error: any) {
      console.error('Error:', error.message);
      const errorResponse = { error: 'Failed to create checkout session.' };
      
      let response = new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
      
      return response;
    }
  },
};
