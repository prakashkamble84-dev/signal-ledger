# Supabase data contract — audit and proposed mapping

## Status

This document records the frontend/database comparison for the Vite + React app. A Supabase browser client is configured from Vite environment variables, but the app has no Auth integration or data-access adapter, so no frontend-to-database serialization is implemented. Account and signal behavior remains illustrative and browser-local. Do not upload `localStorage` data or use these mappings for production writes until authentication and RLS are implemented and verified.

The connected Supabase project contains `workspaces`, `workspace_memberships`, `accounts`, `signals`, `account_notes`, and `account_activity`. Verified existing findings: RLS is disabled on all six tables, there are no policies, and grants to `anon` and `authenticated` include excessive privileges such as `TRUNCATE`. This schema is not safe for application-client persistence.

## Canonical mapping proposal

| Concept | Frontend model | Database column(s) | Canonical handling |
| --- | --- | --- | --- |
| Account ID | `Account.id: string` (demo IDs currently include `acct-*`) | `accounts.id: uuid` | Production account IDs must be database UUID strings. Current illustrative IDs are not UUIDs and must remain demo-only; do not fabricate a mapping or overwrite them. |
| Signal ID | `Signal.id: string` (demo IDs currently include `sig-*`) | `signals.id: uuid` | Production signal IDs must be database UUID strings. Current illustrative IDs are not database records. |
| Account/signal link | `Signal.accountId?`; `Account.associatedSignalIds[]` | `signals.account_id` UUID FK | Canonical relationship is `signals.account_id` referencing `accounts.id` within the same workspace. `associatedSignalIds` is a UI convenience to derive from related signals, not a separate persisted relationship table. |
| Workspace scope | No workspace ID in either frontend model | `workspace_id` on accounts/signals/notes/activity; workspace membership pair (`workspace_id`, `user_id`) | Every persistent row is scoped by an authorized workspace. Workspace selection and membership checks must be server/RLS enforced; never infer authorization from a client-supplied ID. |
| Account company name | `Account.name` | `accounts.name` | Direct mapping after required non-empty validation. |
| Account domain/firmographics | `domain`, `industry`, `companySize`, `region`, `websiteUrl`, `description` | `domain`, `industry`, `company_size`, `region`, `website_url`, `description` | Direct mappings; optional values remain nullable. |
| Account qualification | `Account.status`: `Target` / `Researching` / `Qualified` / `Disqualified` | `qualification_status`: `target` / `researching` / `qualified` / `disqualified` | Normalize casing via an explicit adapter; do not cast values directly. |
| Signal title/type | `headline`, `category` | `title`, `signal_type` | Map `headline` → `title`; category enum values require a controlled mapping to database snake_case (`hiring_expansion`, etc.). |
| Signal summary/evidence | `evidence` | `summary` | Current client evidence includes explicitly illustrative prose, not provider excerpts. Production `summary` must be grounded in retained source evidence and not generated from demo samples. |
| Signal source | `sourceLabel`, optional `sourceUrl` | `source_name`, `source_url` | Store only actual source publisher/domain and URL. Current demo `sourceLabel` is the phrase “Illustrative sample — not a verified source”; it must not be written as a real publisher. |
| Publication timestamp | No distinct publication field in `Signal` | `publication_date` | Add/retain a distinct nullable publication timestamp in the eventual persistent DTO. Never substitute `observedAt` or `createdAt`. |
| Observation timestamp | `observedAt?` | `observed_at` | Means source/event observation time only when actually known. Existing sample values are illustrative and are not verified publication dates. |
| Discovery timestamp | Not represented in `Signal`; Module 04 demo holds it transiently on the result wrapper | `discovered_at` | Set when a real search discovers a result. Keep distinct from source publication/observation time. Module 04's transient timestamp is demo-only and never persisted. |
| Relevance | `relevance`, `illustrativeScore`, `interpretation` | `relevance_score`, `relevance_rationale` | Persist only an explainable, non-probabilistic assessment. The current illustrative score and rationale must not be copied into production as verified analysis. |
| Signal qualification | `qualification`: `Unreviewed` / `For review` / `Relevant` / `Not relevant` | `qualification_status`: `unreviewed` / `for_review` / `relevant` / `not_relevant` | Normalize through an explicit exhaustive mapping. |
| Provenance / creator | `isDemo`, no persistent creator identity | `provenance`, `created_by` | Real records need a provenance value and authenticated creator. Demo records must never be uploaded. |
| Record timestamps | `createdAt`; no `updatedAt` on `Signal` | `created_at`, `updated_at` | DB timestamps are canonical on persistent records; current demo `createdAt` is local sample metadata. |
| Account notes | `Account.notes[]` nested client objects | Separate `account_notes` rows with `workspace_id`, `account_id`, `author_user_id`, `body`, timestamps | Production notes should be separate workspace-scoped rows; current browser-local notes are not mapped or uploaded. |
| Account activity | Client `AccountEvent` objects in local storage | `account_activity` rows | Explicit event type mapping is required; no current persistence adapter exists. |

