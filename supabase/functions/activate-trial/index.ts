import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify JWT - this function requires authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response('Invalid token', { status: 401, headers: corsHeaders });
  }

  // Only the workspace owner can activate a trial
  const { data: membership, error: membershipError } = await supabaseClient
    .from('workspace_memberships')
    .select('role, workspace_id')
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .single();

  if (membershipError || !membership) {
    return new Response('Only workspace owners can activate trials', { status: 403, headers: corsHeaders });
  }

  const workspaceId = membership.workspace_id;

  // Check if trial already exists for this workspace
  const { data: existingTrial, error: existingError } = await supabaseClient
    .from('workspace_subscriptions')
    .select('id, trial_ends_at, status')
    .eq('workspace_id', workspaceId)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    return new Response('Error checking existing trial', { status: 500, headers: corsHeaders });
  }

  // If trial already exists and is still active, return it
  if (existingTrial && existingTrial.trial_ends_at) {
    const trialEnd = new Date(existingTrial.trial_ends_at);
    if (trialEnd > new Date()) {
      return new Response(JSON.stringify({ trial: existingTrial, alreadyActive: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Server-controlled trial duration (7 days)
  const TRIAL_DURATION_DAYS = 7;
  const trialStartsAt = new Date().toISOString();
  const trialEndsAt = new Date(Date.now() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Insert or update trial subscription
  const { data: trialData, error: trialError } = await supabaseClient
    .from('workspace_subscriptions')
    .upsert({
      workspace_id: workspaceId,
      status: 'trialing',
      trial_starts_at: trialStartsAt,
      trial_ends_at: trialEndsAt,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'workspace_id',
    })
    .select()
    .single();

  if (trialError) {
    console.error('Trial activation error:', trialError);
    return new Response('Failed to activate trial', { status: 500, headers: corsHeaders });
  }

  // Log trial activation event
  await supabaseClient
    .from('workspace_subscription_events')
    .insert({
      workspace_id: workspaceId,
      event_type: 'trial_started',
      event_data: {
        trial_starts_at: trialStartsAt,
        trial_ends_at: trialEndsAt,
        duration_days: TRIAL_DURATION_DAYS,
        activated_by: user.id,
      },
    });

  return new Response(JSON.stringify({ trial: trialData, alreadyActive: false }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});