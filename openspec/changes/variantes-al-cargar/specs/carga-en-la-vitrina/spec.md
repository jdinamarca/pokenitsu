## ADDED Requirements

### Requirement: Elegir la variante en la ficha
La ficha de la carta marcada SHALL mostrar "Variante" con una ficha por cada variante de la carta, sin repetir: las de su Full en el idioma de la sesión (o en todos sus idiomas si el Full no la tiene en ese idioma), las del catálogo y las que la cuenta ya tiene de esa carta; si no se conoce ninguna, Normal, Holo y Reverse. La automática SHALL venir marcada, o la primera si la automática no está en la lista.

#### Scenario: Eevee de Sandstorm en inglés
- **WHEN** el usuario marca la #63 de Sandstorm con la sesión en inglés
- **THEN** la ficha ofrece Normal (marcada), Reverse, FXE-WTF-G7Z, FXE-WTF-JPX, FXE-WTF-TE5 y No e-Reader Logo

#### Scenario: Una carta sin variantes conocidas
- **WHEN** el usuario marca una carta sin Full, sin variantes en el catálogo y sin copias
- **THEN** la ficha ofrece Normal, Holo y Reverse con la automática marcada

### Requirement: Se carga la variante marcada
"Cargar una", el segundo clic en la carta y Enter con su número SHALL cargar la variante marcada, y la vista previa y la foto de la ficha SHALL mostrarla. Un sufijo escrito SHALL mandar sobre lo marcado. Al marcar otra carta, la variante SHALL volver a la automática.

#### Scenario: Cargar la variante marcada
- **WHEN** el usuario marca Reverse y aprieta "Cargar una · Reverse"
- **THEN** se suma una copia reverse de la #63 con el idioma, estado y ubicación de la sesión, y aparece en "Tus copias"

#### Scenario: El sufijo manda
- **WHEN** el usuario tiene marcada FXE-WTF-G7Z y escribe `63r`
- **THEN** la vista previa y la carga son Reverse

#### Scenario: Otra carta
- **WHEN** el usuario marcó Reverse en la #63 y luego marca la #64
- **THEN** la ficha de la #64 viene con su variante automática marcada

### Requirement: Variantes de sello en el inventario
Una variante de sello del Full SHALL guardarse en el inventario con el nombre que usa el catálogo, para que cuente en el Master Set y se vea igual en Nitsu.

#### Scenario: Una variante de sello
- **WHEN** el usuario carga FXE-WTF-G7Z
- **THEN** la copia queda en el inventario como `fxewtfg7z` y el Master Set de Eevee la cuenta como esa impresión
