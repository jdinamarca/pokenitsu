-- The expansions only China has (expansiones-chinas-en-cargar), as source 'asia' in the catalog
ALTER TABLE public.sets DROP CONSTRAINT IF EXISTS sets_source_check;
ALTER TABLE public.sets ADD CONSTRAINT sets_source_check CHECK (source IN ('ptcg', 'tcgdex-ja', 'tcgdex-en', 'manual', 'pokecottage', 'asia'));
-- the source of a card list built from the Full's printings (PokeCottage's text, which it allowed also in production)
INSERT INTO arma.sources (id, name, url, permission, images, note)
VALUES ('full', 'Tu Master Set', NULL, 'text_only', false, 'Lista de una expansión armada desde las impresiones del Full: texto de PokeCottage o TCGdex, sin fotos')
ON CONFLICT (id) DO NOTHING;
