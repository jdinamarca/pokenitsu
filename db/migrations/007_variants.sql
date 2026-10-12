-- Beyond normal / holo / reverse: 1st Edition, Poké Ball / Master Ball holo, stamps, misprints… (slug, e.g. firstedition)
ALTER TABLE inventory DROP CONSTRAINT inventory_variant_check;
ALTER TABLE inventory ADD CONSTRAINT inventory_variant_check CHECK (variant ~ '^[a-z0-9]{1,60}$');

-- Human name of each variant slug
CREATE TABLE variant_labels (
  slug  text PRIMARY KEY,
  label text NOT NULL
);
INSERT INTO variant_labels VALUES ('normal', 'Normal'), ('holo', 'Holo'), ('reverse', 'Reverse'),
  ('firstedition', '1st Edition'), ('pokeballholo', 'Poké Ball'), ('masterballholo', 'Master Ball');

-- The checklist's variants of each card: [{slug, label, type, img}]
ALTER TABLE collection_cards ADD COLUMN vlist jsonb NOT NULL DEFAULT '[]';
