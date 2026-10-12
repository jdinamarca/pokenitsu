-- When the card's Cardmarket price was last taken from TCGdex (fresher than pokemontcg.io's, which lags months)
ALTER TABLE card_prices ADD COLUMN td_at timestamptz;
