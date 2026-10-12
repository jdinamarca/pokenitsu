-- Name as the checklist writes it (e.g. "Eevee" for a Japanese card printed as イーブイ), to show the collection in one language
ALTER TABLE collection_cards ADD COLUMN name text;
