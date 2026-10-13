-- Standard variants each card was printed in (normal, reverse, holo, firstedition), for the master-set progress of an expansion.
-- From TCGdex; NULL = not looked up yet. variants_guessed: TCGdex did not have the card, so they were deduced from its rarity.
ALTER TABLE cards ADD COLUMN variants text[];
ALTER TABLE cards ADD COLUMN variants_guessed boolean NOT NULL DEFAULT false;
