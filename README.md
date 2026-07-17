# Tetris

Tetris para navegador, frontend puro (sin backend), pensado para desplegarse gratis en GitHub Pages e instalarse como PWA. El motor del juego está desacoplado de la interfaz para poder cambiar de renderer o de framework sin reescribir la lógica.

## Estado del proyecto

Implementado y funcionando:

- Motor de juego completo en TypeScript (OOP): tablero 10×20, las 7 piezas estándar, movimiento, rotación con wall-kicks básicos, caída (soft/hard drop), colisiones, limpieza de líneas, puntuación y niveles con velocidad progresiva.
- Renderizado en Canvas 2D, desacoplado del motor.
- Controles de teclado.
- HUD con puntuación, líneas y nivel.
- Pausa (`P` o botón) y reinicio (`R` o botón) sin recargar la página.
- Vista previa de la siguiente pieza.
- PWA instalable con soporte offline (`manifest.json` + `service-worker.js`).
- Configuración de depuración en VS Code (breakpoints en TypeScript vía source maps).

No implementado todavía: multijugador, sonido, controles táctiles, pantalla de menú inicial, persistencia de puntuación, iconos de la PWA, tests, CI/CD.

## Puesta en marcha

Requiere Node.js (para compilar TypeScript) y Python 3 (solo como servidor estático de desarrollo; no forma parte del runtime del juego).

```bash
npm install         # instala TypeScript (única dependencia, de desarrollo)
npm run build        # compila src/**/*.ts -> dist/
npm run watch         # compila en modo watch
npm run serve          # build + sirve la raíz del repo en http://localhost:8080
```

`dist/` es generado y está en `.gitignore`; hay que compilar antes de abrir `index.html` o desplegar. No hay bundler: `dist/` refleja la estructura de `src/` y se carga como módulos ES nativos.

Para depurar con breakpoints en el código TypeScript: abrir "Run and Debug" en VS Code y lanzar **Debug Tetris (Chrome)** (ver `.vscode/launch.json`).

## Estructura del proyecto

```
/
├── index.html
├── css/
├── src/
│   ├── engine/       # Board, Piece, Game — lógica pura, sin dependencias de DOM/canvas
│   ├── renderer/       # CanvasRenderer (tablero) y NextPieceRenderer (siguiente pieza) — leen Game y dibujan en <canvas>
│   ├── ui/             # Hud, KeyboardControls
│   ├── network/        # cliente de señalización WebRTC (pendiente, ver Roadmap técnico)
│   └── app.ts           # TetrisApp: conecta motor + renderer + ui, dueño del bucle de juego
├── dist/               # JS compilado (generado, no versionado)
├── assets/
├── manifest.json
└── service-worker.js
```

---

## 1. Apartado funcional

### Qué hace el juego hoy

- Tablero de 10 columnas × 20 filas.
- Las 7 piezas estándar (I, O, T, S, Z, J, L), generadas con `Piece.randomType()` (selección aleatoria simple, sin bolsa de 7 — ver pendientes).
- Movimiento lateral, soft drop, hard drop y rotación (con reintentos de *wall-kick* en `[0, +1, -1, +2, -2]` columnas).
- Al no caber una pieza en el punto de aparición, el juego termina (`isGameOver`).
- Puntuación por líneas simultáneas (Tetris-like): 1→100, 2→300, 3→500, 4→800 puntos, multiplicado por el nivel actual.
- Nivel = `floor(líneas_totales / 10) + 1`; cada nivel acelera la caída (`getDropIntervalMs`), con un mínimo de 100 ms.
- HUD en vivo: puntuación, líneas y nivel; mensaje de "Game Over".
- Pausa y reinicio: `Game.reset()` reinicia tablero/pieza/puntuación/nivel; `TetrisApp` cancela y relanza el bucle de caída sin recrear el `CanvasRenderer`. Mientras está en pausa se ignoran los movimientos (mover/rotar/drop).
- Vista previa de la siguiente pieza: `NextPieceRenderer` (`src/renderer/next-piece-renderer.ts`) dibuja `game.next` en un `<canvas>` propio del HUD (`#next-piece`), centrado en una rejilla 4×4, reutilizando `PIECE_SHAPES`/`PIECE_COLORS` del motor.

### Controles actuales

| Tecla | Acción |
|---|---|
| ← / → | Mover pieza |
| ↓ | Soft drop |
| ↑ | Rotar |
| Espacio | Hard drop |
| P | Pausar / reanudar |
| R | Reiniciar partida |

También hay botones "Pausa" y "Reiniciar" en el HUD equivalentes a las teclas. No hay pantalla de menú inicial: el juego arranca directamente al cargar la página.

