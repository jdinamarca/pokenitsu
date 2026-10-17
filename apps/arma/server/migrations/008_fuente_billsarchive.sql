-- fotos-billsarchive-japonesas: Bill's Archive's scans of the old Japanese expansions (Trainers and Energies included),
-- for local use only: it publishes no terms and its robots.txt allows everything, but there is no permission for production.
INSERT INTO arma.sources (id, name, url, permission, images, note) VALUES
  ('billsarchive', 'Bill''s Archive', 'https://billsarchive.com', 'local', true, 'Solo uso local: sin términos publicados ni permiso para producción')
ON CONFLICT (id) DO NOTHING;
