# Module 05 — Subscription foundation

## Current implementation

`public.workspace_subscriptions` is the authoritative current entitlement row, unique by workspace. Its `status` is constrained to `trialing`, `active`, `past_due`, `canceled`, or `expired`; the plan key is a provider-neutral identifier. The row carries UTC timestamptz trial/period boundaries, provider identifiers, cancellation scheduling, and timestamps. Provider subscription IDs are unique when present. Client roles have SELECT only; all entitlement writes are reserved to `service_role`.

`public.workspace_subscription_events` records separate lifecycle history with event time and optional provider event ID, which is unique with its provider. The event table has RLS enabled and no browser-role grants. The event log is a history/audit trail; it is not itself used as an entitlement source.

`supabase/functions/subscription-status` verifies the caller's Supabase access token, finds their signup-created personal workspace, verifies membership, and performs service-side reads. It returns only the plan/status/date fields needed by the UI and omits provider/customer/payment identifiers. The browser obtains status only by invoking this function. No client writes or paid checkout/provider flows were added.

`src/features/subscriptions/subscriptionAccess.ts` is the typed status DTO and central entitlement classifier. Route authentication remains unchanged and remains a UX gate, not an entitlement enforcement boundary. The existing demo Accounts and Signals flows are unchanged and remain demo/local; no paid-data access is claimed or enabled.

## Trial and lifecycle policy

A workspace may receive at most one trial. The unique current row prevents repeated starts while it exists; after history-preserving lifecycle changes, the trusted trial-start operation must also check for any `trial_started` event before starting a new one. Such an operation must set `trial_starts_at` and `trial_ends_at` from UTC server time and a server-controlled duration setting, in one transaction, and must never accept duration from the browser. Repeated requests must be idempotent. The existing personal-workspace signup trigger is unchanged and is not used for subscription creation.

No trial activation or entitlement mutation endpoint is exposed in this module, and no trial was seeded. Therefore a new workspace correctly shows “No subscription yet” until an authorized server-side lifecycle operation activates one. The actual trial-duration value has not been selected/configured. Renewal, cancellation, expiry transitions, and paid status require trusted server operations; paid status additionally requires verified provider events. No payment provider is integrated.

Entitlement interpretation uses UTC epoch timestamps: a trial is active until its trial end; active/past-due access is considered ended once the current period end passes; cancellation retains access only through a future paid period end. Missing dates do not create access for canceled or past-due states. This classification is for UI display only; paid data authorization must be enforced by trusted backend/database logic before production data access is enabled.

## SQL changes applied

Two additive tables were created directly in the connected Supabase project using the database SQL tool:

- `public.workspace_subscriptions`
- `public.workspace_subscription_events`

The SQL establishes workspace foreign keys, single current-row uniqueness, status/date/provider constraints, provider-event uniqueness, lookup indexes, RLS, and least-privilege role grants for these new tables. No existing invitations, memberships, policies, grants, signup trigger, or other tables were modified. These changes need to be captured in the team's supported versioned migration workflow before promotion; a verified migration workflow/staging target was not available in this task context.

## Assumptions and known limits

- The app currently has no workspace selector or active-workspace model, so this endpoint reports the user's signup-created personal workspace. It does not claim to report a workspace selected in the mock sidebar.
- The existing signup trigger creates the personal workspace and owner membership. If that asynchronous/onboarding state is not present, the function returns `onboarding_incomplete`.
- No plan catalog, price, checkout URL, billing contact, or trial duration was invented.
- The new subscription table allows authenticated SELECT grants but exposes rows only to workspace members through its added read policy. Provider IDs are never selected into the browser DTO.
- A trusted lifecycle mutation endpoint and paid-data enforcement are prerequisites before granting production Accounts/Signals access based on these statuses.

## Verification

Type checking and a production build are recorded in the implementation chat turn. No provider flows or production data writes were exercised.