### Funcionalidades pendientes (roadmap funcional)

Ordenadas aproximadamente por impacto/esfuerzo:

- **Hold piece**: guardar una pieza para usar más tarde (tecla típica `C` o `Shift`). Implica añadir estado `held: PieceType | null` y una regla de "solo un hold por pieza caída" en `Game`.
- **Ghost piece**: sombra que muestra dónde caería la pieza actual con hard drop. Se calcula igual que `hardDrop()` pero sin mutar el estado (simular hasta que `isValidPosition` falle).
- **Bolsa de 7 piezas ("7-bag")**: sustituir `Piece.randomType()` (aleatorio uniforme puro) por una bolsa que garantiza las 7 piezas una vez cada 7 turnos, como en el Tetris moderno (Guideline). Cambio aislado en `piece.ts`/`game.ts`.
- **Persistencia de la mejor puntuación**: `localStorage` es suficiente (no requiere backend). Pantalla de "nueva puntuación máxima".
- **Multijugador** (ver también el apartado técnico): partidas 1v1 con envío de líneas al rival al hacer *tetris*/combos, vía WebRTC. Es la pieza más grande de trabajo pendiente y toca `src/network/`, que hoy está vacío.
- **Sonido y música**: efectos para movimiento, rotación, línea completada, game over; música de fondo con opción de silenciar.
- **Pantallas de menú**: pantalla de inicio, selección de modo (solo/multijugador), pantalla de fin de partida con resumen.

---

## 2. Apartado técnico

### Arquitectura

- **Frontend estático puro**: HTML + CSS + TypeScript compilado a ES2020, sin backend ni bundler. Desplegable en GitHub Pages tal cual (sirviendo `index.html`, `css/`, `dist/`, `manifest.json`, `service-worker.js`, `assets/`).
- **TypeScript en modo `strict`** (`tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`), compilado con `tsc` sin bundler ni transpiler adicional. `dist/` es un mirror 1:1 de `src/`, cargado con `<script type="module">` e `import` con extensión `.js` explícita (requisito de ESM nativo en navegador).
- **Motor de juego desacoplado de la UI** (`src/engine/`): `Board`, `Piece`, `Game` no importan nada de DOM ni de Canvas. Esto es intencional (ver conversación de planificación al final de este documento) para poder sustituir el renderer o migrar a un framework (Vue, React...) sin tocar la lógica de juego. Cualquier cambio de reglas de Tetris debe vivir aquí, nunca en `renderer/` o `ui/`.
- **Renderer** (`src/renderer/canvas-renderer.ts`): sólo lee un `Game` y pinta; no tiene estado propio. Un renderer alternativo (WebGL, DOM/CSS grid, etc.) implementaría la misma interfaz (`render(game: Game): void`).
- **`TetrisApp`** (`src/app.ts`): única clase dueña del bucle de juego (`setTimeout` recursivo vía `scheduleDrop`). Cualquier lógica de temporización (pausar, cambiar velocidad, requestAnimationFrame en vez de setTimeout) se centraliza aquí.
- **PWA**: `manifest.json` + `service-worker.js` (cache-first sobre una lista estática de assets). El nombre de caché (`tetris-cache-v2`) hay que subirlo de versión cada vez que cambie la lista de assets cacheados, o los clientes con la PWA instalada seguirán sirviendo versiones antiguas.

### Decisiones ya tomadas (y por qué)

- **WebRTC para multijugador**, no sockets ni Bluetooth: GitHub Pages no ejecuta código de servidor, así que un socket TCP tradicional no es viable; Web Bluetooth tiene soporte pobre entre navegadores (especialmente Safari) y no encaja con "compartir una URL". WebRTC permite conexión P2P entre navegadores tras un intercambio inicial de señalización.
- **Servidor de señalización externo, fuera de este repo**: WebRTC necesita intercambiar SDP/ICE antes de establecer la conexión P2P; ese intercambio no puede hacerse sin servidor. La idea es un servicio mínimo (Node.js + WebSocket) alojado aparte (p.ej. un plan gratuito), que no participa en la partida en sí, solo en el "apretón de manos" inicial.
- **Sin bundler**: para un proyecto de este tamaño, ESM nativo + `tsc` es suficiente y reduce superficie de configuración. Revisar si esto sigue siendo cierto cuando se añadan assets (sonidos, sprites) o si el número de módulos crece mucho.

### Roadmap técnico (pendiente)

