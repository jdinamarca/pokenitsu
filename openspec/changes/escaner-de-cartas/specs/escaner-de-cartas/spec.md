# Spec Delta

## Purpose

Cargar cartas desde el celular apuntando la cámara al número impreso de la carta, con confirmación antes de guardar.

## ADDED Requirements

### Requirement: Abrir el escáner
El sistema SHALL ofrecer un botón Escanear en Cargar que abre la cámara trasera con un marco guía para la esquina inferior de la carta. Si el navegador no permite la cámara (sin HTTPS o sin permiso), SHALL explicar por qué y volver al teclado.

#### Scenario: Permiso denegado
- **WHEN** el usuario rechaza el permiso de cámara
- **THEN** el sistema muestra cómo habilitarlo y deja la carga por teclado disponible

### Requirement: Leer número y expansión
El sistema SHALL leer del recuadro el número de la carta (ej. `025/165`) y, si está impreso, el código de la expansión y el idioma (ej. `MEW EN`), y proponer la carta correspondiente.

#### Scenario: Carta moderna con código
- **WHEN** el usuario apunta a una carta con `MEW EN 025/165`
- **THEN** se propone Pikachu 025 de 151 en inglés

#### Scenario: Carta antigua sin código
- **WHEN** la carta solo tiene `58/102` y la expansión activa es Base
- **THEN** se propone la carta 58 de Base

#### Scenario: Código y total no coinciden con la expansión activa
- **WHEN** se lee `025/165` y la expansión activa tiene otro total impreso
- **THEN** se busca una expansión con ese código o total impreso y se pide confirmar cuál es

### Requirement: Confirmar antes de cargar
Ninguna carta SHALL cargarse sin que el usuario confirme. La confirmación muestra la imagen, el nombre, la expansión, el número, la variante y el estado.

#### Scenario: Lectura equivocada
- **WHEN** la carta propuesta no es la que está en la cámara
- **THEN** el usuario puede corregir el número con un teclado numérico o volver a intentar, sin que se cargue nada

### Requirement: Variante y estado
La confirmación SHALL tener botones grandes para elegir la variante (las que existen para esa carta) y el estado. Por defecto usa la variante automática y el estado activo de Cargar.

#### Scenario: Reverse
- **WHEN** el usuario toca Reverse y confirma
- **THEN** se carga una copia reverse

### Requirement: Misma carga que el teclado
Una carta confirmada SHALL cargarse igual que con el teclado: ubicación automática o elegida, venta o personal, avisos de precio y rareza, avance de la expansión y deshacer.

#### Scenario: Deshacer un escaneo
- **WHEN** el usuario confirma un escaneo y luego deshace
- **THEN** se quita esa copia igual que una carga por teclado

### Requirement: Modo continuo
Después de confirmar, el escáner SHALL quedar listo para la siguiente carta, con una vibración o sonido de confirmación cuando el dispositivo lo permite.

#### Scenario: Diez cartas seguidas
- **WHEN** el usuario escanea y confirma diez cartas
- **THEN** se cargan diez copias sin salir de la cámara

### Requirement: Privacidad de las imágenes
El reconocimiento SHALL ocurrir en el dispositivo; las imágenes de la cámara no se envían ni se guardan en el servidor.

#### Scenario: Sin conexión al servidor de OCR
- **WHEN** el usuario escanea una carta
- **THEN** no hay peticiones de red con imágenes; solo la carga de la carta confirmada
