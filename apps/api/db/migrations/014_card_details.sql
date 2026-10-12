-- When the card's full details (illustrator, rarity, Pokédex…) were looked up in TCGdex, so each card is asked once
ALTER TABLE cards ADD COLUMN details_at timestamptz;
