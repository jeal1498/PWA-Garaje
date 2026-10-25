# CLAUDE.md — Garaje

PWA para que **cualquier dueño de vehículo** lleve el control de su auto: combustible, servicios, gastos y avisos. Es de la **familia Checa** (misma identidad visual que Checa, Clientela y —por indicación del usuario— Finanzas). Uso público; la meta es empaquetarla como APK (TWA) y subirla a Play Store.

## Usuario
- Habla español (México). Respuestas **cortas y concisas**.
- Maqueta en artifact antes de cualquier cambio visual grande. Maqueta aprobada de v1: https://claude.ai/artifact/T4t8YZCGrWtKLN1dUitSL6

## Reglas
- **Sin build ni dependencias**: HTML + CSS + JS (ES modules) puros. Se sirve tal cual en GitHub Pages desde `main`: https://jeal1498.github.io/PWA-Garaje/
- **Sube `CACHE` en `sw.js` en cada cambio** (`garaje-vN`) o el teléfono no se actualiza; `ASSETS` debe listar todos los archivos.
- **Repo público: nada de datos personales ni de ejemplo en el código.** La app arranca vacía; los datos viven en `localStorage` (clave `garaje`) de cada teléfono.
- Solo modo oscuro. Colores/letras salen de `marca/tokens.css` (asfalto, tablero, hueso, humo; semáforo al día `#22C55E` / pronto `#FACC15` / vencido `#EF4444`; Bricolage 800, DM Sans, JetBrains Mono). El color solo significa estado.
- Voz: de tú, directa, cercana («Te aviso antes de que se te pase»). Sin tecnicismos.
- Probar: `python3 -m http.server 8768` en la raíz y Playwright (Chromium en `/opt/pw-browsers/chromium`) a 390 px; sembrar `localStorage.garaje` y `reload()`.

## Modelo (`localStorage.garaje`)
`{ app:'garaje', vehicle:{name, odo}, entries:[…], reminders:[…] }`
- `entries`: `{id, type: combustible|servicio|gasto, date 'YYYY-MM-DD', amount, title?, odo?, liters?, full?, note?, createdAt}`.
- `reminders`: `{id, title, everyKm?, everyMonths?, lastKm, lastDate, dueDate?}`. Estado = lo peor entre km y fecha (`estadoAviso`): vencido, pronto (≤ 30 días o ≤ 10 % / 300 km) o al día.
- Al guardar un servicio/gasto con el nombre de un aviso, ese aviso se pone «al día» (`ponerAlDia`).
- Rendimiento por **tanque lleno** (`rendimiento`, `rendimientoDe`). Costo por km del mes = gasto ÷ km de los odómetros del mes.

## Archivos
- `index.html`, `css/garaje.css`, `manifest.webmanifest`, `sw.js`, `marca/` (tokens, íconos SVG/PNG, fuentes).
- `js/garaje.js` (pantallas, hojas, eventos), `calculos.js` (puro), `almacenamiento.js`, `utilidades.js`, `iconos.js`.

## Pantallas
Barra: Inicio | Avisos | **+** | Historial | Yo. Inicio (gasto del mes, rendimiento, costo/km, 3 avisos), Avisos (tarjetas con barra de avance; tocar → «Ya lo hice»), Historial (filtros y meses; compartir resumen en texto), Yo (nombre del auto, odómetro, copia JSON, borrar todo). El **+** abre «Registrar» (Combustible / Servicio / Gasto) en una hoja.

## Pendiente
- Varios vehículos (hoy uno solo).
- Documentos (fotos de póliza, licencia), reporte para vender el auto, respaldo en la nube.
- APK con TWA/Bubblewrap (necesita `assetlinks.json`), ficha de Play Store, política de privacidad.
