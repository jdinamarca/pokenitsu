-- Cards where a Pokémon appears without being the card's subject (cameos), from RotomAmiti's Cameo Pokémon Card Database.
-- Shared catalog data, replaced whole on every import. card_id: the catalog card when the set and number match (else a reference only).
CREATE TABLE cameo_refs (
  id          serial PRIMARY KEY,
  dex         int  NOT NULL,
  species     text NOT NULL,
  card_name   text NOT NULL,
  set_name    text NOT NULL,
  number      text NOT NULL DEFAULT '',
  note        text NOT NULL DEFAULT '',
  card_id     text REFERENCES cards(id) ON DELETE SET NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cameo_refs_dex_idx ON cameo_refs (dex);
CREATE INDEX cameo_refs_card_idx ON cameo_refs (card_id) WHERE card_id IS NOT NULL;
