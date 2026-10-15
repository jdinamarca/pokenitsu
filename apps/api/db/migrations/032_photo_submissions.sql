-- Photos the community shares for catalog cards that have none (fotos-aportadas). Each account sees only its own
-- submissions (Row Level Security, like 027); the owner reviews everyone's through the API (asSystem).
CREATE TABLE photo_submissions (
  id            bigserial PRIMARY KEY,
  user_id       text NOT NULL DEFAULT current_setting('app.user_id', true) REFERENCES "user" (id) ON DELETE CASCADE,
  card_id       text NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
  file          text NOT NULL,              -- aportes/<id>.jpg under IMAGE_DIR, outside the public folder
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  reason        text,                       -- why it was rejected or withdrawn
  rotation      integer NOT NULL DEFAULT 0 CHECK (rotation IN (0, 90, 180, 270)),
  terms_version text NOT NULL,              -- the "Términos para aportar fotos" accepted (terminos-fotos.html)
  consent_at    timestamptz NOT NULL DEFAULT now(),
  prev_small    text,                       -- the card's pictures before approving, to put back on withdrawal
  prev_large    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_at   timestamptz
);
CREATE INDEX photo_submissions_status_idx ON photo_submissions (status, created_at);
-- one waiting photo per account and card
CREATE UNIQUE INDEX photo_submissions_pending_idx ON photo_submissions (user_id, card_id) WHERE status = 'pending';
ALTER TABLE photo_submissions ENABLE ROW LEVEL SECURITY, FORCE ROW LEVEL SECURITY;
CREATE POLICY por_usuario ON photo_submissions
  USING (user_id = current_setting('app.user_id', true) OR current_setting('app.all_users', true) = 'on')
  WITH CHECK (user_id = current_setting('app.user_id', true) OR current_setting('app.all_users', true) = 'on');

-- reports about a shared photo ("Reportar esta foto"); anyone can send one, even without an account. Only the owner
-- reads them, through the API.
CREATE TABLE photo_reports (
  id         bigserial PRIMARY KEY,
  card_id    text NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
  reason     text NOT NULL CHECK (reason IN ('mine', 'wrong', 'other')),
  contact    text NOT NULL,
  message    text,
  status     text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX photo_reports_open_idx ON photo_reports (status, created_at);

-- accounts that can no longer share photos (they keep using the app)
CREATE TABLE photo_contributor_blocks (
  user_id    text PRIMARY KEY REFERENCES "user" (id) ON DELETE CASCADE,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- a catalog picture can now come from a shared photo: who took it (the credit) and which submission it was
ALTER TABLE card_images
  ADD COLUMN source         text CHECK (source IN ('aporte')),
  ADD COLUMN credit_user_id text REFERENCES "user" (id) ON DELETE SET NULL,
  ADD COLUMN submission_id  bigint REFERENCES photo_submissions (id) ON DELETE SET NULL;
