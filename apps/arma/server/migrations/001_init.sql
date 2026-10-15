-- "Arma tu colección" (ADR 0020): the Full of printings of a Pokémon, where each fact came from and with what permission.
-- Only this schema is ever written by the app; public (catalog, prices, inventory, sessions) is read-only for it.

-- sources and the permission their data has: ok (open or authorized), text_only (no images), review (license to check),
-- none (no permission: local testing only), own (our own data)
CREATE TABLE arma.sources (
  id         text PRIMARY KEY,
  name       text NOT NULL,
  url        text,
  permission text NOT NULL CHECK (permission IN ('ok', 'text_only', 'review', 'none', 'own')),
  images     boolean NOT NULL DEFAULT false,   -- its pictures may be shown
  note       text
);
INSERT INTO arma.sources (id, name, url, permission, images, note) VALUES
  ('tcgdex', 'TCGdex', 'https://tcgdex.dev', 'ok', true, 'API abierta'),
  ('pokemontcg', 'pokemontcg.io', 'https://pokemontcg.io', 'ok', true, 'API abierta; fotos copiadas en el catálogo de Nitsu'),
  ('tcgplayer', 'TCGplayer', 'https://www.tcgplayer.com', 'none', false, 'Variantes y precios vía pokemontcg.io; sin permiso'),
  ('pokecottage', 'PokeCottage', 'https://pokecottage.com', 'text_only', false, 'Autorizó usar el texto de sus master sets, también en producción; no sus fotos'),
  ('bulbapedia', 'Bulbapedia', 'https://bulbapedia.bulbagarden.net', 'review', false, 'CC BY-NC-SA: revisar antes de producción'),
  ('own', 'Nitsu', NULL, 'own', true, 'Datos propios');

-- one artwork (a card design) that several printings share
CREATE TABLE arma.designs (
  id         text PRIMARY KEY,                -- e.g. eev:sv3pt5-133
  dex        integer NOT NULL,
  name       text NOT NULL,
  artist     text,
  sort_date  date
);

-- one printing: card (set + number) × language × variant
CREATE TABLE arma.printings (
  code       text PRIMARY KEY,                -- stable catalog code, e.g. EEV·SV3PT5·133·EN·N
  dex        integer NOT NULL,
  set_key    text NOT NULL,                   -- catalog set id (sv3pt5, ja-SV2a) or a source's own (pc:…, bp:…)
  set_name   text,
  number     text NOT NULL,
  lang       text NOT NULL,                   -- EN, ES, FR, DE, IT, PT, JA, ZH, KO, TH, ID…
  finish     text NOT NULL,
  stamp      text,
  deck       text,
  deck_no    text,
  name       text,
  artist     text,
  release    date,
  design_id  text REFERENCES arma.designs (id) ON DELETE SET NULL,
  card_id    text,                            -- public.cards id when the catalog has it (pictures, inventory)
  equiv_id   text,                            -- printings that only differ in language/region share it
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX printings_dex_idx ON arma.printings (dex);
CREATE INDEX printings_card_idx ON arma.printings (card_id);
CREATE INDEX printings_equiv_idx ON arma.printings (equiv_id);

-- provenance: one row per printing, fact and source
CREATE TABLE arma.facts (
  printing_code text NOT NULL REFERENCES arma.printings (code) ON DELETE CASCADE,
  field         text NOT NULL CHECK (field IN ('exists', 'name', 'number', 'artist', 'image', 'price', 'equivalence', 'variant')),
  source_id     text NOT NULL REFERENCES arma.sources (id),
  value         text,
  ref           text,                         -- the id or URL in the source
  fetched_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (printing_code, field, source_id)
);
CREATE INDEX facts_source_idx ON arma.facts (source_id);

-- saved combinations of rules, per account ("Full" is built in and never stored)
CREATE TABLE arma.views (
  id         bigserial PRIMARY KEY,
  user_id    text NOT NULL,
  name       text NOT NULL,
  rules      jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

-- raw answers of the sources, so a re-import does not ask again for a day
CREATE TABLE arma.source_cache (
  url        text PRIMARY KEY,
  body       jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- the last import of each Pokémon and source: what it brought and what failed
CREATE TABLE arma.imports (
  id         bigserial PRIMARY KEY,
  dex        integer NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  summary    jsonb NOT NULL DEFAULT '{}'::jsonb
);
