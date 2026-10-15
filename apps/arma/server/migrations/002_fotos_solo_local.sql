-- Pictures for local use only (fotos-solo-local): sources whose photos may be shown on this computer and never leave it.
-- They are separate from the text sources (pokecottage keeps text_only) so each fact carries its exact permission.
ALTER TABLE arma.sources DROP CONSTRAINT sources_permission_check,
  ADD CONSTRAINT sources_permission_check CHECK (permission IN ('ok', 'text_only', 'review', 'none', 'own', 'local'));
INSERT INTO arma.sources (id, name, url, permission, images, note) VALUES
  ('pokecottage-fotos', 'PokeCottage', 'https://pokecottage.com', 'local', true, 'Solo uso local: PokeCottage autorizó su texto, no sus fotos'),
  ('limitless', 'Limitless TCG', 'https://limitlesstcg.com', 'local', true, 'Solo uso local: sin permiso'),
  ('bulbagarden', 'Bulbagarden Archives', 'https://archives.bulbagarden.net', 'local', true, 'Solo uso local: licencia por revisar')
ON CONFLICT (id) DO NOTHING;
