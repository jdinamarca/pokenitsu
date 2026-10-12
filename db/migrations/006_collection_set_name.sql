-- Set name as the checklist writes it (English), to show the collection in one language
ALTER TABLE collection_cards ADD COLUMN set_name text;
