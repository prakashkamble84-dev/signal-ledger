import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";
export type SubscriptionRecord = {
  plan_key: string;
  status: SubscriptionStatus;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  current_period_starts_at: string | null;
  current_period_ends_at: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};
export type EntitlementState =
  | "onboarding_incomplete"
  | "no_subscription"
  | "active_trial"
  | "active_paid"
  | "past_due"
  | "canceled_with_access"
  | "expired";

type SubscriptionResponse = { state: "onboarding_incomplete"; subscription: null } | { state: "ready"; subscription: SubscriptionRecord | null };

export async function loadSubscriptionStatus(): Promise<SubscriptionResponse> {
  const { data, error } = await supabase.functions.invoke<SubscriptionResponse>("subscription-status", { body: {} });
  if (error) throw new Error(error.message || "Could not load subscription status.");
  if (!data || (data.state !== "onboarding_incomplete" && data.state !== "ready")) throw new Error("Subscription status response was invalid.");
  return data;
}

export function getEntitlementState(subscription: SubscriptionRecord | null, onboardingIncomplete = false, now = Date.now()): EntitlementState {
  if (onboardingIncomplete) return "onboarding_incomplete";
  if (!subscription) return "no_subscription";
  const periodEnd = subscription.current_period_ends_at ? Date.parse(subscription.current_period_ends_at) : null;
  if (subscription.status === "trialing") {
    return subscription.trial_ends_at && Date.parse(subscription.trial_ends_at) <= now ? "expired" : "active_trial";
  }
  if (subscription.status === "past_due") return periodEnd !== null && periodEnd <= now ? "expired" : "past_due";
  if (subscription.status === "canceled") return periodEnd !== null && periodEnd > now ? "canceled_with_access" : "expired";
  if (subscription.status === "active") return periodEnd !== null && periodEnd <= now ? "expired" : "active_paid";
  return "expired";
}

export function getDaysRemaining(endsAt: string | null, now = Date.now()): number | null {
  if (!endsAt) return null;
  return Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 86_400_000));
}
