-- The PokeCottage photo source was first seeded as "Fotos de PokeCottage" (002, applied before its rename), which made
-- the sheet say "Foto solo para uso local · Fotos de PokeCottage": its name is just PokeCottage, its sticker says the rest
UPDATE arma.sources SET name = 'PokeCottage' WHERE id = 'pokecottage-fotos' AND name = 'Fotos de PokeCottage';
