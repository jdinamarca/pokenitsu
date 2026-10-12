-- Where a set comes from: pokemontcg.io (international), TCGdex Japanese, or typed in by hand
ALTER TABLE sets ADD COLUMN source text NOT NULL DEFAULT 'ptcg' CHECK (source IN ('ptcg', 'tcgdex-ja', 'manual'));
ALTER TABLE sets ADD COLUMN lang text NOT NULL DEFAULT '';   -- language of a non-international set (JA, ZH…)

-- How many of a row's copies are for my personal collection (not for sale)
ALTER TABLE inventory ADD COLUMN personal int NOT NULL DEFAULT 0;
ALTER TABLE inventory ADD CONSTRAINT inventory_personal_ck CHECK (personal BETWEEN 0 AND qty);
ALTER TABLE inventory_log ADD COLUMN personal int NOT NULL DEFAULT 0;  -- personal copies added by that entry

-- Personal collections: every distinct card of one Pokémon (e.g. all Eevee)
CREATE TABLE collections (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  dex        int  NOT NULL,                  -- national Pokédex number
  lang       text NOT NULL DEFAULT '',       -- language I collect international cards in ('' = any)
  created_at timestamptz NOT NULL DEFAULT now()
);
-- cards I don't want in a collection (e.g. Eevee & Snorlax-GX)
CREATE TABLE collection_hidden (
  collection_id int  NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  card_id       text NOT NULL REFERENCES cards(id),
  PRIMARY KEY (collection_id, card_id)
);

DROP VIEW inventory_full;
CREATE VIEW inventory_full AS
SELECT i.card_id, s.id AS set_id, s.name AS set_name, s.code AS set_code, s.source, c.number,
       i.variant, i.lang, i.qty, i.personal, c.name, c.dex, c.artist, c.rarity, c.supertype, i.updated_at
FROM inventory i
JOIN cards c ON c.id = i.card_id
JOIN sets s ON s.id = c.set_id;
