// ==============================================================================
// Supabase Edge Function: send-route-notification
// Dispatches Firebase Cloud Messaging (FCM) push notifications to all users
// registered on a specific route when a bus reports Breakdown, Full, or 5-min ETA.
// ==============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface RequestBody {
  route_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

serve(async (req: Request) => {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { route_id, title, body, data }: RequestBody = await req.json();

    if (!route_id || !title || !body) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch all FCM tokens for users subscribed to this route
    const { data: users, error: dbError } = await supabase
      .from('users')
      .select('fcm_token')
      .eq('route_id', route_id)
      .not('fcm_token', 'is', null);

    if (dbError) throw dbError;

    const tokens = users.map((u: any) => u.fcm_token).filter(Boolean);

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ success: true, delivered: 0, message: 'No registered tokens for route' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Dispatch FCM v1 / Legacy Multicast HTTP Request
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `key=${fcmServerKey}`,
      },
      body: JSON.stringify({
        registration_ids: tokens,
        notification: {
          title,
          body,
          sound: 'default',
        },
        data: data || {},
      }),
    });

    const fcmResult = await fcmResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        delivered: tokens.length,
        fcmResult,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
