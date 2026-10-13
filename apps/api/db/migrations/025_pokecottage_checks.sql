-- Species whose PokeCottage checklist was already used to fill photos of Japanese cards without an image (asked again after 30 days).
CREATE TABLE pokecottage_checks (
  dex        int PRIMARY KEY,
  checked_at timestamptz NOT NULL DEFAULT now(),
  found      int NOT NULL DEFAULT 0
);
