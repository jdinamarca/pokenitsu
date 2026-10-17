-- fotos-solo-local-en-catalogo: PokeCottage authorized its photos for local use only, never production (the user,
-- 2026-10-17), and catalog cards get their own photo rows: Limitless for local use only, or our own (production-ready).
UPDATE arma.sources SET note = 'Solo uso local: PokeCottage autorizó sus fotos solo para uso local, nunca producción'
WHERE id = 'pokecottage-fotos';

-- one photo per catalog card and source (the card ids of public.cards; not a foreign key: the catalog is Nitsu's)
CREATE TABLE IF NOT EXISTS arma.card_photos (
  card_id text NOT NULL,
  source_id text NOT NULL REFERENCES arma.sources (id),
  src text NOT NULL,
  ref text,
  by_name text,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (card_id, source_id)
);
