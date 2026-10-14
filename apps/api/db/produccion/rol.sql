-- Production database (Supabase): the role the app connects with. Run once in Supabase's SQL editor, as postgres,
-- after changing the password. See docs/despliegue.md.
--
-- Why: each account's data is kept apart by forced Row Level Security (ADR 0018). A superuser or a role with
-- BYPASSRLS skips it without any error, so the API must not use Supabase's postgres role. With NODE_ENV=production
-- the API refuses to start with such a role.

-- 1. the app's own role: it owns its tables (migrations run as it) and cannot skip RLS
CREATE ROLE nitsu_app LOGIN PASSWORD 'CAMBIA-ESTA-CLAVE' NOSUPERUSER NOBYPASSRLS NOCREATEROLE NOCREATEDB;
GRANT USAGE, CREATE ON SCHEMA public TO nitsu_app;

-- 2. Supabase's automatic API (PostgREST, roles anon and authenticated) gets nothing from the app's tables
ALTER DEFAULT PRIVILEGES FOR ROLE nitsu_app IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE nitsu_app IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE nitsu_app IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- 3. checks (run after copying the data): both must return no rows
--   SELECT rolname FROM pg_roles WHERE rolname = 'nitsu_app' AND (rolsuper OR rolbypassrls);
--   SELECT DISTINCT grantee, table_name FROM information_schema.role_table_grants
--    WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated');
