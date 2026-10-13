-- English collector name of Japanese expansions (TCGdex only has the Japanese one): shown and searched in the app.
-- Filled from apps/api/src/ja-sets.json when syncing and on startup; sets.name keeps the source's name.
ALTER TABLE sets ADD COLUMN name_en text;
