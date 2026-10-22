-- Printings no source lists that the user showed with a photo of their own card (burger-king-2009-en-espanol): their own
-- source, apart from 'own' (Nitsu's uploaded photos), so an import replacing this source's facts never touches those
INSERT INTO arma.sources (id, name, url, permission, images, note)
VALUES ('confirmada', 'Confirmada con tu carta', NULL, 'own', false, 'Impresión que ninguna fuente registra, confirmada con una foto de la carta del usuario')
ON CONFLICT (id) DO NOTHING;
