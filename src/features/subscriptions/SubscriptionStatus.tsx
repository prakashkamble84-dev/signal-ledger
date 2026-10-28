import { useEffect, useState } from "react";
import { AlertCircle, ArrowUpRight, CalendarClock, CheckCircle2, Clock3, CreditCard, RefreshCw, ShieldCheck } from "lucide-react";
import { getDaysRemaining, getEntitlementState, loadSubscriptionStatus, type SubscriptionRecord } from "./subscriptionAccess";
import "./subscription.css";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "loaded"; incomplete: boolean; subscription: SubscriptionRecord | null };

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export default function SubscriptionStatus() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [upgradeNotice, setUpgradeNotice] = useState(false);
  async function refresh() {
    setState({ status: "loading" });
    try {
      const response = await loadSubscriptionStatus();
      setState({ status: "loaded", incomplete: response.state === "onboarding_incomplete", subscription: response.subscription });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "Could not load subscription status." });
    }
  }
  useEffect(() => { void refresh(); }, []);

  if (state.status === "loading") return <section className="billing-state" role="status" aria-live="polite"><span className="billing-spinner" /><div><h2>Loading subscription</h2><p>Checking your workspace entitlement securely.</p></div></section>;
  if (state.status === "error") return <section className="billing-state billing-error" role="alert"><AlertCircle size={22} /><div><h2>Subscription status unavailable</h2><p>{state.message}</p><button className="billing-secondary" onClick={() => void refresh()}><RefreshCw size={15} /> Try again</button></div></section>;

  const subscription = state.subscription;
  const entitlement = getEntitlementState(subscription, state.incomplete);
  const days = getDaysRemaining(subscription?.trial_ends_at ?? null);
  const activeTrial = entitlement === "active_trial";
  const activePaid = entitlement === "active_paid" || entitlement === "canceled_with_access";
  const heading = state.incomplete ? "Finish setting up your workspace" : activeTrial ? "Your trial is active" : entitlement === "past_due" ? "Payment needs attention" : activePaid ? "Your subscription is active" : entitlement === "expired" ? "Your access period has ended" : "No subscription yet";
  const description = state.incomplete ? "Your personal workspace is still being provisioned. Your existing sign-up flow has not been changed." : activeTrial ? "Explore your workspace during your trial. Your access ends on the date below." : entitlement === "past_due" ? "Your subscription is past due. Workspace access may be limited until billing is resolved." : activePaid ? entitlement === "canceled_with_access" ? "Your subscription is canceled, but access continues through the paid period." : "Your workspace is covered by an active subscription." : entitlement === "expired" ? "This workspace does not currently have an active trial or paid period." : "A workspace subscription has not been activated. No trial or paid access has been assumed.";
  const endDate = activeTrial ? subscription?.trial_ends_at ?? null : subscription?.current_period_ends_at ?? null;

  return <div className="billing-page">
    <div className="page-heading"><div><div className="eyebrow">WORKSPACE SETTINGS</div><h1>Subscription &amp; trial</h1><p className="page-description">View the current entitlement for this workspace.</p></div></div>
    <section className={`billing-hero${activeTrial ? " trial" : activePaid ? " paid" : ""}`} aria-labelledby="billing-status-title">
      <div className="billing-hero-icon">{activeTrial ? <Clock3 size={22} /> : activePaid ? <CheckCircle2 size={22} /> : <ShieldCheck size={22} />}</div>
      <div className="billing-hero-copy"><span className="billing-eyebrow">CURRENT STATUS</span><h2 id="billing-status-title">{heading}</h2><p>{description}</p></div>
      {activeTrial && days !== null && <div className="billing-days"><strong>{days}</strong><span>{days === 1 ? "day remaining" : "days remaining"}</span></div>}
      {(activeTrial || activePaid || entitlement === "past_due") && <span className="billing-status-pill">{activeTrial ? "TRIAL" : entitlement === "past_due" ? "PAST DUE" : entitlement === "canceled_with_access" ? "CANCELS AT PERIOD END" : "ACTIVE"}</span>}
    </section>

    {subscription ? <section className="billing-details" aria-label="Subscription details">
      <div className="billing-detail"><span className="billing-detail-icon"><CreditCard size={17} /></span><div><span>Plan</span><strong>{subscription.plan_key}</strong></div></div>
      <div className="billing-detail"><span className="billing-detail-icon"><CalendarClock size={17} /></span><div><span>{activeTrial ? "Trial started" : "Period started"}</span><strong>{formatDate(activeTrial ? subscription.trial_starts_at : subscription.current_period_starts_at)}</strong></div></div>
      <div className="billing-detail"><span className="billing-detail-icon"><CalendarClock size={17} /></span><div><span>{activeTrial ? "Trial ends" : "Period ends"}</span><strong>{formatDate(endDate)}</strong></div></div>
    </section> : <section className="billing-empty"><span className="billing-detail-icon"><CreditCard size={18} /></span><div><h3>No plan information</h3><p>Subscription details will appear here when a trusted workspace subscription is activated.</p></div></section>}

    <section className="billing-upgrade"><div><h2>Ready to upgrade?</h2><p>Plan choices and checkout are not available yet. Your access cannot be changed from this screen.</p></div><button className="billing-upgrade-button" onClick={() => setUpgradeNotice(true)}>View upgrade options <ArrowUpRight size={16} /></button></section>
    {upgradeNotice && <div className="billing-notice" role="status"><span>Self-serve upgrades are not available yet. No payment or entitlement changes were made.</span><button onClick={() => setUpgradeNotice(false)} aria-label="Dismiss upgrade notice">Dismiss</button></div>}
    <p className="billing-footnote"><ShieldCheck size={14} /> Subscription status is read from a trusted server endpoint. This page cannot grant or change access.</p>
  </div>;
}
