-- Illustrators the user follows: shown first in Ilustradores, and loading one of their cards says so
CREATE TABLE favorite_artists (
  name       text PRIMARY KEY CHECK (name <> ''),
  created_at timestamptz NOT NULL DEFAULT now()
);
