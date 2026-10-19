-- The additional cards of each set's page in Bulbapedia (sellos-y-cruce-de-expansiones): which finish a stamped card has
-- ("Reverse Holo "Obsidian Flames" stamp"); text only, CC BY-NC-SA like the other Bulbapedia sources: to review before production
INSERT INTO arma.sources (id, name, url, permission, images, note) VALUES
  ('bulbapedia-adicionales', 'Bulbapedia (cartas adicionales)', 'https://bulbapedia.bulbagarden.net/wiki/Obsidian_Flames_(TCG)', 'review', false, 'CC BY-NC-SA: el acabado de las cartas selladas, de la lista de cartas adicionales de cada expansión')
ON CONFLICT (id) DO NOTHING;
