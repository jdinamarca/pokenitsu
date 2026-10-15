-- What variant each photo shows (fotos-por-variante): a mark per photo, made by hand in the card's sheet.
-- shows: the stamp the photo shows ('1st Edition'…), or '' for the printing with no stamp (unlimited).
-- Without a mark, the automatic rule applies (photoShows in @pokenitsu/core).
CREATE TABLE IF NOT EXISTS arma.photo_marks (
  src text PRIMARY KEY,
  shows text NOT NULL,
  marked_by text,
  marked_at timestamptz NOT NULL DEFAULT now()
);
