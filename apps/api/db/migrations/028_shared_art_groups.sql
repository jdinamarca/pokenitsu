-- Connected-art groups are a shared catalog (the same groups for every account; ADR 0019): only the progress, computed
-- from each account's inventory, is per user. They lose user_id and Row Level Security; only the owner edits them (API).
DROP POLICY por_usuario ON art_groups;
DROP POLICY por_usuario ON art_group_cards;
ALTER TABLE art_groups NO FORCE ROW LEVEL SECURITY, DISABLE ROW LEVEL SECURITY;
ALTER TABLE art_group_cards NO FORCE ROW LEVEL SECURITY, DISABLE ROW LEVEL SECURITY;
ALTER TABLE art_groups DROP COLUMN user_id;
ALTER TABLE art_group_cards DROP COLUMN user_id;
