-- Cards from a PokeCottage master-set checklist that are in no other catalog (trainer kits, Chinese sets…)
ALTER TABLE sets DROP CONSTRAINT sets_source_check;
ALTER TABLE sets ADD CONSTRAINT sets_source_check CHECK (source IN ('ptcg', 'tcgdex-ja', 'manual', 'pokecottage'));

-- A collection can follow a checklist: then only its cards count (instead of every card with the Pokédex number)
ALTER TABLE collections ADD COLUMN checklist_url text;
ALTER TABLE collections ADD COLUMN checklist_at timestamptz;

-- Cards explicitly in a collection: from the checklist or added by hand.
-- role: main = the Pokémon is the protagonist; cameo = it appears in the art of another card (trainers, other Pokémon)
CREATE TABLE collection_cards (
  collection_id int  NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  card_id       text NOT NULL REFERENCES cards(id),
  role          text NOT NULL DEFAULT 'main' CHECK (role IN ('main', 'cameo')),
  variants      text[] NOT NULL DEFAULT '{}',    -- variants listed by the checklist (Reverse Holo, Poké Ball Holo…)
  from_checklist boolean NOT NULL DEFAULT false,
  PRIMARY KEY (collection_id, card_id)
);
