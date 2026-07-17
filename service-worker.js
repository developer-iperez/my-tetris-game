const CACHE_NAME = 'tetris-cache-v3';
const CACHED_ASSETS = [
  '.',
  'index.html',
  'css/styles.css',
  'dist/app.js',
  'dist/engine/constants.js',
  'dist/engine/piece.js',
  'dist/engine/board.js',
  'dist/engine/game.js',
  'dist/renderer/canvas-renderer.js',
  'dist/renderer/next-piece-renderer.js',
  'dist/ui/keyboard-controls.js',
  'dist/ui/hud.js',
  'manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHED_ASSETS)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request)),
  );
});
