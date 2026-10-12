-- The same expansion in TCGdex's English catalog (price fallback when pokemontcg.io has none, e.g. brand-new expansions).
-- NULL = not looked up yet, '' = TCGdex doesn't have it
ALTER TABLE sets ADD COLUMN tcgdex_en text;
