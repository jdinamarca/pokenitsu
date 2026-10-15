-- Languages of each set from Bulbapedia (idiomas-desde-bulbapedia): in which languages a set came out, and with which
-- variants (1st Edition, reverse); text only, CC BY-NC-SA like the Bulbapedia links: to review before production
INSERT INTO arma.sources (id, name, url, permission, images, note) VALUES
  ('bulbapedia-idiomas', 'Bulbapedia (idiomas)', 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Trading_Card_Game_expansions_in_other_languages', 'review', false, 'CC BY-NC-SA: en qué idiomas salió cada expansión y con qué variantes')
ON CONFLICT (id) DO NOTHING;
