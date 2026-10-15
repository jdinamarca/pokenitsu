-- The variants of each card, the same for every account and curated by the owner (variantes-compartidas, ADR 0020).
-- Each one is a slot in the collections. Until the owner reviews a card its list comes from TCGdex + TCGplayer.
CREATE TABLE card_variants_list (
  card_id  text NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
  slug     text NOT NULL,                  -- inventory variant: normal, reverse, pokeballholo, normal~ba-charizard-12…
  finish   text NOT NULL,                  -- normal, holo, reverse, cosmos, reversecosmos, pokeball, masterball
  stamp    text,                           -- 1st-edition, prerelease, battle-academy… or free text
  deck     text,                           -- Battle Academy only
  deck_no  text,
  note     text,
  label    text NOT NULL,
  kind     text NOT NULL DEFAULT 'default' CHECK (kind IN ('default', 'variant')),
  sources  text[] NOT NULL DEFAULT '{}',   -- tcgdex, tcgplayer, owner
  pos      integer NOT NULL DEFAULT 0,
  PRIMARY KEY (card_id, slug)
);
-- cards whose list the owner edited: suggestions never rewrite them again
CREATE TABLE card_variants_reviewed (
  card_id     text PRIMARY KEY REFERENCES cards (id) ON DELETE CASCADE,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
-- TCGdex variants_detailed (finish, foil, stamps, size), the source of the suggestions
ALTER TABLE cards ADD COLUMN td_variants jsonb;
-- per-collection variant lists came from the PokeCottage checklists, removed in 030: empty for every account
ALTER TABLE collection_cards DROP COLUMN vlist;
-- copies of a shared-list variant carry its slug (normal~ba-charizard-12, holo~set-logo…)
ALTER TABLE inventory DROP CONSTRAINT inventory_variant_check,
  ADD CONSTRAINT inventory_variant_check CHECK (length(variant) <= 80 AND variant ~ '^[a-z0-9]+([~-][a-z0-9]+)*$');
