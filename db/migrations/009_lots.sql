-- Lots: a group of cards I sell or buy in one deal, priced at a % of the market price (e.g. sell at 90%, buy at 70%)
CREATE TABLE lots (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  kind       text NOT NULL DEFAULT 'sell' CHECK (kind IN ('sell', 'buy')),
  pct        int  NOT NULL DEFAULT 90 CHECK (pct BETWEEN 1 AND 300),   -- % of the market price (by condition)
  round_to   int  NOT NULL DEFAULT 10 CHECK (round_to IN (1, 10, 50, 100, 500, 1000)),  -- CLP rounding of each card's price
  note       text NOT NULL DEFAULT '',
  status     text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),  -- done = inventory already updated
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at  timestamptz
);
-- One line per card + variant + language + condition (same key as the inventory)
CREATE TABLE lot_items (
  lot_id   int  NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
  card_id  text NOT NULL REFERENCES cards(id),
  variant  text NOT NULL,
  lang     text NOT NULL DEFAULT '',
  cond     text NOT NULL DEFAULT 'NM',
  qty      int  NOT NULL CHECK (qty > 0),
  price    int  CHECK (price >= 0),        -- price agreed by hand for this line (CLP per copy), wins over the %
  unit     int,                            -- CLP per copy when the lot was closed (history)
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lot_id, card_id, variant, lang, cond)
);
INSERT INTO settings (key, value) VALUES ('lots', '{"sell": 90, "buy": 70}') ON CONFLICT DO NOTHING;
