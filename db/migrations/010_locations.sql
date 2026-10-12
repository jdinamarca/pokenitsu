-- Where cards are stored: bulk boxes, binders for the valuable ones…
-- rule: which cards go there when loading (first matching location by pos wins), all parts optional:
--   {"series": ["Scarlet & Violet"], "sets": ["sv3pt5"], "origin": ["INT"], "special": ["ir", "sir"], "minPrice": 5000, "personal": true}
--   series/sets/origin: the card's set (origin: INT, JA, ZH… = the set's region); special: rarity groups OR price >= minPrice; personal: only copies for my collection
CREATE TABLE locations (
  id         serial PRIMARY KEY,
  name       text NOT NULL UNIQUE CHECK (name <> '' AND name !~ '\|'),
  kind       text NOT NULL DEFAULT 'box' CHECK (kind IN ('box', 'binder', 'other')),
  pos        int  NOT NULL DEFAULT 0,
  note       text NOT NULL DEFAULT '',
  rule       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Copies of the same card can be in different places: the location is part of the row (0 = not assigned yet)
ALTER TABLE inventory ADD COLUMN loc int NOT NULL DEFAULT 0;
ALTER TABLE inventory DROP CONSTRAINT inventory_pkey;
ALTER TABLE inventory ADD PRIMARY KEY (card_id, variant, lang, cond, loc);
ALTER TABLE inventory_log ADD COLUMN loc int NOT NULL DEFAULT 0;
-- where the copies of a closed lot were taken from / put in: [{"loc": 3, "n": 2}]
ALTER TABLE lot_items ADD COLUMN taken jsonb;

DROP VIEW inventory_full;
CREATE VIEW inventory_full AS
SELECT i.card_id, s.id AS set_id, s.name AS set_name, s.code AS set_code, s.source, c.number,
       i.variant, i.lang, i.cond, i.loc, l.name AS location, i.qty, i.personal, c.name, c.dex, c.artist, c.rarity, c.supertype, i.updated_at
FROM inventory i
JOIN cards c ON c.id = i.card_id
JOIN sets s ON s.id = c.set_id
LEFT JOIN locations l ON l.id = i.loc;
