-- Kind of connected art: panorama = the pieces form one picture; cameo = each Pokémon appears in the other's card;
-- escena = the same scene seen from each card, or a continuation (same place or story years later). note: how they connect.
ALTER TABLE art_groups ADD COLUMN kind text NOT NULL DEFAULT 'panorama' CHECK (kind IN ('panorama', 'cameo', 'escena'));
ALTER TABLE art_groups ADD COLUMN note text NOT NULL DEFAULT '';
