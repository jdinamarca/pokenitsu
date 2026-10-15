-- Cards in other languages (cartas-en-otros-idiomas): WikiDex confirms the Spanish printing of each card and whether a
-- set was released in Spain; TCGdex's set lists in Italian and Portuguese only say a set came out in that language
INSERT INTO arma.sources (id, name, url, permission, images, note) VALUES
  ('wikidex', 'WikiDex', 'https://www.wikidex.net', 'ok', false, 'CC BY-SA 3.0: citar a WikiDex; sin fotos'),
  ('tcgdex-expansiones', 'Expansiones de TCGdex', 'https://tcgdex.dev', 'ok', false, 'Solo dice que la expansión salió en ese idioma: la carta es deducida')
ON CONFLICT (id) DO NOTHING;
