// functions/src/index.ts
import { createClient } from '@supabase/supabase-js';

export interface Env {
  LEMONSQUEEZY_API_KEY: string;
  LEMONSQUEEZY_STORE_ID: string;
  LEMONSQUEEZY_VARIANT_ID: string;
  LEMONSQUEEZY_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

const corsHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': 'https://breathcontrol.app',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response('OK', { headers: corsHeaders });
    }
    
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Route for creating a checkout session
    if (url.pathname === '/create-checkout') {
      return handleCreateCheckout(request, env, supabase);
    }

    // Route for handling Lemon Squeezy webhooks
    if (url.pathname === '/webhook') {
      return handleWebhook(request, env, supabase);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleCreateCheckout(request: Request, env: Env, supabase: any): Promise<Response> {
    // ... (The logic from the previous `handleCreateCheckout` function, with added user auth)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response('Missing or invalid Authorization header', { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return new Response('Invalid token', { status: 401 });
    }

    // Now, create the checkout, passing the user's ID
    const lemonSqueezyResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${env.LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              custom: {
                user_id: user.id, // Pass the Supabase user ID here
              },
            },
          },
          relationships: {
            store: { data: { type: 'stores', id: env.LEMONSQUEEZY_STORE_ID } },
            variant: { data: { type: 'variants', id: env.LEMONSQUEEZY_VARIANT_ID } },
          },
        },
      }),
    });
    
    // ... (rest of the checkout logic from previous step)
    const responseJson: any = await lemonSqueezyResponse.json();
    const checkoutUrl = responseJson.data.attributes.url;
    return new Response(JSON.stringify({ checkout_url: checkoutUrl }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders }});
}

async function handleWebhook(request: Request, env: Env, supabase: any): Promise<Response> {
    // ... (Logic to verify and handle the webhook)
    const secret = env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const signature = request.headers.get('X-Signature');
    const rawBody = await request.text();

    // Verification logic here (this is simplified, a proper implementation should use crypto)
    // For production, you MUST properly verify the signature using crypto.
    // This is a placeholder for the logic.

    const data = JSON.parse(rawBody);

    if (data.meta.event_name === 'order_created') {
        const userId = data.data.attributes.custom_data.user_id;
        
        if (userId) {
            const { error } = await supabase
                .from('profiles')
                .update({ is_premium: true })
                .eq('id', userId);

            if (error) {
                console.error('Error updating user profile:', error);
                return new Response('Error updating user status', { status: 500 });
            }
        }
    }

    return new Response('Webhook received', { status: 200 });
}