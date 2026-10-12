-- My own picture of a card + variant, when the catalog's is wrong or missing
-- (e.g. Jungle Eevee: every public scan is the 1st Edition one, also for Unlimited). An URL or a file under /art/.
CREATE TABLE variant_images (
  card_id    text NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  variant    text NOT NULL,
  img        text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (card_id, variant)
);
