// functions/src/index.ts

export interface Env {
  LEMONSQUEEZY_API_KEY: string;
  LEMONSQUEEZY_STORE_ID: string;
  LEMONSQUEEZY_VARIANT_ID: string;
}

const corsHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': 'https://breathcontrol.app',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response('OK', { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const apiKey = env.LEMONSQUEEZY_API_KEY;
      const storeId = env.LEMONSQUEEZY_STORE_ID;
      const variantId = env.LEMONSQUEEZY_VARIANT_ID;

      if (!apiKey || !storeId || !variantId) {
        throw new Error('API key, Store ID, or Variant ID not found.');
      }

      // API call to Lemon Squeezy
      const lemonSqueezyResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          data: {
            type: 'checkouts',
            attributes: {
              checkout_options: {
                embed: false, // Use a hosted checkout page
              },
              checkout_data: {
                // custom: { user_id: '123' } // Future: You can pass custom data here if you have user accounts
              },
            },
            relationships: {
              store: {
                data: {
                  type: 'stores',
                  id: storeId,
                },
              },
              variant: {
                data: {
                  type: 'variants',
                  id: variantId,
                },
              },
            },
          },
        }),
      });

      if (!lemonSqueezyResponse.ok) {
        const errorBody = await lemonSqueezyResponse.text();
        console.error('Lemon Squeezy API Error:', errorBody);
        throw new Error(`Lemon Squeezy API responded with status: ${lemonSqueezyResponse.status}`);
      }

      const responseJson: any = await lemonSqueezyResponse.json();
      const checkoutUrl = responseJson.data.attributes.url;

      if (!checkoutUrl) {
        throw new Error('Checkout URL not found in Lemon Squeezy response.');
      }
      
      const responseBody = JSON.stringify({ checkout_url: checkoutUrl });

      return new Response(responseBody, {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (error: any) {
      console.error('Error:', error.message);
      const errorResponse = { error: 'Failed to create checkout session.' };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};