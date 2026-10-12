-- A range typed in Cargar ("1-30") is loaded as one group: undo reverts the whole group at once.
-- NULL for single loads and for everything loaded before this migration.
ALTER TABLE inventory_log ADD COLUMN batch uuid;
CREATE INDEX inventory_log_batch_idx ON inventory_log (batch) WHERE batch IS NOT NULL;
