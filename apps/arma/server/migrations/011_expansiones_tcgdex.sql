-- The international sets only TCGdex has (catalogo-desde-tcgdex), as source 'tcgdex-en' in Nitsu's catalog: the same
-- change as Nitsu's migration 033, for a base where only Arma runs (applying both is harmless)
ALTER TABLE public.sets DROP CONSTRAINT IF EXISTS sets_source_check;
ALTER TABLE public.sets ADD CONSTRAINT sets_source_check CHECK (source IN ('ptcg', 'tcgdex-ja', 'tcgdex-en', 'manual', 'pokecottage'));
