# Authentication and RLS

Time Tracker uses Supabase passwordless email authentication. Both pages render
their application UI only after Supabase restores or creates an authenticated
session. Database security does not trust that UI gate: Postgres row-level
security independently blocks anonymous access.

## Security contract

- Migration runs when Supabase project contains exactly one Auth user.
- Public email signup stays disabled.
- Frontend receives only Supabase anon or publishable key.
- Private DB config pins that user's UUID as application owner.
- `time_logs` permits select, insert, update, and delete only when authenticated
  user's UUID matches configured owner UUID.
- Service-role keys never enter frontend or Netlify public environment
  variables.

## Rollout

1. In Supabase Dashboard, open **Authentication > Users** and invite the owner
   account. Remove test users so exactly one user exists.
2. Open **Authentication > Providers > Email** and disable new-user signup.
3. Deploy application with `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_KEY`
   configured in Netlify.
4. Apply
   `supabase/migrations/20260611000000_protect_time_logs_with_rls.sql` through
   Supabase SQL Editor or normal migration workflow.
5. Open site in incognito mode. Confirm login screen appears.
6. Confirm anon REST requests cannot read or modify `time_logs`.
7. Sign in. Confirm create, edit, delete, and dashboard reads work.

The login form calls `signInWithOtp` with `shouldCreateUser: false`. It can send
links only to the existing owner; it cannot create another Auth user.

## Tradeoff

Policies authorize one configured owner UUID. Signup remains disabled as
defense in depth, but accidentally creating another Auth user does not grant
that user access. If project becomes multi-user, add an
`owner_id uuid references auth.users` column to `time_logs` and change policies
to compare `owner_id = auth.uid()`.
