-- The Japanese expansions only Limitless TCG has (expansiones-japonesas-de-limitless), as source 'limitless' in the catalog
ALTER TABLE public.sets DROP CONSTRAINT IF EXISTS sets_source_check;
ALTER TABLE public.sets ADD CONSTRAINT sets_source_check CHECK (source IN ('ptcg', 'tcgdex-ja', 'tcgdex-en', 'manual', 'pokecottage', 'asia', 'limitless'));

-- Limitless's XY8b is Blue Shock (TCGdex's XY8a) and its XY11b Fiery Fighter (TCGdex's XY11a): the lists filled by the
-- same code went to the other expansion. Its cards and local photos move to the one they belong to, only when that one
-- is empty, every card came from Limitless and nothing of an account (copy, log, collection, lot, photo, price) uses them; the emptied one is
-- filled again with its own list at start.
DO $$
DECLARE
  m record;
BEGIN
  -- the checks see every account's rows (forced row security)
  PERFORM set_config('app.all_users', 'on', true);
  FOR m IN SELECT * FROM (VALUES ('ja-XY8b', 'ja-XY8a'), ('ja-XY11b', 'ja-XY11a')) AS t (src, dst) LOOP
    IF EXISTS (SELECT 1 FROM public.cards WHERE set_id = m.src)
       AND NOT EXISTS (SELECT 1 FROM public.cards WHERE set_id = m.dst)
       AND NOT EXISTS (SELECT 1 FROM public.cards WHERE set_id = m.src AND list_source IS DISTINCT FROM 'limitless')
       AND NOT EXISTS (
         SELECT 1 FROM public.cards c WHERE c.set_id = m.src AND (
           EXISTS (SELECT 1 FROM public.inventory x WHERE x.card_id = c.id)
           OR EXISTS (SELECT 1 FROM public.inventory_log x WHERE x.card_id = c.id)
           OR EXISTS (SELECT 1 FROM public.collection_cards x WHERE x.card_id = c.id)
           OR EXISTS (SELECT 1 FROM public.collection_hidden x WHERE x.card_id = c.id)
           OR EXISTS (SELECT 1 FROM public.lot_items x WHERE x.card_id = c.id)
           OR EXISTS (SELECT 1 FROM public.art_group_cards x WHERE x.card_id = c.id)
           OR EXISTS (SELECT 1 FROM public.cameo_refs x WHERE x.card_id = c.id)
           OR EXISTS (SELECT 1 FROM public.photo_submissions x WHERE x.card_id = c.id)
           OR EXISTS (SELECT 1 FROM public.photo_reports x WHERE x.card_id = c.id)
           OR EXISTS (SELECT 1 FROM public.price_overrides x WHERE x.card_id = c.id)
           OR EXISTS (SELECT 1 FROM arma.printings x WHERE x.card_id = c.id)))
    THEN
      INSERT INTO public.cards (id, set_id, number, number_norm, name, supertype, rarity, artist, dex, image_small, image_large,
                                details_at, variants, variants_guessed, list_source)
      SELECT m.dst || substr(id, length(m.src) + 1), m.dst, number, number_norm, name, supertype, rarity, artist, dex, image_small,
             image_large, details_at, variants, variants_guessed, list_source
      FROM public.cards WHERE set_id = m.src;
      UPDATE arma.card_photos SET card_id = m.dst || substr(card_id, length(m.src) + 1) WHERE card_id LIKE m.src || '-%';
      DELETE FROM public.cards WHERE set_id = m.src;
    END IF;
  END LOOP;
END $$;
