-- My own price typed in USD (e.g. from Collectr): converted to CLP with the current exchange rate, so it follows the dollar
ALTER TABLE price_overrides ADD COLUMN usd numeric(12,2) CHECK (usd >= 0);
