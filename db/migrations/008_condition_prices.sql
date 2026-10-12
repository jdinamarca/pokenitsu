-- Card condition: NM (near mint), LP, MP, HP, DMG. Copies in different condition are different rows.
ALTER TABLE inventory ADD COLUMN cond text NOT NULL DEFAULT 'NM' CHECK (cond IN ('NM', 'LP', 'MP', 'HP', 'DMG'));
ALTER TABLE inventory DROP CONSTRAINT inventory_pkey;
ALTER TABLE inventory ADD PRIMARY KEY (card_id, variant, lang, cond);
ALTER TABLE inventory_log ADD COLUMN cond text NOT NULL DEFAULT 'NM';

DROP VIEW inventory_full;
CREATE VIEW inventory_full AS
SELECT i.card_id, s.id AS set_id, s.name AS set_name, s.code AS set_code, s.source, c.number,
       i.variant, i.lang, i.cond, i.qty, i.personal, c.name, c.dex, c.artist, c.rarity, c.supertype, i.updated_at
FROM inventory i
JOIN cards c ON c.id = i.card_id
JOIN sets s ON s.id = c.set_id;

-- Market prices of a card (NM, raw), as downloaded:
--   usd: TCGplayer market price per printing {normal, holofoil, reverseHolofoil, 1stEditionHolofoil…}
--   eur: Cardmarket {trend, avg30, reverseTrend, holoTrend}
CREATE TABLE card_prices (
  card_id    text PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
  usd        jsonb,
  eur        jsonb,
  url        text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- My own price for a card + variant (CLP), wins over the market price
CREATE TABLE price_overrides (
  card_id text NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  variant text NOT NULL,
  clp     int  NOT NULL CHECK (clp >= 0),
  PRIMARY KEY (card_id, variant)
);

-- Small app settings: exchange rates, condition discounts, price source
CREATE TABLE settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO settings (key, value) VALUES
  ('prices', '{"source": "tcgplayer", "cond": {"NM": 1, "LP": 0.85, "MP": 0.7, "HP": 0.5, "DMG": 0.3}, "alert": 5000}');
