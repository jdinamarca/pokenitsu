-- The international sets only TCGdex has (catalogo-desde-tcgdex): trainer kits, McDonald's 2023/2024, the MEP promos…
-- as source 'tcgdex-en' (ids "td-…"). Arma's migration 011 does the same, for a base where only Arma runs.
ALTER TABLE sets DROP CONSTRAINT IF EXISTS sets_source_check;
ALTER TABLE sets ADD CONSTRAINT sets_source_check CHECK (source IN ('ptcg', 'tcgdex-ja', 'tcgdex-en', 'manual', 'pokecottage'));
