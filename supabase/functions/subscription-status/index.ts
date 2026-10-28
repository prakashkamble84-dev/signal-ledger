import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  const authorization = req.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authClient = createClient(url, anonKey);
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .select("id")
    .eq("created_by", user.id)
    .maybeSingle();
  if (workspaceError) return Response.json({ error: "Unable to load workspace" }, { status: 500, headers: corsHeaders });
  if (!workspace) return Response.json({ state: "onboarding_incomplete", subscription: null }, { headers: corsHeaders });

  const { data: membership, error: membershipError } = await admin
    .from("workspace_memberships")
    .select("workspace_id")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError) return Response.json({ error: "Unable to verify workspace access" }, { status: 500, headers: corsHeaders });
  if (!membership) return Response.json({ state: "onboarding_incomplete", subscription: null }, { headers: corsHeaders });

  const { data: subscription, error } = await admin
    .from("workspace_subscriptions")
    .select("plan_key,status,trial_starts_at,trial_ends_at,current_period_starts_at,current_period_ends_at,cancel_at_period_end,created_at,updated_at")
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (error) return Response.json({ error: "Unable to load subscription status" }, { status: 500, headers: corsHeaders });
  return Response.json({ state: "ready", subscription }, { headers: corsHeaders });
});
