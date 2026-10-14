-- PokeCottage did not authorize using its checklists or photos in other tools, not even private ones:
-- remove everything that came from it. Runs with app.all_users on, so it reaches every account's rows.

-- 1. photos linked from its CDN (catalog cards, my own variant pictures, the variants of a collection)
UPDATE cards SET image_small = NULL WHERE image_small LIKE '%pokecottage%';
UPDATE cards SET image_large = NULL WHERE image_large LIKE '%pokecottage%';
DELETE FROM variant_images WHERE img LIKE '%pokecottage%';

-- 2. collections stop following a checklist and count every card with their Pokédex number again;
--    cards that came from the list go, the ones added by hand stay (without the list's pictures)
DELETE FROM collection_cards WHERE from_checklist;
UPDATE collection_cards SET vlist = coalesce((SELECT jsonb_agg(x - 'img') FROM jsonb_array_elements(vlist) x), '[]'::jsonb)
 WHERE vlist::text LIKE '%pokecottage%';
ALTER TABLE collections DROP COLUMN checklist_url, DROP COLUMN checklist_at;
ALTER TABLE collection_cards DROP COLUMN from_checklist;

-- 3. cards and sets created from its checklists (pc-*), unless something still uses them (then they stay, without photo)
CREATE TEMP TABLE pc_unused ON COMMIT DROP AS
  SELECT c.id FROM cards c JOIN sets s ON s.id = c.set_id
  WHERE s.source = 'pokecottage'
    AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.card_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM inventory_log l WHERE l.card_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM lot_items li WHERE li.card_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM art_group_cards g WHERE g.card_id = c.id)
    AND NOT EXISTS (SELECT 1 FROM collection_cards cc WHERE cc.card_id = c.id);
DELETE FROM collection_hidden WHERE card_id IN (SELECT id FROM pc_unused);
DELETE FROM cards WHERE id IN (SELECT id FROM pc_unused);   -- prices, overrides and own pictures go with them (cascade)
DELETE FROM sets s WHERE s.source = 'pokecottage' AND NOT EXISTS (SELECT 1 FROM cards c WHERE c.set_id = s.id);

-- 4. when each species' checklist was last read
DROP TABLE IF EXISTS pokecottage_checks;
