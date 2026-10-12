-- People who asked to join the alpha from the landing page (/alfa)
CREATE TABLE alpha_signups (
  email      text PRIMARY KEY,
  name       text NOT NULL,
  handle     text NOT NULL DEFAULT '',
  role       text NOT NULL DEFAULT '',
  size       text NOT NULL DEFAULT '',
  note       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
