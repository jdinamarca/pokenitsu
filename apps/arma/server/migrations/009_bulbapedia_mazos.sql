-- Battle Academy deck lists from Bulbapedia (mazos-y-campeonatos-de-la-familia): which original card each deck reprints
-- and its number in the deck; text only, CC BY-NC-SA like the other Bulbapedia sources: to review before production
INSERT INTO arma.sources (id, name, url, permission, images, note) VALUES
  ('bulbapedia-mazos', 'Bulbapedia (mazos)', 'https://bulbapedia.bulbagarden.net/wiki/Battle_Academy_(TCG)', 'review', false, 'CC BY-NC-SA: qué carta trae cada mazo de Battle Academy y su número en el mazo')
ON CONFLICT (id) DO NOTHING;