- **Iconos de la PWA**: `manifest.json` referencia `assets/icon-192.png` y `assets/icon-512.png`, que todavía no existen (`assets/` solo tiene un `.gitkeep`). Sin ellos, la instalación como PWA funciona pero con icono por defecto del navegador.
- **`src/network/`**: implementar el cliente WebRTC (creación de `RTCPeerConnection`, canal de datos para eventos de juego) y decidir/desplegar el servidor de señalización (fuera de este repo). Diseñar primero el protocolo de mensajes (qué eventos de `Game` se serializan y envían: líneas enviadas al rival, game over, etc.) antes de tocar `Game`, para mantenerlo desacoplado de la red igual que del renderer.
- **Tests**: no hay ningún test todavía. `src/engine/` es el candidato ideal para empezar (funciones puras, sin DOM) — por ejemplo con `node:test` + `tsx`, o Vitest si se acepta añadir una dependencia de desarrollo. Casos mínimos: colisión en bordes/piezas apiladas, limpieza de 1–4 líneas simultáneas, wall-kick, cálculo de nivel/velocidad, condición de game over.
- **CI**: no hay pipeline. Como mínimo, un workflow de GitHub Actions que corra `npm run build` (y tests, cuando existan) en cada PR, y opcionalmente uno de despliegue automático a GitHub Pages (`npm run build` + publicar `dist/`, `index.html`, `css/`, `manifest.json`, `service-worker.js`, `assets/` en la rama `gh-pages` o vía `actions/deploy-pages`).
- **Lint/format**: no hay ESLint ni Prettier configurados. A valorar antes de que el proyecto crezca, sobre todo si se suma más de un colaborador.
- **Service worker más robusto**: la lista `CACHED_ASSETS` en `service-worker.js` está mantenida a mano y debe editarse junto con `CACHE_NAME` cada vez que cambian los ficheros de `dist/`. Si el proyecto crece, considerar generarla automáticamente en el build en vez de mantenerla manualmente.

---

## 3. Apartado de usabilidad / jugabilidad

### Estado actual

- Interfaz mínima: título, tablero centrado, HUD lateral con puntuación/líneas/nivel, texto de "Game Over"/"Pausa" y botones de pausa/reinicio.
- Tema oscuro fijo (`color-scheme: dark` en `css/styles.css`), sin alternancia claro/oscuro.
- Solo control por teclado; no hay soporte táctil ni de gamepad. En móvil, hoy el juego es prácticamente injugable.
- Sin feedback sonoro ni animaciones (las líneas desaparecen de forma instantánea, sin transición).
- Sin indicación visual de "próxima pieza" ni de "dónde caerá" (ghost piece) — el jugador solo ve la pieza activa y el tablero.
- Tamaño de tablero fijo (`canvas width="300" height="600"`), no responsive: en pantallas pequeñas puede desbordar o quedar diminuto.

### Pendiente (roadmap de jugabilidad)

- **Controles táctiles**: botones en pantalla (o gestos de swipe) para mover/rotar/soft-drop/hard-drop en móvil, ya que el objetivo original es "multiplataforma vía navegador, sin instalación". Es el hueco más importante para que la PWA tenga sentido en un teléfono.
- **Layout responsive**: que el `<canvas>` escale con `window.innerWidth/innerHeight` (recalculando `cellSize` en `CanvasRenderer`) en vez de tamaño fijo en píxeles, y que el HUD se reubique en pantallas estrechas (debajo del tablero en vez de al lado).
- **Feedback de juego**: animación breve al limpiar líneas (parpadeo/fade antes de `clearLines()`), sonido de acierto, vibración táctil en móvil (`navigator.vibrate`) al hacer *tetris* (4 líneas).
- **Dificultad/curva de juego**: la progresión de velocidad ya existe (`getDropIntervalMs`); falta exponer al jugador el nivel de forma más visible (p.ej. resaltar el HUD al subir de nivel) y considerar un modo "maratón" vs. "sprint" (40 líneas) a futuro.
- **Accesibilidad**: sin soporte de alto contraste, sin reasignación de teclas, sin indicación no visual de eventos (relevante si en el futuro se añade sonido, para que también haya un equivalente visual). A revisar cuando se implemente el HUD final.
- **Onboarding**: no hay pantalla de instrucciones ni de controles; un jugador nuevo tiene que adivinar las teclas. Una pantalla inicial simple (o un overlay de ayuda) es deuda de UX pendiente antes de compartir el juego públicamente.

---

## Historial: conversación de planificación original

Lo siguiente es la conversación (en español) que originó la arquitectura del proyecto, conservada como contexto histórico de las decisiones tomadas. El estado actual de implementación está descrito en las secciones anteriores; esto documenta el *porqué* de fondo.

Sí, y de hecho **es una idea bastante interesante** si tu objetivo es desarrollar rápido y tener un despliegue gratuito. Pero tiene algunas limitaciones que conviene conocer.