## Important differences and decisions

- Client IDs are arbitrary demo strings; database IDs are UUIDs. Preserve demo IDs within demo-only flows; do not insert them into UUID columns.
- The DB has two signal times (`publication_date`, `observed_at`) plus `discovered_at`; the current frontend has only `observedAt` and `createdAt`. A production DTO should expose all three separately, with publication/observation optional and discovery set by the trusted server boundary.
- UI enum strings use title case and spaces while DB checks use lowercase snake_case. Conversion must be exhaustive and tested.
- The DB has explicit workspace ownership while frontend `Account` and `Signal` contain no workspace identifier. Add workspace ownership only to a trusted persistence DTO; membership is not a user-editable UI field.
- Account relationship is a signal foreign key in SQL, unlike the convenience array and local association map in the browser model. Derive relationships from database rows.
- Current demo records have synthetic `.example` domains, explanatory placeholder evidence, unverified source labels, and scores described as illustrative. They are not suitable production seed data.

## Security gate before persistent access or live Exa

1. Implement and test Supabase Auth in the app and establish trusted user identity.
2. Enable RLS on every public application table and remove broad `anon` grants; add least-privilege policies that enforce workspace membership for SELECT/INSERT/UPDATE/DELETE, including workspace and related-account consistency.
3. Verify RLS behavior with authenticated users from separate workspaces and unauthenticated requests; confirm no cross-workspace reads/writes.
4. Create and retain migration history for schema/policy changes through the project's supported workflow.
5. Use server-side validation for privileged operations and keep private provider keys server-side only.
6. Implement and test an explicit typed adapter between the client UI model and database DTO; do not upload or auto-migrate local demo storage.

No schema or policy changes were applied during this audit because the current exposed-table security posture is unsafe and no auth flow is wired into the app.

## Current demo behavior

Signal Explorer and Account Intelligence use illustrative in-memory definitions plus `localStorage` for edits/review state. Buying Signal Hunter filters the illustrative sample set locally, reports no external search, keeps results unsaved, and holds its review/account association changes in component session state. It does not write to Supabase.

## Approved workspace authorization contract

This is the product-approved authorization contract for future RLS/server-side policy design. It is documentation only and does not mean that any permission is currently enforced.

All permissions apply only to a workspace where the authenticated user has active membership. Cross-workspace access is prohibited regardless of role.

| Operation | Owner | Admin | Member |
| --- | --- | --- | --- |
| Read authorized workspace data | Yes | Yes | Yes |
| Create accounts and signals | Yes | Yes | Yes |
| Edit accounts and signals | Yes | Yes | Yes |
| Delete accounts and signals | Yes | Yes | No |
| Create and edit own notes | Yes | Yes | Yes |
| Delete another user's notes | Yes | Yes | No |
| View workspace activity history | Yes | Yes | Yes |
| Manage ordinary members | Yes | Yes | No |
| Grant or revoke admin roles | Yes | No | No |
| Transfer ownership | Yes | No | No |
| Delete workspace | Yes | No | No |

Notes and activity permissions must be checked against actual authorship/actor identity and the record's workspace/account relationships. Clients must not be trusted to set or forge `created_by`, `author_user_id`, `actor_user_id`, or `workspace_id`; trusted database/server logic must establish or validate them.

### Membership lifecycle

- Workspace creation atomically creates the workspace and establishes its creator as the initial owner.
- Owners and admins may invite ordinary members. An invitation is bound to the intended authenticated user and becomes active only after acceptance.
- Only owners may grant or revoke admin roles or transfer ownership. Admins cannot promote themselves or anyone else to admin.
- Owners and admins may remove ordinary members; only owners may remove admins.
- Members may leave voluntarily. An owner must transfer ownership before leaving.
- Ownership transfer is initiated by the current owner and accepted by an existing workspace member.
- The last owner cannot be removed or demoted.
- Workspace deletion is owner-only, requires explicit confirmation, and must follow a defined retention policy.
- Membership and ownership changes are auditable.
- All membership changes are validated by trusted database/server logic, never frontend checks alone.

### Existing security findings — unresolved

These are verified current-state findings, not resolved issues:

- RLS is disabled on all six public application tables; no policies exist on them.
- Grants to `anon` and `authenticated` include excessive privileges, including `TRUNCATE`.
- `is_workspace_member(uuid)` and `is_workspace_admin(uuid)` are `SECURITY DEFINER` functions with an empty `search_path`; their execution ACL currently includes `anon` as well as `authenticated`, `service_role`, and `postgres`.
- A supported migration workflow, isolated Supabase test project, and controlled test identities in separate workspaces remain unverified.

No schema, grants, RLS settings, policies, functions, or production data were changed by recording this contract.
