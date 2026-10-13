-- Per-user data (ADR 0010, 0018): every table with a user's data gets user_id, the current data goes to the first account
-- (the owner), and Row Level Security only lets each request see and write its own rows. The API sets app.user_id on
-- the connection it uses for a request; system work that must see everyone's data sets app.all_users = 'on' locally.
-- Shared data (catalog, prices, exchange rate, variant labels, checklists, cameos) has no user_id.

DO $$
DECLARE owner text;
BEGIN
  SELECT id INTO owner FROM "user" ORDER BY "createdAt" LIMIT 1;
  IF owner IS NULL AND (EXISTS (SELECT 1 FROM inventory) OR EXISTS (SELECT 1 FROM inventory_log) OR EXISTS (SELECT 1 FROM locations)
                        OR EXISTS (SELECT 1 FROM collections) OR EXISTS (SELECT 1 FROM art_groups) OR EXISTS (SELECT 1 FROM lots)) THEN
    RAISE EXCEPTION 'Hay datos sin dueño: abre la versión anterior, toca "Crear cuenta" y vuelve a actualizar (tus datos actuales pasan a la primera cuenta).';
  END IF;
  PERFORM set_config('pokenitsu.owner', coalesce(owner, ''), true);
END $$;

-- id counters behind their table (a restore/import with explicit ids left locations_id_seq at 1 with ids up to 8):
-- the next insert would collide. Move each counter up to the highest id in use.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['locations', 'lots', 'collections', 'art_groups', 'inventory_log']
  LOOP
    EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, ''id''), greatest((SELECT coalesce(max(id), 0) FROM %I), (SELECT last_value FROM %s)))',
                   t, t, pg_get_serial_sequence(t, 'id'));
  END LOOP;
END $$;

-- settings: the price and lot configuration is per user; the exchange rate stays shared
CREATE TABLE user_settings (
  user_id    text NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  key        text NOT NULL,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);
INSERT INTO user_settings (user_id, key, value, updated_at)
  SELECT current_setting('pokenitsu.owner'), key, value, updated_at FROM settings
  WHERE key IN ('prices', 'lots') AND current_setting('pokenitsu.owner') <> '';
DELETE FROM settings WHERE key IN ('prices', 'lots');

-- user_id on every per-user table, filled with the owner
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['inventory', 'inventory_log', 'locations', 'lots', 'lot_items', 'collections', 'collection_cards',
                           'collection_hidden', 'art_groups', 'art_group_cards', 'favorite_artists', 'price_overrides', 'variant_images']
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN user_id text REFERENCES "user" (id) ON DELETE CASCADE', t);
    EXECUTE format('UPDATE %I SET user_id = current_setting(''pokenitsu.owner'')', t);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN user_id SET NOT NULL', t);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN user_id SET DEFAULT current_setting(''app.user_id'', true)', t);
    EXECUTE format('CREATE INDEX %I ON %I (user_id)', t || '_user_idx', t);
  END LOOP;
END $$;
ALTER TABLE user_settings ALTER COLUMN user_id SET DEFAULT current_setting('app.user_id', true);

-- keys that must be unique per user, not globally
ALTER TABLE inventory DROP CONSTRAINT inventory_pkey, ADD PRIMARY KEY (user_id, card_id, variant, lang, cond, loc);
ALTER TABLE price_overrides DROP CONSTRAINT price_overrides_pkey, ADD PRIMARY KEY (user_id, card_id, variant);
ALTER TABLE variant_images DROP CONSTRAINT variant_images_pkey, ADD PRIMARY KEY (user_id, card_id, variant);
ALTER TABLE favorite_artists DROP CONSTRAINT favorite_artists_pkey, ADD PRIMARY KEY (user_id, name);
ALTER TABLE locations DROP CONSTRAINT locations_name_key, ADD UNIQUE (user_id, name);

-- Row Level Security, forced so it also applies to the tables' owner (the role the API connects with)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['inventory', 'inventory_log', 'locations', 'lots', 'lot_items', 'collections', 'collection_cards',
                           'collection_hidden', 'art_groups', 'art_group_cards', 'favorite_artists', 'price_overrides', 'variant_images',
                           'user_settings']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format($p$CREATE POLICY por_usuario ON %I
      USING (user_id = current_setting('app.user_id', true) OR current_setting('app.all_users', true) = 'on')
      WITH CHECK (user_id = current_setting('app.user_id', true) OR current_setting('app.all_users', true) = 'on')$p$, t);
  END LOOP;
END $$;

-- a view reads with its owner's rights unless told otherwise: make it follow the caller's policies
ALTER VIEW inventory_full SET (security_invoker = true);