### Lo que sí puedes hacer

Un juego tipo Tetris encaja perfectamente en una SPA estática.

Podrías tener una estructura como esta (estructura original propuesta; la estructura real implementada usa `src/` en vez de `js/`, ver más arriba):

```
/
├── index.html
├── css/
├── js/
│   ├── engine/
│   ├── renderer/
│   ├── network/
│   ├── ui/
│   └── app.js
├── assets/
└── manifest.json
```

Lo publicarías en GitHub Pages y sería accesible desde cualquier navegador.

Además, puedes convertirlo en una **PWA (Progressive Web App)**, lo que permite:

* Instalarlo como una app en Android e iPhone.
* Ejecutarlo a pantalla completa.
* Funcionar sin conexión (tras la primera carga).
* Actualizarse automáticamente cuando publiques una nueva versión.

Desde el punto de vista del usuario, se parecería mucho a una aplicación nativa.

---

### Rendimiento

Para un Tetris, JavaScript moderno es más que suficiente.

El juego consiste en:

* un tablero de 10×20 (200 celdas),
* una pieza activa,
* unas pocas comprobaciones de colisión por frame.

Incluso un móvil de hace 8-10 años puede moverlo a 60 FPS sin problemas.

---

### La parte difícil: el multijugador

Aquí aparecen las limitaciones del navegador.

#### Opción 1: WebRTC (la mejor)

Los navegadores soportan WebRTC de forma nativa.

```
Jugador A (Chrome)
        │
     WebRTC
        │
Jugador B (Safari)
```

Una vez establecida la conexión, los datos viajan directamente entre ambos dispositivos.

**El problema** es que WebRTC necesita un **servidor de señalización** para intercambiar la información inicial (SDP e ICE). Ese servidor **no participa en la partida**, solo ayuda a que ambos navegadores se encuentren.

Podría ser un pequeño servicio en Node.js o cualquier backend muy ligero.

---

#### Opción 2: Misma red Wi-Fi

Podrías intentar una conexión directa si ambos dispositivos están en la misma red, pero desde un navegador estándar es muy complicado porque:

* no puedes abrir sockets TCP arbitrarios,
* no puedes escuchar puertos libremente.

Las restricciones de seguridad del navegador lo impiden.

---

#### Opción 3: Bluetooth

Desde una web existe la API Web Bluetooth.

Pero:

* solo funciona en algunos navegadores,
* tiene limitaciones,
* Safari apenas la soporta.

No la usaría para un juego pensado para el público general.

---

### GitHub Pages

GitHub Pages es perfecto para alojar:

* HTML
* CSS
* JavaScript
* imágenes
* sonidos
* PWA

Pero **no puede ejecutar código del lado del servidor**.

Eso significa que **no puede actuar como servidor de señalización**.

---

### Solución práctica

Yo haría algo así:

```
GitHub Pages
       │
       │
Juego
       │
       ▼
WebRTC
       ▲
       │
Servidor de señalización
```

El servidor de señalización podría ser muy pequeño (por ejemplo, unas pocas decenas de líneas con WebSocket) y alojarse gratuitamente en plataformas que ofrecen planes gratuitos.

---

### ¿Y sin ningún servidor?

Es posible, pero menos cómodo.

Por ejemplo:

1. El jugador A genera una oferta WebRTC.
2. Se muestra un QR o un texto largo.
3. El jugador B lo escanea.
4. Genera una respuesta.
5. El jugador A la escanea.
6. A partir de ahí, la conexión es directa.

Funciona, pero la experiencia de usuario es bastante peor.

---

### Mi recomendación (original)

Si fuera un proyecto personal, empezaría con:

* **Frontend:** HTML + CSS + JavaScript (o TypeScript).
* **Renderizado:** Canvas 2D (no necesitas librerías al principio).
* **Despliegue:** GitHub Pages.
* **Instalable:** PWA.
* **Motor del juego:** completamente desacoplado de la interfaz.
* **Multijugador:** WebRTC con un pequeño servidor de señalización.

Ese enfoque tiene varias ventajas:

* **Coste casi nulo**: el juego puede alojarse gratuitamente en GitHub Pages.
* **Sin instalaciones**: basta con compartir una URL.
* **Multiplataforma**: funciona en Android, iPhone y escritorio desde el navegador.
* **Escalable**: si el proyecto crece, puedes migrar el frontend a un framework (Vue, React, etc.) sin reescribir el motor del juego.

Para un Tetris, personalmente me parece una de las arquitecturas con mejor relación entre simplicidad, coste y posibilidades de evolución.
