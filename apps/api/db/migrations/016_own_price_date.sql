-- When I set (or confirmed) my own price, to review the old ones every week
ALTER TABLE price_overrides ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
