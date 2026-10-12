-- When the copies of a row were first loaded (to sort by "last added"); moving copies keeps the oldest date
ALTER TABLE inventory ADD COLUMN added_at timestamptz NOT NULL DEFAULT now();
UPDATE inventory i SET added_at = coalesce(
  (SELECT min(l.created_at) FROM inventory_log l
   WHERE l.card_id = i.card_id AND l.variant = i.variant AND l.lang = i.lang AND l.cond = i.cond AND l.loc = i.loc),
  (SELECT min(l.created_at) FROM inventory_log l WHERE l.card_id = i.card_id),
  i.updated_at);
