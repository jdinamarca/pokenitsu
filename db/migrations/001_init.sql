-- Card catalog, synced from pokemontcg.io
CREATE TABLE sets (
  id              text PRIMARY KEY,           -- e.g. me2
  name            text NOT NULL,              -- Phantasmal Flames
  series          text,
  code            text,                       -- code printed on the card, e.g. PFL
  release_date    date,
  total           int,
  printed_total   int,
  symbol_url      text,
  synced_at       timestamptz NOT NULL DEFAULT now(),
  cards_synced_at timestamptz                 -- null until the set's cards are downloaded
);

CREATE TABLE cards (
  id          text PRIMARY KEY,               -- e.g. me2-25
  set_id      text NOT NULL REFERENCES sets(id),
  number      text NOT NULL,                  -- as printed: 25, TG05, SV001
  number_norm text NOT NULL,                  -- upper-case without leading zeros: 25, TG5, SV1
  name        text NOT NULL,
  supertype   text,                           -- Pokémon / Trainer / Energy
  rarity      text,
  artist      text,
  dex         int[] NOT NULL DEFAULT '{}',    -- national Pokédex numbers
  image_small text,
  image_large text,
  UNIQUE (set_id, number)
);
CREATE INDEX cards_set_norm_idx ON cards (set_id, number_norm);
CREATE INDEX cards_dex_idx ON cards USING gin (dex);
CREATE INDEX cards_artist_idx ON cards (artist);

-- What I own: one row per card + variant + language
CREATE TABLE inventory (
  card_id    text NOT NULL REFERENCES cards(id),
  variant    text NOT NULL CHECK (variant IN ('normal', 'holo', 'reverse')),
  lang       text NOT NULL DEFAULT '',       -- ES, EN, PT, ... ('' = unknown)
  qty        int  NOT NULL CHECK (qty > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (card_id, variant, lang)
);

-- Every load/removal, used for undo and auditing
CREATE TABLE inventory_log (
  id         bigserial PRIMARY KEY,
  card_id    text NOT NULL REFERENCES cards(id),
  variant    text NOT NULL,
  lang       text NOT NULL,
  delta      int  NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Cards whose illustrations connect into a bigger picture
CREATE TABLE art_groups (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  cols       int  NOT NULL DEFAULT 3 CHECK (cols BETWEEN 1 AND 20),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE art_group_cards (
  group_id int  NOT NULL REFERENCES art_groups(id) ON DELETE CASCADE,
  pos      int  NOT NULL,                     -- order in the picture: left→right, top→bottom
  card_id  text NOT NULL REFERENCES cards(id),
  PRIMARY KEY (group_id, pos)
);

-- Handy view for SQL queries: inventory with card and set details
CREATE VIEW inventory_full AS
SELECT i.card_id, s.id AS set_id, s.name AS set_name, s.code AS set_code, c.number,
       i.variant, i.lang, i.qty, c.name, c.dex, c.artist, c.rarity, c.supertype, i.updated_at
FROM inventory i
JOIN cards c ON c.id = i.card_id
JOIN sets s ON s.id = c.set_id;
