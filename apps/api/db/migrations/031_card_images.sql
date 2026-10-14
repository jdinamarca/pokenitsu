-- Our own copy of the catalog's card pictures (shared, like cards): one row per card and size.
-- The file lives under IMAGE_DIR (local disk; later, a storage bucket) at `path`; cards.image_small / image_large then
-- point to /img/<path>, and the original link stays here in source_url.
CREATE TABLE card_images (
  card_id     text NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
  size        text NOT NULL CHECK (size IN ('small', 'large')),
  status      text NOT NULL CHECK (status IN ('ok', 'missing', 'skipped', 'error')),
  path        text,                    -- cards/<set>/<card>-<size>.webp, when status = 'ok'
  source_url  text,
  bytes       integer,
  width       integer,
  height      integer,
  sha256      text,
  note        text,                    -- why it is missing, skipped or failed
  fetched_at  timestamptz NOT NULL DEFAULT now(),
  uploaded_at timestamptz,             -- copied to the production storage
  PRIMARY KEY (card_id, size)
);
CREATE INDEX card_images_status_idx ON card_images (status);
CREATE UNIQUE INDEX card_images_path_idx ON card_images (path) WHERE path IS NOT NULL;
