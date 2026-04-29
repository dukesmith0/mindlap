-- ============================================================================
-- Restore standard Supabase role grants on public schema.
--
-- Migrations 0001-0005 were applied via the Management API SQL endpoint, which
-- runs as `postgres` and creates tables owned by `postgres`. Supabase's normal
-- bootstrap (creating tables via the Studio UI) seeds default privileges on
-- the public schema for anon/authenticated/service_role. The Management API
-- path skips that seeding, so every public table ended up with only the
-- inherent REFERENCES/TRIGGER/TRUNCATE grants for those roles, no DML.
--
-- Result: every authenticated request hit "permission denied for table X"
-- before RLS even ran. Onboarding update was the first user-visible failure.
--
-- Fix: explicitly GRANT SELECT/INSERT/UPDATE/DELETE on every existing public
-- table, plus set ALTER DEFAULT PRIVILEGES so future tables created by
-- `postgres` in this schema receive the same grants automatically. RLS still
-- filters who can read/write which row; this only restores the SQL-layer
-- access that lets RLS run.
-- ============================================================================

-- Make sure the roles can resolve objects in public.
grant usage on schema public to anon, authenticated, service_role;

-- Standard Supabase pattern: anon/authenticated get ALL (RLS narrows it down),
-- service_role gets ALL (RLS-bypassing for trigger writes + admin paths).
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Future tables/sequences/functions created by `postgres` in this schema will
-- inherit the same grants without us having to re-run this migration.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
